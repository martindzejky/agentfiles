---
name: godot-input
description: Handle Godot 4 input — discrete `_unhandled_input` vs poll in `_physics_process`, Input Map, rebinding, deadzone, joy hotplug, and DEVICE_ID caveats.
---

# Godot Input

## Instructions

- Define gameplay actions in Project Settings → Input Map. Prefer semantic names (`move_left`, `jump`, `interact`) over key names.
- Prefer `_unhandled_input` for discrete one-shots (jump, interact, pause). Prefer `Input` polling in `_physics_process` for held / analog movement; call `move_and_slide()` there.
- Prefer `_input` only when you must run before UI (e.g. captured mouse look).
- Do not rely on `is_action_just_pressed` alone inside `_process` / `_physics_process` for one-shots — it can miss frames. Catch in `_unhandled_input` and buffer a flag if physics must consume it.
- After consuming an event that must not propagate, call `get_viewport().set_input_as_handled()`.
- Wire pause-menu nodes with `process_mode = PROCESS_MODE_ALWAYS` so they still receive input while the tree is paused.
- Prefer scene-wired signals for `joy_connection_changed` when the listener is a scene node; connect in code only for autoloads / dynamic nodes.

## Callback order

```
_input → UI Controls → _shortcut_input → _unhandled_key_input → _unhandled_input
```

Input walks the tree deepest-child-first. UI consumes focus/clicks before `_shortcut_input` and gameplay `_unhandled_input`.

## Discrete vs poll

```gdscript
func _unhandled_input(event: InputEvent) -> void:
  if event.is_action_pressed('jump'):
    _wants_jump = true
    get_viewport().set_input_as_handled()
  if event.is_action_pressed('pause'):
    get_tree().paused = not get_tree().paused
    get_viewport().set_input_as_handled()


func _physics_process(_delta: float) -> void:
  var direction := Input.get_vector('move_left', 'move_right', 'move_up', 'move_down')
  velocity = direction * speed
  if Input.is_action_pressed('sprint'):
    velocity *= 1.5
  if _wants_jump:
    _wants_jump = false
    _jump()
  move_and_slide()
```

## Polling helpers

| Call | Use |
|------|-----|
| `Input.is_action_pressed` | held |
| `Input.get_action_strength` | analog 0–1 |
| `Input.get_axis` / `get_vector` | axes / 2D direction |
| `event.is_action_pressed` | inside input callbacks |

## Deadzone and gamepad

- Set deadzone per action in the Input Map (~0.2). Prefer that over hand-rolled stick math; `get_vector` respects it.
- Bind keyboard and joypad events on the same actions so one poll path serves both.
- Connect `Input.joy_connection_changed` for hotplug; do not assume the pad was present at launch.

```gdscript
func _ready() -> void:
  Input.joy_connection_changed.connect(_on_joy_connection_changed)


func _on_joy_connection_changed(device: int, connected: bool) -> void:
  if connected:
    print('joy connected: %s' % Input.get_joy_name(device))
```

## Rebind + persist

1. Enter listen mode from UI.
2. On a real `InputEventKey` / `MouseButton` / `JoypadButton` (skip lone modifiers), `InputMap.action_erase_events(action)` then `action_add_event`.
3. Persist with `ConfigFile` under `user://`; reload into `InputMap` on boot.

See [references/rebinding.md](references/rebinding.md).

## Keyboard / mouse device IDs

Keyboard/mouse events use `InputEvent.DEVICE_ID_KEYBOARD` (16) and `InputEvent.DEVICE_ID_MOUSE` (32), not `0`. Joypads may use device `0`. Prefer `event is InputEventKey` (or type checks) over `event.device == 0`.

## Pitfalls

| Symptom | Fix |
|---------|-----|
| one-shot missed | handle in `_unhandled_input`, not only physics poll |
| action fires through UI | use `_unhandled_input`, not `_input` |
| stick drift | raise Input Map deadzone |
| double fire | one callback path per action |
| rebind captures Shift alone | filter modifier-only keycodes |

## Optional refs

- [references/rebinding.md](references/rebinding.md) — capture UI + ConfigFile
- [references/gamepad.md](references/gamepad.md) — hotplug, deadzone, vibration
- [references/event-propagation.md](references/event-propagation.md) — handled + pause
