# Workflow catalog

Read the linked reference for the requested operation. Native snippets require the target objects/configuration identified in that reference. They are recipes based on installed 21.1 documentation, not reports of live tests.

| Request                                             | Recipe and implementation                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Orient in an existing project                       | [Native MCP](native-mcp.md): `inspect_session.py`, then `inspect_timeline.py`                                             |
| Inventory a folder of footage                       | [Ingest](ingest.md): `probe_media.py`, stable media IDs and paths                                                         |
| Import and organize clips or image sequences        | [Ingest](ingest.md): select destination bin before import, restore folder afterward                                       |
| Metadata, flags, clip colors, review markers        | [Ingest](ingest.md): inspect fields, scoped updates and annotation readback                                               |
| Offline media, relink, proxies                      | [Ingest](ingest.md): report, exact source mapping, checked relink/proxy association                                       |
| Transcribe footage or locate a spoken passage       | [Analysis](analysis.md): native transcription or ElevenLabs with explicit time basis                                      |
| Find shots, scenes, black/frozen frames             | [Analysis](analysis.md): FFmpeg candidates, timestamped contact sheets, vision review                                     |
| Remove dead air or repeated takes                   | [Editing](editing.md): evidence-based keep plan, review removals, new timeline                                            |
| Selects, multi-clip rough cut or B-roll             | [Editing](editing.md): validate plan, assemble plain-source ranges, inspect A/V                                           |
| Move/copy/trim a finished layered edit              | [Editing](editing.md): duplicate/interchange route; do not rebuild source ranges blindly                                  |
| Reframe, resize, transitions, fades, speed          | [Editing](editing.md): current property/transition/speed APIs and boundary checks                                         |
| Screen/camera sync or external audio                | [Audio and sync](audio-sync.md): measured offsets/drift, linked mapping                                                   |
| Multicam                                            | [Audio and sync](audio-sync.md): native clip creation, alignment and audio policy                                         |
| Dialogue cleanup, levels, narration, music, SFX     | [Audio and sync](audio-sync.md) and [toolkit](toolkit.md)                                                                 |
| Captions, title text, simple motion graphics        | [Graphics and captions](graphics-captions.md): native subtitles, Fusion tool/input discovery                              |
| Grade versions, CDL/LUT/DRX, stills, DCTL           | [Color](color.md): scoped grades and before/after comparisons                                                             |
| Render, codec/preset choice, job monitoring         | [Delivery and conform](delivery-conform.md): discover settings, retain job IDs, output QC                                 |
| Compare variants or interchange with another editor | [Delivery and conform](delivery-conform.md): source/record spans, exports/imports and round trips                         |
| Back up/archive a project                           | [Delivery and conform](delivery-conform.md): distinguish project export from media archive                                |
| AI analysis, stabilization/tracking, extensions     | Search current APIs first; [sources](sources.md) for advanced leads. UI/plugin features are not automatically scriptable. |

The five bundled helpers cover inspection, probing, plan validation and conservative assembly. Other rows provide native API/CLI recipes; they do not depend on the community server being installed. Personal house style and previous-project learning are outside this catalog.
