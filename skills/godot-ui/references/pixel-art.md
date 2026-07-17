# Pixel art & DPI (thin)

## Project

- Stretch mode: `viewport`
- Aspect: `keep`
- Stretch scale mode: `integer`
- `Rendering → Textures → Canvas Textures → Default Texture Filter` → `Nearest`

## Integer scale

Prefer project stretch settings over hand-rolled screen math:

```gdscript
# Project Settings → Display → Window:
#   Stretch Mode = viewport
#   Stretch Aspect = keep
#   Stretch Scale Mode = integer

# Runtime equivalent:
get_window().content_scale_stretch = Window.CONTENT_SCALE_STRETCH_INTEGER
```

## DPI (non–pixel-art UI)

```gdscript
var dpi := DisplayServer.screen_get_dpi()
var scale := clampf(dpi / 96.0, 1.0, 3.0)
scale = roundf(scale * 4.0) / 4.0
get_window().content_scale_factor = scale
```

Docs: [Multiple resolutions](https://docs.godotengine.org/en/stable/tutorials/rendering/multiple_resolutions.html).
