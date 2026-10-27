"""Native MCP payload. Inject resolve and project; no filesystem access."""


def inspect_session(resolve, project):
    result = {"version": resolve.GetVersionString(), "project": None}
    if not project:
        return result
    pool = project.GetMediaPool()
    folders = []
    stack = [(pool.GetRootFolder(), [])]
    while stack:
        folder, parents = stack.pop()
        path = parents + [folder.GetName()]
        folders.append({"path": path, "id": folder.GetUniqueId(),
                        "clip_count": len(folder.GetClipList() or [])})
        stack.extend((child, path) for child in folder.GetSubFolderList() or [])
    timelines = []
    current = project.GetCurrentTimeline()
    for index in range(1, project.GetTimelineCount() + 1):
        timeline = project.GetTimelineByIndex(index)
        settings = timeline.GetSettings()
        timelines.append({"id": timeline.GetUniqueId(), "name": timeline.GetName(),
                          "start": timeline.GetStartFrame(), "end": timeline.GetEndFrame(),
                          "rate": settings.get("timelineFrameRate"),
                          "width": settings.get("timelineResolutionWidth"),
                          "height": settings.get("timelineResolutionHeight"),
                          "tracks": {kind: timeline.GetTrackCount(kind)
                                     for kind in ("video", "audio", "subtitle")}})
    result["project"] = {"id": project.GetUniqueId(), "name": project.GetName(),
                         "current_timeline_id": current.GetUniqueId() if current else None,
                         "timelines": timelines, "bins": folders}
    return result


try:
    resolve
except NameError:
    pass
else:
    result = inspect_session(resolve, project)
