"""Validate plain-source assembly plans; also prepend this file to native payloads."""


def positive_integer(value, label):
    if type(value) is not int or value <= 0:
        raise ValueError(label + " must be a positive integer")
    return value


def integer(value, label):
    if type(value) is not int:
        raise ValueError(label + " must be an integer")
    return value


def rate(value):
    if not isinstance(value, list) or len(value) != 2:
        raise ValueError("rate must be [numerator, denominator]")
    return [positive_integer(value[0], "rate numerator"),
            positive_integer(value[1], "rate denominator")]


def same_rate(left, right):
    return left[0] * right[1] == right[0] * left[1]


def validate_plan(plan):
    """Raise before writes; ranges use source [in, out) and relative record frames."""
    if not isinstance(plan, dict) or type(plan.get("version")) is not int or plan["version"] != 1:
        raise ValueError("plan version must be 1")
    for key in ("project_id", "timeline_name", "start_timecode"):
        if not isinstance(plan.get(key), str) or not plan[key].strip():
            raise ValueError(key + " must be a nonempty string")
    timeline_rate = rate(plan.get("rate"))
    parts = plan["start_timecode"].replace(";", ":").split(":")
    nominal_rate = (timeline_rate[0] + timeline_rate[1] - 1) // timeline_rate[1]
    if (len(parts) != 4 or any(len(p) != 2 or not p.isascii() or not p.isdigit() for p in parts)
            or int(parts[0]) > 23 or int(parts[1]) > 59 or int(parts[2]) > 59
            or int(parts[3]) >= nominal_rate):
        raise ValueError("start_timecode must be a valid HH:MM:SS:FF or HH:MM:SS;FF")
    if plan.get("native_end") not in ("inclusive", "exclusive"):
        raise ValueError("native_end must explicitly be inclusive or exclusive")
    sources = plan.get("sources")
    if not isinstance(sources, list) or not sources:
        raise ValueError("sources must be a nonempty list")
    source_by_id = {}
    for source in sources:
        if not isinstance(source, dict):
            raise ValueError("each source must be an object")
        source_id = source.get("id")
        if not isinstance(source_id, str) or not source_id:
            raise ValueError("source id must be a nonempty string")
        if source_id in source_by_id:
            raise ValueError("duplicate source id: " + source_id)
        if not isinstance(source.get("path"), str) or not source["path"]:
            raise ValueError("source path required: " + source_id)
        positive_integer(source.get("frames"), "source frames")
        if source.get("kind") != "plain" or source.get("cfr") is not True:
            raise ValueError("only explicitly confirmed plain CFR sources supported")
        if not same_rate(rate(source.get("rate")), timeline_rate):
            raise ValueError("mixed source/timeline rates require a separate recipe")
        for key in ("has_video", "has_audio"):
            if type(source.get(key)) is not bool:
                raise ValueError("source " + key + " must be boolean")
        source_by_id[source_id] = source
    ranges = plan.get("ranges")
    if not isinstance(ranges, list) or not 1 <= len(ranges) <= 100:
        raise ValueError("ranges must contain 1..100 entries; use bounded assemblies")
    tracks = {}
    links = {}
    used = set()
    for entry in ranges:
        if not isinstance(entry, dict):
            raise ValueError("each range must be an object")
        if not isinstance(entry.get("source_id"), str):
            raise ValueError("range source_id must be a string")
        source = source_by_id.get(entry["source_id"])
        if source is None:
            raise ValueError("unknown source id")
        used.add(source["id"])
        start = integer(entry.get("in"), "source in")
        end = integer(entry.get("out"), "source out")
        record = integer(entry.get("record"), "relative record")
        if not 0 <= start < end <= source["frames"] or record < 0:
            raise ValueError("invalid source bounds or negative record frame")
        track = positive_integer(entry.get("track"), "track")
        if track > 64:
            raise ValueError("track exceeds helper limit of 64")
        media_type = entry.get("media_type")
        if type(media_type) is not int or media_type not in (1, 2):
            raise ValueError("media_type must be 1 (video) or 2 (audio)")
        if not source["has_video" if media_type == 1 else "has_audio"]:
            raise ValueError("source does not contain requested stream type")
        tracks.setdefault((media_type, track), []).append((record, record + end - start))
        link = entry.get("link")
        if link is not None:
            if not isinstance(link, str) or not link:
                raise ValueError("link must be a nonempty group name")
            links.setdefault(link, []).append(entry)
    if used != set(source_by_id):
        raise ValueError("remove unused sources from plan")
    for spans in tracks.values():
        spans.sort()
        if any(right[0] < left[1] for left, right in zip(spans, spans[1:])):
            raise ValueError("overlapping ranges on the same destination track")
    for entries in links.values():
        if len(entries) < 2 or len({e["media_type"] for e in entries}) != 2:
            raise ValueError("link groups need both video and audio")
        if len({(e["record"], e["out"] - e["in"]) for e in entries}) != 1:
            raise ValueError("linked ranges must share record position and duration")
    return {"range_count": len(ranges), "source_count": len(sources),
            "duration_frames": max(e["record"] + e["out"] - e["in"] for e in ranges)}


if __name__ == "__main__" and "resolve" not in globals():
    import argparse
    import json

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("plan", help="JSON edit plan; no writes performed")
    args = parser.parse_args()
    try:
        with open(args.plan, encoding="utf-8") as handle:
            print(json.dumps(validate_plan(json.load(handle)), indent=2))
    except (ValueError, OSError) as error:
        parser.exit(1, str(error) + "\n")
