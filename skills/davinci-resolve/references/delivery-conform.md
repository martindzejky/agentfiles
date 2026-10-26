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

Render settings overlay existing Deliver state; pin a known compatible video preset before overrides. An inherited Audio Only base has reportedly produced no video despite the queued video flag. Do not invent `GetRenderSettings`; queued settings are only a partial witness. See [render field notes](field-notes.md#render-state-and-completion).

Example full-program video settings after selecting the correct timeline and discovering a compatible `preset_name`:

```python
if not project.LoadRenderPreset(preset_name):
    raise RuntimeError("base preset not loaded; do not inherit unknown render state")
if not project.SetCurrentRenderFormatAndCodec(format_id, codec_id):
    raise RuntimeError("requested format/codec not selected")
if not project.SetCurrentRenderMode(1):
    raise RuntimeError("single-clip render mode not selected")
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

Queueing is separate from starting. Inspect the job's timeline, range, output and audio; start only the requested IDs with `StartRendering([job_id])`, not the whole existing queue. In subsequent calls use `GetRenderJobStatus(job_id)`; retain IDs as strings. Do not delete unrelated jobs or restart rendering to obtain status. On timeout inspect the queue/job before retrying. Rendering is asynchronous and can outlast a tool call. `JobStatus` can be localized, so do not match only English `Complete`. Use numeric progress, errors, render activity and actual output checks; no status string or percentage alone proves successful delivery.

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

For choosing a format and import strategy, read the [measured interchange tradeoffs](field-notes.md#interchange-selection). They cover DRT media duplication, XML internal-name collisions, audio/transform losses and OTIO media-origin requirements. Verify both the returned timeline ID and expected inventory; a non-null import can still identify an old timeline. Older measurements are test leads, not current-build guarantees.

## Project backup/archive

`ProjectManager.ExportProject` exports project data; it does not by itself copy all camera originals. Read the [archive crash report](field-notes.md#media-inclusive-archives) before API archiving: source/proxy flags crashed macOS Studio 21.1.0.14, and later builds were untested. Prefer project/timeline exports plus preserved media for routine backup. If media-inclusive archiving is requested, save first and validate the current API/UI route with a disposable fixture before relying on it. Inspect output space, media/proxy/cache inclusion and path remapping before a large archive. Restore into a separately named destination for verification; do not replace the working project as a test. Preserve originals until the restored project and representative media resolve correctly. No direct database patching is needed for ordinary backup.
