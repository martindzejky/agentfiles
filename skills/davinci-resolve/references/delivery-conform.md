# Delivery, conform and turnover

## Prepare a render

Confirm timeline ID, target folder/name, full timeline versus range, resolution/rate, codec, audio tracks/layout and caption delivery. Discover installed formats/codecs/presets; do not hardcode platform-specific encoder IDs.

```python
result = {"formats": project.GetRenderFormats(),
          "presets": project.GetRenderPresetList(),
          "current": project.GetCurrentRenderFormatAndCodec(),
          "jobs": project.GetRenderJobList()}
```

Use `GetRenderCodecs(format_extension)` with the returned extension, then `SetCurrentRenderFormatAndCodec(format, codec)`. Inspect `RenderSettings` and current render mode. Loading a preset can change other settings; read back the format/codec and queued job details after configuration.

Example settings after selecting the correct timeline and verified preset/codec:

```python
if not project.SetRenderSettings({"TargetDir": output_directory,
                                  "CustomName": output_name,
                                  "SelectAllFrames": True,
                                  "ExportVideo": True, "ExportAudio": True}):
    raise RuntimeError("render settings rejected; inspect partial state")
job_id = project.AddRenderJob()
if not job_id:
    raise RuntimeError("render job not queued")
result = {"job_id": job_id, "jobs": project.GetRenderJobList()}
```

Queueing is separate from starting. Inspect the job's timeline, range, output and audio; start only the requested IDs with `StartRendering([job_id])`, not the whole existing queue. In subsequent calls use `GetRenderJobStatus(job_id)`; retain IDs as strings. Do not delete unrelated jobs or restart rendering to obtain status. On timeout inspect the queue/job before retrying. Rendering is asynchronous and can outlast a tool call.

Output overwrite behavior needs checking before start. Choose a fresh filename or confirm replacement of the specific output. For subtitles inspect `ExportSubtitle`/`SubtitleFormat`; sidecar and burn-in are different deliverables. Query Quick Export's current API if using it; a queue render and Quick Export have different lifecycle/status surfaces.

## Output QC

Probe the rendered file with `probe_media.py`; compare actual duration, dimensions, frame-rate/timebase, codec, pixel format, color tags, audio sample rate/channels and expected subtitle streams/files. Run FFmpeg black/freeze/loudness checks from [analysis.md](analysis.md) when relevant. Inspect representative rendered frames and actual transitions/first/last frames; play the output and listen to dialogue/music/joins. A completed render status is not content QC.

## Timeline inspection and comparison

Use `inspect_timeline.py` on both timeline IDs. Compare source identities, source ranges, record positions, track/enabled/link state and duration against the intended change. Its raw API end coordinates are not normalized interchange ranges. Interpret same-track overlaps in context (transitions can be intentional); cross-track overlap is often normal. Verify main picture/audio coverage separately from B-roll overlays. Check leading/trailing coverage against the intended program range because the helper reports internal intervals only.

Gaplessness, item count and equal total duration are insufficient: the wrong source frames can meet all three. Check known speech/action anchors and audio presence too.

## Interchange

Use `Timeline.Export(fileName, exportType, exportSubtype)` with constants from the current API. Example for a native timeline backup:

```python
if not timeline.Export(output_path, resolve.EXPORT_DRT, resolve.EXPORT_NONE):
    raise RuntimeError("timeline export failed")
result = {"timeline_id": timeline.GetUniqueId(), "path": output_path}
```

For AAF/EDL/XML/FCPXML/OTIO choose a documented format and its subtype. Native DRT retains different state from interchange formats. Export success does not prove media/effects/sync survived. Import into a clearly named test timeline/project using `MediaPool.ImportTimelineFromFile` and current `ImportOptions`; inspect naming collisions, offline media, source timecodes/handles, effects, retimes, transitions, tracks and audio. Avoid repeatedly importing a same-named file and assuming each call replaced the intended timeline. FCPXML can produce a bundle rather than a single XML file; inspect actual outputs.

## Project backup/archive

`ProjectManager.ExportProject` exports project data; it does not by itself copy all camera originals. For media-inclusive archive/restore, search the installed ProjectManager archive methods and options. Inspect output space, media/proxy/cache inclusion and path remapping before a large archive. Restore into a separately named destination for verification; do not replace the working project as a test. Preserve originals until the restored project and representative media resolve correctly. No direct database patching is needed for ordinary backup.
