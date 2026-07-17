---
name: godot-animation
description: 2D animation with AnimationPlayer, AnimationTree, AnimatedSprite2D, Call Method tracks, and SpriteFrames.
---

# Godot Animation (2D)

## Instructions

- Prefer `AnimationPlayer` for multi-track clips (frames + hitboxes + SFX + methods). Prefer `AnimatedSprite2D` only for simple frame-only characters.
- Prefer `AnimationTree` when you need blends or state transitions; keep clips on a sibling `AnimationPlayer`.
- Prefer lowercase node names: `sprite`, `animation`. Prefer scene-wired `animation_finished` when the connection is static.
- Prefer Call Method tracks for frame-accurate gameplay (enable hitbox, spawn projectile). Prefer past-tense signals from root scripts (`attack_finished`), not command-style.

## AnimationPlayer vs Tree

| Node | Use |
|------|-----|
| `AnimationPlayer` | play/stop/queue one clip; one-shots; simple idle/walk |
| `AnimationTree` | travel between states, BlendSpace1D/2D, layered blends |

Start with Player. Add Tree when `play()` snaps or you need continuous blend params.

## Playback

```gdscript
@onready var animation: AnimationPlayer = $animation

func _physics_process(_delta: float) -> void:
  if velocity.length_squared() > 0.0:
    animation.play('walk')
  else:
    animation.play('idle')
```

Calling `play()` with the **same name already playing is a no-op** (safe every frame). To restart, `stop()` then `play()`, or `seek(0.0)` / play a different clip first.

```gdscript
animation.play('attack')
animation.queue('idle')
animation.speed_scale = 1.0
```

## Call Method tracks

In the Animation panel: Add Track → Call Method → pick target → key method name/args at the frame.

```gdscript
func enable_hitbox() -> void:
  $hitbox/shape.disabled = false


func spawn_projectile() -> void:
  var bullet := bullet_scene.instantiate()
  get_parent().add_child(bullet)
  bullet.global_position = $muzzle.global_position
```

## AnimatedSprite2D vs Sprite2D + Player

| Approach | Pros | Cons |
|----------|------|------|
| `AnimatedSprite2D` | fast SpriteFrames setup | frames only |
| `Sprite2D` + `AnimationPlayer` | property tracks, methods, audio | more setup |

Prefer Player when hitboxes/sounds must sync to the same clip.

```gdscript
@onready var sprite: AnimatedSprite2D = $sprite

func _physics_process(_delta: float) -> void:
  var direction := Input.get_vector('move_left', 'move_right', 'move_up', 'move_down')
  if direction != Vector2.ZERO:
    sprite.play('walk')
    if direction.x != 0.0:
      sprite.flip_h = direction.x < 0.0
  else:
    sprite.play('idle')
```

## AnimationTree travel / blend

- Set `anim_player`, `active = true`, root = StateMachine or BlendTree.
- Cache playback: `anim_tree['parameters/playback'] as AnimationNodeStateMachinePlayback`.
- Prefer `travel('run')` for blended transitions; `start()` jumps immediately.
- Drive blends every frame:

```gdscript
anim_tree['parameters/BlendSpace1D/blend_position'] = blend_amount
anim_tree['parameters/BlendSpace2D/blend_position'] = input_dir
```

## SpriteFrames pitfalls

- Loop idle/walk; leave attack/death non-looping.
- Prefer `set_animation_loop_mode` (`LOOP_NONE` / `LOOP_LINEAR` / `LOOP_PINGPONG`) over deprecated `set_animation_loop(bool)`.
- Wrong track node path → animation “plays” but sprite never changes. Fix paths after renames.
- Non-looping clip + `play()` every physics frame can look stuck at frame 0 if you force-restart; same-name no-op is fine — guard only if you intentionally restarts.

## Pitfalls

| Symptom | Fix |
|---------|-----|
| snaps between clips | use AnimationTree + transitions |
| Tree does nothing | set `active = true` |
| `travel` no-op | add transition arrows between states |
| method track silent | exact method name + target path |
| blend dead | correct `parameters/.../blend_position` path |

## Optional refs

- [references/sprite-animation.md](references/sprite-animation.md)
- [references/common-pitfalls.md](references/common-pitfalls.md)
