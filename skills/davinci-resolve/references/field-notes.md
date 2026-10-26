# Community field experience

These are operational lessons adapted from the community repository at `931bc2cda8fd9049982a457de9ff70836c406cd7`, not locally reproduced results. Preserve each report's scope. An older-build failure is a reason to choose a safer path and verify, not proof that installed Studio 21.1.1 has the same bug. Links below point to the inspected snapshot; the MIT notice is in [../LICENSE](../LICENSE).

Read only the sections relevant to the task: [render state](#render-state-and-completion), [persistence](#saved-state-and-project-switches), [timebases](#source-frames-audio-and-timecode), [Fusion](#fusion-writes-and-discovery), [interchange](#interchange-selection), [archives](#media-inclusive-archives), [captions](#titles-and-animated-captions), [analysis](#analysis-coverage-and-silence), [color](#color-witnesses-and-write-only-controls).

## Render state and completion

The [delivery skill](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/.agents/skills/resolve-delivery/SKILL.md) reports that render settings **overlay** inherited Deliver/preset state. An Audio Only base plus `ExportVideo: true` queued a job claiming video export but produced an MP4 without video. Load a known compatible video preset before applying overrides, set the intended render mode explicitly, and verify actual video/audio streams in a short output. A job's settings readback is not proof of the encoded content.

The [API ledger](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/docs/reference/api-limitations.md) records these additional traps:

- `JobStatus` is localized: Studio 21.0.2.4/macOS reported Italian `Concluso` for a complete job. Do not compare only against English `Complete`. Inspect numeric progress, error details, render activity and the actual output; report the original status for humans. A 100% counter still needs output QC.
- `SetRenderSettings` can ignore unknown keys. `UseFullExtents`, `AddFrameHandles` and `DataBurnIn` were added in 21.0.4; handles can also be ignored when full extents is enabled. Match the installed definitions and inspect the resulting range/output.
- There is no documented `GetRenderSettings` in the inspected native API. Queue entries expose useful settings, but creating a probe job changes the queue/page. If using one, identify and remove only that probe; do not claim the operation was read-only. On 19.1.3.7, some output settings could neither be read directly nor cleared. Prefer a private output directory and minimize changes to the user's Deliver state.
- Some builds expose formats with empty codec maps. Do not guess codec IDs or silently retain a previously selected codec. Consult the current audio-specific APIs or an existing compatible preset; older WAV-selection failures do not establish a current universal limitation.

## Saved state and project switches

The [API ledger](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/docs/reference/api-limitations.md) reports a real turnover where an errored append chunk appeared in every in-session read, then disappeared on save: 573 items became 500. The entry does not specify an exact build. Treat placements from failed calls as suspect even when visible. After an authorized construction/save, check `SaveProject()` succeeded and re-read item counts, source/record spans, tracks and links. When a safely reloaded project or exported artifact is available, compare that independent saved representation too. Do not claim persistence from pre-save readback alone.

The assembly helper intentionally does not save. Its `ok` means in-session placement checks passed, not that the project was durably saved. Keep save/persistence verification in the surrounding workflow. If a saved cut differs, report the discrepancy and reconcile the missing ranges explicitly; do not rerun the whole assembly or duplicate visible items automatically.

On Studio 19.1.3.7, creating a scratch project discarded an unsaved current project without a dialog. Before switching/creating projects for a legitimate task, save the current project and stop if saving fails. A temporary timeline inside the chosen project is often enough; do not create scratch projects incidentally. Record the current timeline, page and playhead before preview work and restore the context you changed.

## Source frames, audio and timecode

The [source-frame entries](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/docs/reference/api-limitations.md) document multiple independent problems. Do not compress them into one off-by-one adjustment:

- A WAV can retain the project's rate **at import** as its source-frame rate. Read the item's media rate; neither the current timeline rate nor a hardcoded 24 is a valid substitute. Audio sample rate is a different unit.
- `GetSourceStartTime`/`GetSourceEndTime` can be **media-timecode absolute**, while `GetSourceStartFrame` is file-relative. A timecoded 29.97 clip on a 24 fps timeline reproduced this on 19.1.3.7. Multiplying an absolute source time by FPS can return a frame far beyond the file length. When these readers are valid, the seconds **span** cancels the common origin; combine that span with an independently checked file-relative start. Do not use an absolute second-reader as a file-relative frame position.
- `GetLeftOffset` and `GetSourceStartFrame` disagreed by one on some 100%-speed placements. Left offset can be a useful additional witness there, but retimed clips put it in a different domain. Never substitute it blindly for source frames.
- Mixed-rate placement quantizes duration in timeline frames. Source-end getters have also differed by rate regime. Confirm units/origins/endpoint conventions with a small known range; compare a rendered content anchor as well as getters. A mismatch is not permission to change endpoints or add a tolerance until the check passes.

The helper's same-rate restriction avoids much mixed-rate conversion, but it does not prove every native getter reliable. Its strict readback can refuse a correctly placed item on an affected build. Stop and diagnose using multiple witnesses before adapting the helper. Do not weaken its validation based solely on these historical reports.

## Fusion writes and discovery

The [Fusion ledger entries](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/docs/reference/api-limitations.md) isolate a Studio 19.1.3.7 bug: a first parameter write under `Composition.Lock()` on certain lock-built graphs read back correctly but did not invalidate the render. Structural `AddTool`/`ConnectInput` edits were unaffected. Prior unlocked writes or undo grouping could mask reproduction.

For our recipes, reserve locking for structural graph changes and unlock before parameter/value writes. Use undo grouping for a recoverable small change and inspect the rendered result. `GetInput` alone cannot catch this failure. Do not use an already-primed graph as proof the first-write trap is absent.

`hasattr` can fabricate support on Resolve proxies. Fusion Tool `dir()` can also omit documented working methods (`GetAttrs`/`SetAttrs`, measured free 21.0.3.7). Treat enumeration as a clue, not authoritative absence; consult the Fusion stub and make a controlled documented call. Do not turn a documentation-backed Fusion method into a universal capability exception for unrelated objects.

## Interchange selection

The [headless edit loop](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/docs/guides/headless-edit-loop.md) measured GUI and headless round trips on Studio 19.1.3.7. Its results guide format choice; they do not certify newer builds or arbitrary edits:

| Format      | Reported field tradeoff                                                                                             | Check before using it                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| DRT         | Best preservation in the rich fixture, but reimported media and lacked that route's moved-media relink/name options | Use for native backup/one-shot handoff; inspect pool growth and paths. Do not loop imports assuming pool reuse. |
| FCP7 XML    | Reused pool sources and preserved most transforms; lost FlipX, colors and markers                                   | Useful iteration candidate; compare all required state, not only cut lengths.                                   |
| AAF         | Relinked moved media but reset transforms in the fixture                                                            | Recheck framing and per-channel audio events; duplicate channel legs are not necessarily duplicate edits.       |
| FCPXML 1.10 | Exported a bundle; rich fixture lost an audio track                                                                 | Inspect bundle members and import the actual XML; count/listen to audio tracks.                                 |
| OTIO        | Pool-reuse import could arrive offline; document shape/media origin mattered                                        | Diff against Resolve's own export, including media timecode origin, reference shape and paths.                  |
| EDL         | Suitable only for the tested flat timecoded cut; poor state/track preservation                                      | Do not extrapolate that result to layered/retimed/effectful edits.                                              |

Use a unique import name **and** inspect the file's internal sequence name. On Studio 21.0.4.5, an old internal XML name could win over `timelineName` and return the existing timeline. Compare pre/post timeline IDs and inventory; do not trust a non-null import result to mean a new revision exists. DRT import options differ from XML options; inspect the current `ImportOptions` definition.

Do not change to headless mode just to solve an interchange problem. Some community external-bridge installations booted an unscriptable headless instance that blocked GUI startup. This is not evidence about the native MCP; keep the user's existing execution mode unless the task requires otherwise.

## Media-inclusive archives

The [archive report](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/docs/reference/project-archive.md) measured macOS Studio 21.1.0.14: source/proxy-media archive calls crashed 4/4; flags-off calls wrote nothing. Unsaved open work was at risk. The report explicitly leaves later builds and Windows/Linux untested.

Do not casually test `ArchiveProject`'s media-inclusive defaults against the working project. For an ordinary backup, use project/timeline export and retain original media separately. If a media-inclusive archive is requested, save first, check current-build evidence, and use a disposable fixture before relying on API archiving; the UI is another route to verify. Never claim a usable archive merely because the target directory appeared or a call returned. Restore into a separate destination and verify the included media.

## Titles and animated captions

The [title guide](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/docs/guides/title-library-automation.md) and [subtitle guide](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/docs/guides/subtitle-track-editing.md) include Studio 21.1.0.17/Windows tests, not Mac acceptance.

- Use full template IDs; a leaf name can identify both an ordinary title and an animated subtitle. Inspect `TEMPLATE_ID` where available.
- Templates can use TextPlus, sText, Text3D, MultiText or text modifiers. Do not overwrite connected/animated inputs or assume one tool called `Template`. MultiText list labels are not necessarily rendered text.
- A solid RGB value can be dormant under gradient/image shading. Discover the active fill/shading controls; preserve that mode unless changing it is requested.
- Subtitle-track styling, animated preset holders, caption text and word timing are separate surfaces. Ordinary title setters do not establish subtitle-edit support. SRT cue timing does not prove word-level highlight timing survived.
- Verify base text color separately from highlight color, actual words, word phases, caption gaps and safe margins in rendered frames. The community found a passing timing test had missed the wrong base text color.

Their live subtitle-preset helper does native export/patch/import into a recoverable revision; it is not a native subtitle setter available to us. Its inventory checks did not establish preservation of all grades, markers, other Fusion or audio content. Direct project-database writes are a separate specialized maintenance route that required saving and **fully quitting** Resolve, backups and transactions. Do not import that route into routine caption work or write an open project database.

## Analysis coverage and silence

The [editorial guide](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/docs/guides/editorial-decision-guide.md) separates analysis coverage from editorial confidence. In our sidecar workflow, check which clips/regions actually have current transcript/visual evidence before proposing an edit. A relink/replacement invalidates prior content analysis even if its label remains. Recheck markers against frames; names and notes are not evidence. Report material coverage gaps without adopting their server-specific reporting format or house style.

The [audio skill](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/.agents/skills/resolve-audio/SKILL.md) explains why a fixed gate can classify an entire quiet program as silence. Measure representative speech/room dynamics with `astats` and inspect a short candidate pass. If speech and background are not separable, keep the region and report uncertainty; use transcript/visual/manual review instead. Do not copy their calibration algorithm or assume `astats` trough/peak alone reliably identifies speech. Preserve meaningful silent demonstrations and review large lifts.

## Color witnesses and write-only controls

The [color skill](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/.agents/skills/resolve-color/SKILL.md) and [API ledger](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/docs/reference/api-limitations.md) distinguish applied values from actual image quality. Inspect representative **Resolve-rendered** frames before grading and compare matching frames afterward. Source FFmpeg frames do not include the active Resolve grade/OFX/Fusion pipeline. Check clipping, banding, noise and damaged contrast in the real output, accounting for log/HDR/color management.

`ApplyGradeFromDRX` replaces the grade graph; do not assume it appends. The inspected API lacks direct getters for CDL values and node-enabled state. Do not promise a generic settings snapshot can restore these or temporarily toggle an unknown bypass state. Preserve a version/still/DRX as appropriate and verify visually; check installed docs for new readers before assuming the limitation persists.

On 19.1.3.7, clip thumbnails required Color-page/foreground context and settling, while Gallery still export required the Gallery panel visible. An empty thumbnail or failed still export is not proof the clip has no image. Check UI context with available tools, use a bounded retry for settling, or render a short frame. Avoid blindly cycling export formats or inventing UI menu paths.
