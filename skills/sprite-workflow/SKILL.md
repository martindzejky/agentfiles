---
name: sprite-workflow
description: Prepare supplied game artwork for use as sprites. Use when cropping transparent exports, slicing irregular sprite sheets into separate parts, choosing asset resolution, or preserving pivots and baselines during import.
---

# Sprite workflow

Process supplied artwork without redrawing or restyling it. Keep the source
exports intact and write processed copies. Follow the game's existing asset
folders, naming, and engine import conventions.

## Processing

1. Inspect the export's dimensions, transparency, and intended pieces. Use the
   artwork or mockup to identify which disconnected shapes belong together.
2. Prefer individual exports when available. Otherwise slice only the pieces
   needed for the current task, preserving antialiased edges and transparency.
3. Check each crop visually. A bounding box can contain another sprite when
   pieces interleave: isolate the intended foreground, rather than copying
   neighboring parts into both outputs. Alpha-mask components may also include
   transparent holes; not every component is a sprite. Small detached details
   may belong to a larger piece.
4. Choose resolution based on expected display size and camera zoom. A 50%
   downscale can suit oversized painted exports, but is not a required step.
   Avoid repeated resampling; derive each output from the original. Use nearest
   sampling for pixel art and a suitable smooth filter for painted art.
5. Preserve shared canvas sizes and baselines for animation frames when needed.
   For assembled or rigged parts, preserve or record pivots and attachment
   positions; independent trimming changes their local coordinate origins.
6. Import using the engine's existing workflow. Compression, filtering, and
   mipmaps depend on the renderer, platform, and whether the sprite is UI or
   world art; do not force one preset onto every game.
7. Verify the result in context: intended size, orientation, transparency,
   alignment, and layering. Keep approved placements when replacing placeholders.
   In 3D, set pixel density to preserve world dimensions and account for any
   transparent padding. Leave unrelated interactions unchanged.

If a required piece is missing, explain what is needed and follow the user's art
workflow. When requesting artwork, give a short spec with its purpose, relative
size, parts or frames, and any shared baseline or pivot constraints. Flag any
placeholders; do not silently substitute final art.

## ImageMagick examples

Use an available local image tool; these commands assume ImageMagick's `magick`.

Inspect dimensions and channels:

```bash
magick identify input.png
magick input.png -format '%[channels]' info:
```

Find candidate bounds on a transparent sheet:

```bash
magick input.png -alpha extract -threshold 1% \
  -define connected-components:verbose=true \
  -define connected-components:area-threshold=500 \
  -connected-components 8 null:
```

The output lists `WxH+X+Y` bounds. Adjust the alpha threshold and minimum area
for the artwork; a large area cutoff can discard small knobs, eyes, or other
intentional parts. Inspect foreground components rather than relying on IDs.

Crop a confirmed rectangle, optionally downscaling into a separate output:

```bash
magick input.png -crop WxH+X+Y +repage output.png
magick input.png -crop WxH+X+Y +repage -resize 50% output_half.png
```

Trim transparent borders only when shared framing is unnecessary:

```bash
magick input.png -trim +repage output_trimmed.png
```

For variants that need a common baseline, pad to a known shared canvas instead
of independently trimming every frame:

```bash
magick input.png -background none -gravity south -extent WIDTHxHEIGHT output.png
```
