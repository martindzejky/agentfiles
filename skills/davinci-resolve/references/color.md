# Color and grade recipes

Confirm project color management, input interpretation, timeline/output color spaces and intended delivery before grading. Preserve the user's existing pipeline. A LUT cannot repair incorrect input tagging, and applying another transform can double-transform already normalized footage.

## Version before an experiment

```python
before = item.GetCurrentVersion()
if not item.AddVersion(version_name, 0):
    raise RuntimeError("cannot create local grade version")
if not item.LoadVersionByName(version_name, 0):
    raise RuntimeError("cannot select new grade version")
result = {"before": before, "active": item.GetCurrentVersion()}
```

Use a unique requested name. Inspect current version/grade after creation; do not assume version creation copied every intended state. Local versus remote versions affect different scopes. Grade changes to groups/shared nodes can affect multiple shots; inspect those relations first.

## CDL, LUT, DRX and stills

Use `TimelineItem.GetNodeGraph` and current Graph definitions to inspect the target. `SetCDL` takes `NodeIndex`, space-separated RGB strings for `Slope`/`Offset`/`Power`, and numeric `Saturation`. Node indices are 1-based; confirm the actual node before applying values. Do not invent a broad wheels/curves API when the scripting surface exposes only narrower grade operations.

LUT operations: inspect Graph `GetLUT`/`SetLUT` and item `ExportLUT` in the current stub. Use a known installed LUT path/node and read back association. A LUT export captures only supported transform behavior, not temporal/spatial effects or the entire grade. Test a chart/representative images before treating it as a portable look.

For a known DRX, inspect `Graph.ApplyGradeFromDRX(path, gradeMode, applyToAllLayers)`. Choose keyframe alignment explicitly (no keyframes, source-timecode alignment, or start-frame alignment per installed definitions). Apply to the selected version/items and compare representative frames. Treat DRX internals as opaque unless an advanced format-editing task specifically requires otherwise.

Use Gallery APIs and `Timeline.GrabStill` for approved reference still workflows; preserve playhead/current timeline context. Check the image shows the intended source/frame and color transform. A before/after at a different frame is not a reliable grade comparison.

## DCTL and custom LUTs

Native MCP provides `list_dctls`, `update_dctl`, and LUT generation/listing tools. Read the current tool schemas and `get_scripting_docs(document="DCTLReadme.txt")` before authoring. `update_dctl` compiles before writing, but compilation does not establish correct color math or a suitable look. Use distinct filenames, confirm overwrite intent for existing assets, and validate on ramps/charts plus representative footage. LUT generation samples a transform; out-of-domain, HDR and color-space assumptions must be explicit.

Do not directly patch project databases or offline grade files in an ordinary grading request. The community advanced recipes in [sources.md](sources.md) are leads for explicitly scoped work, not the default execution route.
