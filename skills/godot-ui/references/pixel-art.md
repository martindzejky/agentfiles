# Pixel art & DPI (thin)

## Project

- Stretch mode: `viewport`
- Aspect: `keep` (or integer scale script)
- `Rendering → Textures → Canvas Textures → Default Texture Filter` → `Nearest`

## Integer scale

```gdscript
const BASE_SIZE := Vector2i(320, 180)

func _apply_integer_scale() -> void:
  var screen := DisplayServer.screen_get_size()
  var s := maxi(1, mini(screen.x / BASE_SIZE.x, screen.y / BASE_SIZE.y))
  get_window().content_scale_factor = float(s)
```

## DPI (non–pixel-art UI)

```gdscript
var dpi := DisplayServer.screen_get_dpi()
var scale := clampf(dpi / 96.0, 1.0, 3.0)
scale = roundf(scale * 4.0) / 4.0
get_window().content_scale_factor = scale
```

Docs: [Multiple resolutions](https://docs.godotengine.org/en/stable/tutorials/rendering/multiple_resolutions.html).
