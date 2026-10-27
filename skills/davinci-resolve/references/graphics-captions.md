# Captions and Fusion graphics

## Captions

Inspect `Timeline.CreateSubtitlesFromAudio(AutoCaptionSettings)` and the project's subtitle-generation status API. Set language, caption preset, line-break and gap options from the installed definitions and requested format. Start once; poll documented status in later calls. Inspect subtitle track items and play representative captions, including long lines, names, punctuation, speakers and cut boundaries.

Generate captions against the actual edited timeline. Source transcript timestamps do not remain timeline timestamps after cuts/retimes. For external SRT/VTT, explicitly map cue times through the edit and preserve encoding/language. Verify the installed import route rather than inventing an `ImportSubtitles` method. If the API does not expose a suitable route, use the UI/interchange path and say so. Exported captions need a round-trip check; burn-in versus sidecar is a delivery choice.

For title/caption styling, read [template and subtitle field notes](field-notes.md#titles-and-animated-captions). Use full template IDs, preserve animated/connected inputs and active gradient/image fills, and distinguish ordinary title inputs from subtitle text/word timing/preset holders. Render-check base text and highlight colors separately, word phases, gaps and safe margins. The community’s export/patch/import helper is not a native setter available here; routine caption work must not write an open project database.

## Inspect a Fusion composition

Resolve item methods expose `GetFusionCompCount`, names and `GetFusionCompByIndex` (1-based). Use the existing comp for a title edit rather than adding another one.

```python
comp = item.GetFusionCompByIndex(1)
if not comp:
    raise RuntimeError("target item has no Fusion composition")
tools = comp.GetToolList(False) or {}
result = [{"key": str(key), "attributes": tool.GetAttrs(),
           "inputs": [value.GetAttrs() for value in (tool.GetInputList() or {}).values()]}
          for key, tool in tools.items()]
```

Use `fusion_api.pyi` for actual tool/input/animation methods. Find the intended tool by returned name/ID; templates may contain several Text+ tools. Inspect its input IDs, existing values, animation and comp frame origin before changing `StyledText` or other inputs. Do not assume UI labels are input IDs.

For writes, group a small change with `StartUndo`/`EndUndo`. Reserve `Lock`/`Unlock` in `try/finally` for structural graph changes; unlock before parameter/value writes. A community report on 19.1.3.7 found locked first-value writes could read back correctly while failing to invalidate the render. Inspect actual rendered output as well as inputs; see [Fusion field notes](field-notes.md#fusion-writes-and-discovery). Confirm `SetInput`'s current time argument; composition time can differ from timeline/source frames. Undo grouping is not a cross-API transaction or a substitute for a duplicate timeline.

## Create or modify graphics

Discover registered tools and actual inputs, then add/connect only what is needed. A media-clip composition should retain a valid MediaIn-to-MediaOut path for picture. A title/generator has a different source graph. Validate graph connectivity and inspect a rendered short segment; a node's presence in the comp does not prove it contributes to output.

For inserting titles, search current timeline insertion APIs and verify destination placement. Do not assume a `trackIndex` argument exists. Inspect resulting track/span; move through supported UI/interchange operations if placement is not exposed. Avoid presenting a title on the wrong track as completed work.

In the [local trial](field-notes.md#local-native-mcp-trial), adjustment-clip insertion could overwrite the targeted V1 even with upper tracks available; locking footage did not reliably redirect it. Do not unlock footage and retry as a targeting workaround. A manual handoff is appropriate when the API lacks a safe placement route. Existing single graphic placeholders can instead use the measured [editable Fusion overlay recipe](fusion-overlay.md), which preserves their placement without inserting at the playhead.

Installed `.drfx` archives can be inspected for template/settings identifiers, but that does not establish a working attachment method. A macro `LoadSettings` success without the expected nodes/controls and rendered effect is not completion. Inspect once after an ambiguous write; do not repeatedly paste/load into the working composition.

Animation needs first/middle/last and motion checks. Verify text wrapping, fonts, alpha, safe areas and readability in every requested aspect ratio. Use requested assets or the user's asset-generation tools; do not substitute decorative templates as a personal house style.
