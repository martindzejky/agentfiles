"""Native MCP payload. CONFIG requires project_id and timeline_id; reads only."""


def inspect_timeline(project, config):
    if not project or project.GetUniqueId() != config["project_id"]:
        raise ValueError("current project does not match requested project")
    matches = [project.GetTimelineByIndex(i)
               for i in range(1, project.GetTimelineCount() + 1)]
    matches = [t for t in matches if t.GetUniqueId() == config["timeline_id"]]
    if len(matches) != 1:
        raise ValueError("timeline id must match exactly once")
    timeline = matches[0]
    tracks = []
    for kind in ("video", "audio", "subtitle"):
        for index in range(1, timeline.GetTrackCount(kind) + 1):
            items = []
            for item in timeline.GetItemListInTrack(kind, index) or []:
                media = item.GetMediaPoolItem()
                row = {"id": item.GetUniqueId(), "name": item.GetName(),
                       "type": item.GetType(), "enabled": item.GetClipEnabled(),
                       "start": item.GetStart(True),
                       "end": item.GetEnd(True), "duration": item.GetDuration(True),
                       "media_id": media.GetUniqueId() if media else None}
                if media and kind in ("video", "audio"):
                    row.update({"source_start": item.GetSourceStartFrame(),
                                "source_end": item.GetSourceEndFrame(),
                                "linked_ids": [i.GetUniqueId() for i in item.GetLinkedItems() or []]})
                items.append(row)
            items.sort(key=lambda row: row["start"])
            intervals = []
            covered = None
            for row in items:
                if covered is not None and row["start"] != covered:
                    intervals.append({"kind": "gap" if row["start"] > covered else "overlap",
                                      "from": min(covered, row["start"]),
                                      "to": row["start"] if row["start"] > covered else min(covered, row["end"])})
                covered = max(covered, row["end"]) if covered is not None else row["end"]
            tracks.append({"type": kind, "index": index,
                           "name": timeline.GetTrackName(kind, index),
                           "enabled": timeline.GetIsTrackEnabled(kind, index),
                           "items": items, "intervals": intervals})
    return {"timeline_id": timeline.GetUniqueId(), "name": timeline.GetName(),
            "start": timeline.GetStartFrame(), "end": timeline.GetEndFrame(),
            "tracks": tracks}


try:
    resolve
except NameError:
    pass
else:
    result = inspect_timeline(project, CONFIG)
