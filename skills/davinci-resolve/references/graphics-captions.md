# Captions and Fusion graphics

## Captions

Inspect `Timeline.CreateSubtitlesFromAudio(AutoCaptionSettings)` and the project's subtitle-generation status API. Set language, caption preset, line-break and gap options from the installed definitions and requested format. Start once; poll documented status in later calls. Inspect subtitle track items and play representative captions, including long lines, names, punctuation, speakers and cut boundaries.

Generate captions against the actual edited timeline. Source transcript timestamps do not remain timeline timestamps after cuts/retimes. For external SRT/VTT, explicitly map cue times through the edit and preserve encoding/language. Verify the installed import route rather than inventing an `ImportSubtitles` method. If the API does not expose a suitable route, use the UI/interchange path and say so. Exported captions need a round-trip check; burn-in versus sidecar is a delivery choice.

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

For writes, group a small change with `StartUndo`/`EndUndo`, use `Lock`/`Unlock` in `try/finally`, and read inputs back. Confirm `SetInput`'s current time argument; composition time can differ from timeline/source frames. Undo grouping is not a cross-API transaction or a substitute for a duplicate timeline.

## Create or modify graphics

Discover registered tools and actual inputs, then add/connect only what is needed. A media-clip composition should retain a valid MediaIn-to-MediaOut path for picture. A title/generator has a different source graph. Validate graph connectivity and inspect a rendered short segment; a node's presence in the comp does not prove it contributes to output.

For inserting titles, search current timeline insertion APIs and verify destination placement. Do not assume a `trackIndex` argument exists. Inspect resulting track/span; move through supported UI/interchange operations if placement is not exposed. Avoid presenting a title on the wrong track as completed work.

Animation needs first/middle/last and motion checks. Verify text wrapping, fonts, alpha, safe areas and readability in every requested aspect ratio. Use requested assets or the user's asset-generation tools; do not substitute decorative templates as a personal house style.
