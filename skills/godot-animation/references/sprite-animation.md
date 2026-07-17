# Sprite animation (2D)

Prefer `AnimatedSprite2D` for frame-only characters. Prefer `Sprite2D` + `AnimationPlayer` when the same clip must drive hitboxes, modulate, audio, or Call Method tracks.

## AnimatedSprite2D

```gdscript
extends CharacterBody2D

@onready var sprite: AnimatedSprite2D = $sprite

@export var speed := 200.0


func _physics_process(_delta: float) -> void:
  var direction := Input.get_vector('move_left', 'move_right', 'move_up', 'move_down')
  velocity = direction * speed
  if direction != Vector2.ZERO:
    sprite.play('walk')
    if direction.x != 0.0:
      sprite.flip_h = direction.x < 0.0
  else:
    sprite.play('idle')
  move_and_slide()
```

## SpriteFrames

- Create animations in the SpriteFrames resource on the node.
- Mark locomotion loops; one-shots stay non-looping.
- Godot 4.7+: `sprite.sprite_frames.set_animation_loop_mode(&'sway', SpriteFrames.LOOP_PINGPONG)`.

## Sync with gameplay

When attack frames must enable a hitbox, prefer migrating that character to `AnimationPlayer` (or drive both carefully). Do not expect AnimatedSprite2D alone to key collision or method calls.
