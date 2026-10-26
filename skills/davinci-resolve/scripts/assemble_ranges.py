"""Native payload: prepend validate_edit_plan.py and inject CONFIG = edit plan."""


def assemble_ranges(project, plan):
    summary = validate_plan(plan)
    if not project or project.GetUniqueId() != plan["project_id"]:
        raise ValueError("current project does not match plan")
    names = [project.GetTimelineByIndex(i).GetName()
             for i in range(1, project.GetTimelineCount() + 1)]
    if plan["timeline_name"] in names:
        raise ValueError("timeline name already exists; choose a new name")
    pool = project.GetMediaPool()
    source_objects = {}
    pending = [pool.GetRootFolder()]
    wanted = {s["id"]: s for s in plan["sources"]}
    while pending:
        folder = pending.pop()
        pending.extend(folder.GetSubFolderList() or [])
        for media in folder.GetClipList() or []:
            media_id = media.GetUniqueId()
            if media_id not in wanted:
                continue
            if media_id in source_objects:
                raise ValueError("ambiguous media id: " + media_id)
            source_objects[media_id] = media
    if set(source_objects) != set(wanted):
        raise ValueError("source ids missing from media pool")
    expected_rate = plan["rate"][0] / plan["rate"][1]
    for media_id, media in source_objects.items():
        properties = media.GetClipProperty()
        source = wanted[media_id]
        if properties.get("File Path") != source["path"]:
            raise ValueError("source path changed: " + media_id)
        try:
            actual_frames = int(properties.get("Frames", ""))
            actual_rate = float(properties.get("FPS", ""))
        except (TypeError, ValueError):
            raise ValueError("source lacks numeric Frames/FPS; use a separate timebase recipe: " + media_id)
        if actual_frames != source["frames"]:
            raise ValueError("source frame count changed: " + media_id)
        # Resolve can report fractional frame rates as rounded decimal strings.
        if abs(actual_rate - expected_rate) > 0.005:
            raise ValueError("source rate differs from plan: " + media_id)

    previous = project.GetCurrentTimeline()
    timeline = None
    report = {"ok": False, "created_timeline_id": None,
              "appended": [], "plan_summary": summary}
    try:
        timeline = pool.CreateEmptyTimeline(plan["timeline_name"])
        if not timeline:
            raise RuntimeError("timeline creation failed")
        report["created_timeline_id"] = timeline.GetUniqueId()
        if not project.SetCurrentTimeline(timeline):
            raise RuntimeError("cannot activate new timeline")
        settings = {"useCustomSettings": "1",
                    "timelineFrameRate": str(round(expected_rate, 3))}
        if not timeline.SetSettings(settings):
            raise RuntimeError("cannot set new timeline frame rate")
        if abs(float(timeline.GetSettings()["timelineFrameRate"]) - expected_rate) > 0.005:
            raise RuntimeError("timeline frame rate readback differs")
        if not timeline.SetStartTimecode(plan["start_timecode"]):
            raise RuntimeError("cannot set timeline start timecode")
        if timeline.GetStartTimecode() != plan["start_timecode"]:
            raise RuntimeError("timeline start timecode readback differs")
        origin = timeline.GetStartFrame()
        for media_type, kind in ((1, "video"), (2, "audio")):
            count = max((r["track"] for r in plan["ranges"]
                         if r["media_type"] == media_type), default=0)
            while timeline.GetTrackCount(kind) < count:
                # Plain assembly uses stereo audio tracks; multichannel needs another recipe.
                added = timeline.AddTrack(kind, "stereo") if kind == "audio" else timeline.AddTrack(kind)
                if not added:
                    raise RuntimeError("cannot create destination track")
        link_groups = {}
        for entry in plan["ranges"]:
            native_out = entry["out"] - (1 if plan["native_end"] == "inclusive" else 0)
            appended = pool.AppendToTimeline([{
                "mediaPoolItem": source_objects[entry["source_id"]],
                "startFrame": entry["in"], "endFrame": native_out,
                "recordFrame": origin + entry["record"],
                "trackIndex": entry["track"], "mediaType": entry["media_type"],
            }])
            if not appended or len(appended) != 1:
                raise RuntimeError("append did not return exactly one item")
            item = appended[0]
            actual = {"id": item.GetUniqueId(), "start": item.GetStart(),
                      "duration": item.GetDuration(),
                      "source_start": item.GetSourceStartFrame(),
                      "source_end": item.GetSourceEndFrame()}
            report["appended"].append(actual)
            if (actual["start"] != origin + entry["record"]
                    or actual["duration"] != entry["out"] - entry["in"]
                    or actual["source_start"] != entry["in"]
                    or actual["source_end"] != native_out):
                raise RuntimeError("range readback differs; stop and probe endpoint/timebase semantics")
            kind = "video" if entry["media_type"] == 1 else "audio"
            track_ids = [i.GetUniqueId() for i in timeline.GetItemListInTrack(kind, entry["track"]) or []]
            media = item.GetMediaPoolItem()
            if item.GetUniqueId() not in track_ids or not media or media.GetUniqueId() != entry["source_id"]:
                raise RuntimeError("destination track/source identity readback differs")
            if entry.get("link"):
                link_groups.setdefault(entry["link"], []).append(item)
        for items in link_groups.values():
            if not timeline.SetClipsLinked(items, True):
                raise RuntimeError("linking audio/video failed")
            group_ids = {i.GetUniqueId() for i in items}
            for item in items:
                linked = {i.GetUniqueId() for i in item.GetLinkedItems() or []}
                if not group_ids - {item.GetUniqueId()} <= linked:
                    raise RuntimeError("audio/video link readback differs")
        report["ok"] = True
    except Exception as error:
        report["error"] = str(error)
        report["partial_timeline_retained"] = timeline is not None
    finally:
        if previous:
            report["previous_timeline_restored"] = bool(project.SetCurrentTimeline(previous))
        else:
            report["previous_timeline_restored"] = None
    return report


if "resolve" in globals():
    result = assemble_ranges(project, CONFIG)
