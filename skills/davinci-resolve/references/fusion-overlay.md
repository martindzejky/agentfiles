# Editable Fusion overlay from an existing graphic

Use for replacing **one existing graphic placeholder** with editable text/shapes while retaining its track and span. This route worked on macOS Studio 21.1.1.10 in the [local trial](field-notes.md#local-native-mcp-trial). It is not a general adjustment-clip insertion or source-footage conversion recipe. Inspect current signatures and the target before adapting it.

## Preserve placement

Resolve `timeline` and `overlay` by inspected IDs, confirm the overlay is the intended single graphic, and duplicate the timeline before conversion. Record its track, start/end, properties/fades and neighboring items. Converting multiple items or a media clip can have different nesting/source behavior.

```python
before = {"start": overlay.GetStart(), "end": overlay.GetEnd()}
replacement = timeline.CreateFusionClip([overlay])
if not replacement:
    raise RuntimeError("conversion failed; inspect timeline before retrying")
if (replacement.GetStart() != before["start"]
        or replacement.GetEnd() != before["end"]):
    raise RuntimeError("replacement span changed; retain backup and inspect")
count = replacement.GetFusionCompCount()
if count > 1:
    raise RuntimeError("multiple compositions; identify the intended one")
comp = replacement.GetFusionCompByIndex(1) if count else replacement.AddFusionComp()
if not comp:
    raise RuntimeError("composition unavailable; inspect converted item")
result = {"id": replacement.GetUniqueId(), "span": before,
          "compositions": replacement.GetFusionCompCount()}
```

In the measured conversion the returned item initially had zero compositions; `AddFusionComp()` then created MediaIn/MediaOut. Do not repeatedly add compositions when one already exists. Check the replacement's actual destination track and all unaffected item spans/properties separately. Conversion is a mutation, not a transaction or rollback promise.

## Construct the graph

Inspect `comp.GetToolList(False)` and each tool's `GetInputList()` / input `GetAttrs()` to obtain actual `INPS_ID` values. Use `AddTool` for missing nodes and `ConnectInput` for the following connections. Resolve MediaOut by its inspected identity rather than assuming its name. Group the change with `StartUndo` / `EndUndo(True)`; if locking structural edits, always unlock in `finally` before writing parameter values.

| Node            | Native tool ID | Connection                                        |
| --------------- | -------------- | ------------------------------------------------- |
| Label           | `TextPlus`     | Text rendered over transparency                   |
| Triangle        | `TriangleMask` | Mask output → white shape Background `EffectMask` |
| Shape           | `Background`   | Output → Fill Merge `Foreground`                  |
| Fill            | `Merge`        | Label → `Background`; Shape → `Foreground`        |
| Expanded alpha  | `ErodeDilate`  | Fill → `Input`                                    |
| Outline mask    | `BitmapMask`   | Expanded alpha → `Image`; select Alpha channel    |
| Outline         | `Background`   | Near-black fill; Outline mask → `EffectMask`      |
| Outlined fill   | `Merge`        | Outline → `Background`; Fill → `Foreground`       |
| Motion          | `Transform`    | Outlined fill → `Input`                           |
| Canvas          | `Background`   | Fully transparent → final Merge `Background`      |
| Final composite | `Merge`        | Motion → `Foreground`; output → MediaOut `Input`  |

For this generated overlay, inherited MediaIn is deliberately disconnected from the rendered path; the old placeholder must not contribute. For footage styling, preserve the destination's own MediaIn instead. Configure frame-format settings on generators/masks to match the composition. Inspect alpha; default opaque Background nodes can accidentally cover underlying footage.

The following values illustrate the measured 1920×1080 graph, not a house style. Adapt text, font, shape size and placement to the requested design. `label`, `triangle`, `canvas` and `expanded` refer to the already created/inspected tools:

```python
t = comp.CurrentTime
label.SetInput("StyledText", requested_text, t)
label.SetInput("Font", installed_font, t)
label.SetInput("Size", 0.042, t)
label.SetInput("Center", {1: 0.5, 2: 0.165}, t)
triangle.SetInput("Point1", {1: 0.482, 2: 0.095}, t)
triangle.SetInput("Point2", {1: 0.518, 2: 0.095}, t)
triangle.SetInput("Point3", {1: 0.5, 2: 0.070}, t)
canvas.SetInput("TopLeftAlpha", 0, t)
expanded.SetInput("XAmount", 0.0012, t)
expanded.SetInput("LockXY", 1, t)
```

Triangle geometry avoids font-glyph substitution. The alpha expansion colors only a silhouette behind the shared fill, so both text and shape receive the same outline. Check the mask's active channel and expansion direction in the rendered output; successful setters are insufficient.

## Animate in composition time

The measured five-second, 30 fps overlay used local frames0..149. Resolve the new composition's actual origin/range before adapting these expressions; timeline frame numbers are not interchangeable. With `first` and `last` set to the verified composition frames, and the final Merge and Transform tools already resolved:

```python
fade = 8
if last - first < 2 * fade:
    raise ValueError("overlay too short for these animation handles")
enter = "min(max((time-" + str(first) + ")/" + str(fade) + ",0),1)"
leave = "min(max((time-" + str(last - fade) + ")/" + str(fade) + ",0),1)"
opacity = enter + "*min(max((" + str(last) + "-time)/" + str(fade) + ",0),1)"
center = "Point(0.5,0.5-0.018*(1-(" + enter + "))^3-0.012*(" + leave + ")^3)"
merge_inputs = {i.GetAttrs()["INPS_ID"]: i for i in final_merge.GetInputList().values()}
motion_inputs = {i.GetAttrs()["INPS_ID"]: i for i in motion.GetInputList().values()}
merge_inputs["Blend"].SetExpression(opacity)
motion_inputs["Center"].SetExpression(center)
```

These expressions fade/settle in, hold, then fade/drop out; the amounts and eight-frame handles are examples. Inspect inherited external clip fades so they do not unintentionally double the animation. Read back inputs at before/entrance/hold/exit/after times, then render a short native preview with handles. Inspect movement, readability, alpha and the underlying footage. A successful still export can show a stale frame; the native video witness resolved that issue in the local trial.
