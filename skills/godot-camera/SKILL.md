---
name: godot-camera
description: Camera2D — limits, smoothing/follow, screen shake, room zones, make_current after transitions.
---

# Godot Camera2D

## Instructions

- Prefer one active `Camera2D` (`make_current()`). Set `limit_*` to level bounds so the view never shows empty world.
- Prefer built-in `position_smoothing_enabled` for simple follow; use a small follow script when you need look-ahead.
- Prefer screen shake on `offset` / `rotation`, with intensity squared for a quick decay feel — not endless sine on `position`.
- Prefer `Area2D` camera zones for room bounds; wire `body_entered` in the scene when static.
- After a tweened handoff, call `next_cam.make_current()` only when the tween finishes.
- Follow/shake run in `_process` (visual), not `_physics_process`.

## Limits and basics

| Property                           | Role                     |
| ---------------------------------- | ------------------------ |
| `limit_left/right/top/bottom`      | world-pixel clamps       |
| `position_smoothing_enabled`       | built-in lerp follow     |
| `position_smoothing_speed`         | catch-up rate            |
| `drag_horizontal/vertical_enabled` | dead zone before scroll  |
| `zoom`                             | `Vector2(2, 2)` zooms in |

Child the camera under the player for simplest follow, or keep it free and lerp toward a target.

## Smooth follow (look-ahead)

```gdscript
extends Camera2D

@export var target: Node2D
@export var follow_speed := 8.0
@export var look_ahead_distance := 80.0
@export var look_ahead_speed := 4.0

var _look_ahead := Vector2.ZERO
var _prev_target_pos := Vector2.ZERO


func _ready() -> void:
  position_smoothing_enabled = false
  _prev_target_pos = target.global_position
  global_position = target.global_position


func _process(delta: float) -> void:
  var move_delta := target.global_position - _prev_target_pos
  _prev_target_pos = target.global_position
  var desired_ahead := (
    move_delta.normalized() * look_ahead_distance
    if move_delta.length_squared() > 0.25
    else Vector2.ZERO
  )
  _look_ahead = _look_ahead.lerp(desired_ahead, look_ahead_speed * delta)
  global_position = global_position.lerp(
    target.global_position + _look_ahead,
    follow_speed * delta
  )
```

Assume required `@export` targets are assigned in the scene.

## Screen shake

```gdscript
extends Camera2D

@export var max_offset := Vector2(20, 15)
@export var max_roll_deg := 3.0
@export var decay_rate := 1.5

var _shake_intensity := 0.0


func add_shake(amount: float) -> void:
  _shake_intensity = minf(_shake_intensity + amount, 1.0)


func _process(delta: float) -> void:
  if _shake_intensity <= 0.0:
    offset = Vector2.ZERO
    rotation = 0.0
    return
  _shake_intensity = maxf(_shake_intensity - decay_rate * delta, 0.0)
  var shake := _shake_intensity * _shake_intensity
  offset = Vector2(
    max_offset.x * shake * randf_range(-1.0, 1.0),
    max_offset.y * shake * randf_range(-1.0, 1.0)
  )
  rotation = deg_to_rad(max_roll_deg) * shake * randf_range(-1.0, 1.0)
```

Optional: drive offset with `FastNoiseLite` instead of `randf_range` for smoother shake. Reset offset/rotation when intensity hits 0.

```gdscript
func on_explosion() -> void:
  var cam := get_viewport().get_camera_2d()
  if cam is GameCamera:
    (cam as GameCamera).add_shake(0.6)
```

Prefer typed `is` / cast over `has_method` when the project owns the type.

## Camera zones

`Area2D` per room; on player enter, tween the active camera's limits to the room bounds. Prefer scene-wired `body_entered`. Filter with groups or typed player checks.

```gdscript
func _on_body_entered(body: Node2D) -> void:
  if not body.is_in_group('player'):
    return
  var cam := body.get_viewport().get_camera_2d()
  var tween := create_tween().set_parallel(true)
  tween.set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)
  tween.tween_property(cam, 'limit_left', limit_left, transition_time)
  tween.tween_property(cam, 'limit_right', limit_right, transition_time)
  tween.tween_property(cam, 'limit_top', limit_top, transition_time)
  tween.tween_property(cam, 'limit_bottom', limit_bottom, transition_time)
```

## Transitions

```gdscript
func transition_to(next_cam: Camera2D, duration := 0.5) -> void:
  var current := get_viewport().get_camera_2d()
  if current == null or current == next_cam:
    return
  current.top_level = true
  var tween := create_tween().set_parallel(true)
  tween.set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_CUBIC)
  tween.tween_property(current, 'global_position', next_cam.global_position, duration)
  tween.tween_property(current, 'zoom', next_cam.zoom, duration)
  await tween.finished
  next_cam.make_current()
  current.top_level = false
```

## Pitfalls

| Symptom                    | Fix                             |
| -------------------------- | ------------------------------- |
| shows outside level        | set all four limits             |
| shake leaves offset        | clear when intensity == 0       |
| cut mid-blend              | `make_current` only after tween |
| zone triggers wrong bodies | collision masks / player group  |
