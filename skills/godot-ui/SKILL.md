---
name: godot-ui
description: Build Control UI — containers, anchors, themes, focus, pause menus, and multi-resolution stretch/DPI. Use when editing UI scenes, menus, HUD, or window stretch settings.
---

# Godot UI

Control layout and scaling. 2-space indent; single quotes; lowercase node names.

## Controls vs Node2D

`Control` uses anchors + offsets relative to the parent rect. Prefer containers over manual `position`. Put HUD/menus under a `CanvasLayer` so camera transforms do not move them.

## Containers

| Node                              | Use                      |
| --------------------------------- | ------------------------ |
| `VBoxContainer` / `HBoxContainer` | Lists, toolbars          |
| `GridContainer`                   | Inventory grids          |
| `MarginContainer`                 | Padding around one child |
| `PanelContainer`                  | Background + children    |
| `ScrollContainer`                 | Overflow lists           |
| `TabContainer`                    | Settings sections        |
| `FoldableContainer`               | Accordion sections       |

- Expand fillers: `size_flags_horizontal = SIZE_EXPAND_FILL`
- Prevent collapse: `custom_minimum_size`
- Root overlay: `set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)`

```gdscript
$panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
$health_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
$inventory_button.custom_minimum_size = Vector2(64.0, 64.0)
```

## Anchors

`final_edge = parent_size * anchor + offset`. Presets cover full-rect, center, corners. Prefer anchors for responsive edges; keep offsets for small gutters only.

## Themes

One `Theme` on the screen root. Prefer `StyleBoxFlat` for solid panels. Use `add_theme_*_override()` for one-offs — do not duplicate whole themes per child.

See [references/theme.md](references/theme.md).

## Focus

- Interactive: `focus_mode = FOCUS_ALL`
- Decorative: `FOCUS_NONE`
- Wire `focus_neighbor_*` when spatial auto-nav fails
- Call `grab_focus()` on the first control when a menu opens

## Offset transforms (container-safe animation)

Containers reset child `position` / `scale` / `rotation` when they resort. For slide-in panels, pop effects, or other motion inside a container, use `offset_transform_*` instead:

1. Set `offset_transform_enabled = true`
2. Animate `offset_transform_position`, `offset_transform_rotation`, or `offset_transform_scale`
3. Set `offset_transform_pivot` / `offset_transform_pivot_ratio` for scale/rotate origin

By default `offset_transform_visual_only = true` — visual only; hit areas stay put (buttons keep hover). Set to `false` when input should follow the offset.

For tweening or animating controls, see **godot-tweens** (`offset_transform_*` section).

## Pause menu

```gdscript
func _ready() -> void:
  process_mode = Node.PROCESS_MODE_ALWAYS

func _unhandled_input(event: InputEvent) -> void:
  if event.is_action_pressed('pause'):
    get_tree().paused = not get_tree().paused
    visible = get_tree().paused
    if visible:
      $resume_button.grab_focus()
```

Pause UI must be `PROCESS_MODE_ALWAYS` or it freezes with the tree.

## Stretch & aspect

`Project Settings → Display → Window`:

| Setting          | Typical                                                                    |
| ---------------- | -------------------------------------------------------------------------- |
| `stretch/mode`   | `canvas_items` (most UI/2D) · `viewport` (pixel art) · `disabled` (manual) |
| `stretch/aspect` | `expand` (fill) · `keep` (letterbox) · `keep_width` / `keep_height`        |

```gdscript
var size := get_viewport().get_visible_rect().size
get_viewport().size_changed.connect(_on_viewport_size_changed)
```

See [references/adaptive-layouts.md](references/adaptive-layouts.md).

## Pixel art & DPI

- Pixel art: stretch `viewport`, aspect `keep`, stretch scale_mode `integer`, filter `Nearest`
- High-DPI: scale from `DisplayServer.screen_get_dpi()` via `content_scale_factor`

See [references/pixel-art.md](references/pixel-art.md).

## Checklist

- Root Control full-rect; layout via containers
- Theme once at root; overrides only where needed
- Focus modes set; `grab_focus()` on open
- Pause UI: `PROCESS_MODE_ALWAYS`
- Stretch mode/aspect chosen deliberately
- No UI state polling in `_process` — use signals
- Container resets motion tweens — use `offset_transform_*`, not `position`/`scale`
