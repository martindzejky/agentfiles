---
name: godot-tweens
description: Code-driven Tweens in Godot — create_tween lifecycle, kill before recreate, parallel/chain, pause modes, property paths, relative loop drift.
---

# Godot Tweens

## Instructions

- Prefer Tweens for one-off procedural motion (fade, slide, punch). Prefer `AnimationPlayer` for authored multi-track clips.
- Always `kill()` a stored tween before recreating on the same property — `create_tween()` does not cancel siblings.
- Prefer `TRANS_CUBIC` + `EASE_OUT` for UI; avoid default linear unless intentional.
- Use `:` paths for components: `'modulate:a'`, `'position:x'`.
- Prefer absolute targets for looping tweens; `as_relative()` drifts across loops.
- For UI inside containers, prefer `offset_transform_*` over `position` / `scale` / `rotation` — container layout resets those on resort.

## Control offset transforms

`Control` nodes in containers lose `position` / `scale` / `rotation` tweaks when the container resorts. Use offset transforms instead:

1. Set `offset_transform_enabled = true`
2. Tween `offset_transform_position`, `offset_transform_rotation`, or `offset_transform_scale`
3. Set `offset_transform_pivot` / `offset_transform_pivot_ratio` for scale/rotate origin

By default `offset_transform_visual_only = true` — the transform is visual only and does not move hit areas (buttons keep hover). Set to `false` when input should follow the offset.

```gdscript
@onready var panel: PanelContainer = $panel

func slide_in() -> void:
  panel.offset_transform_enabled = true
  panel.offset_transform_position = Vector2(-200, 0)
  var tween := create_tween()
  tween.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
  tween.tween_property(panel, 'offset_transform_position', Vector2.ZERO, 0.35)
```

See **godot-ui** for layout/containers; use **AnimationPlayer** when many properties need authored keyframes.

## Create and bind

```gdscript
var tween := create_tween()
tween.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
tween.tween_property(self, 'position', Vector2(400, 300), 0.5)
tween.tween_property($sprite, 'modulate:a', 0.0, 0.3)
```

Tweens bind to the calling node; freeing the node stops them.

## Kill before recreate

```gdscript
var _move_tween: Tween


func move_to(target: Vector2) -> void:
  if _move_tween and _move_tween.is_valid():
    _move_tween.kill()
  _move_tween = create_tween()
  _move_tween.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
  _move_tween.tween_property(self, 'position', target, 0.4)
```

## Tweener types

| Call | Role |
|------|------|
| `tween_property` | animate a property |
| `tween_method` | call a method with interpolated args |
| `tween_callback` | fire a Callable |
| `tween_interval` | delay |

```gdscript
tween.tween_property(self, 'modulate:a', 0.0, 0.3)
tween.tween_interval(0.5)
tween.tween_callback(queue_free)
```

Modifiers on a PropertyTweener: `.from(v)`, `.from_current()`, `.as_relative()`, `.set_delay(s)`, `.set_trans` / `.set_ease`.

## Parallel and chain

Default is sequential. Parallel options:

```gdscript
# all parallel
var tween := create_tween().set_parallel(true)
tween.tween_property(self, 'position', Vector2(300, 200), 0.5)
tween.tween_property(self, 'rotation', PI, 0.5)
tween.chain().tween_property(self, 'modulate:a', 0.0, 0.3)

# next only parallel with previous
var t := create_tween()
t.tween_property(self, 'position', Vector2(300, 200), 0.5)
t.parallel().tween_property(self, 'rotation', PI, 0.5)
t.tween_callback(func() -> void: print('done'))
```

Put callbacks after `chain()` if they must wait for a parallel block.

## Pause and time

```gdscript
tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)  # run while tree paused
tween.set_pause_mode(Tween.TWEEN_PAUSE_BOUND)     # default: follow node
tween.set_speed_scale(0.5)
tween.set_ignore_time_scale()                    # ignore Engine.time_scale
```

## Loops

```gdscript
tween.set_loops(0)  # 0 = infinite
```

Signals: `finished`, `step_finished`, `loop_finished`. Prefer scene wiring when the host is a scene node; connect in code for fire-and-forget locals.

**Relative drift:** `as_relative()` adds every loop — fine for one-shots, bad for infinite loops. Prefer absolute from/to for cycles.

## Empty tween

```gdscript
var tween := create_tween()
_add_optional_steps(tween)
if not tween.has_tweeners():
  tween.kill()
```

An empty running tween can error; kill if nothing was appended.

## Pitfalls

| Symptom | Fix |
|---------|-----|
| jitter / fight | kill old tween first |
| nothing happens | node freed; check `is_valid()` |
| runs during pause | wrong pause mode |
| relative loop drifts | use absolute values |
| path not found | `'property:component'` spelling |
| slow-mo UI | `set_ignore_time_scale()` |
| container resets tween | use `offset_transform_*`, not `position`/`scale` |
