# Adaptive layouts (thin)

Anchor HUD to edges; use containers for reflow. Detect resize:

```gdscript
func _ready() -> void:
  get_viewport().size_changed.connect(_on_viewport_size_changed)

func _on_viewport_size_changed() -> void:
  var size := get_viewport().get_visible_rect().size
  $split.vertical = size.x < 1280.0
```

## size_flags

| Flag                          | Effect                 |
| ----------------------------- | ---------------------- |
| `SIZE_FILL`                   | Occupy allocated space |
| `SIZE_EXPAND`                 | Claim extra space      |
| `SIZE_EXPAND_FILL`            | Both (common)          |
| `SIZE_SHRINK_CENTER` / `_END` | Shrink alignment       |

Keep tap targets ≥ ~44×44 on touch. Docs: [Size flags](https://docs.godotengine.org/en/stable/tutorials/ui/size_and_anchors.html).
