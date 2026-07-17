# Gamepad

Prefer Input Map joypad events on the same actions as keyboard. Prefer Input Map deadzones over manual stick math.

## Hotplug

```gdscript
func _ready() -> void:
  Input.joy_connection_changed.connect(_on_joy_connection_changed)
  for device in Input.get_connected_joypads():
    _on_joy_connection_changed(device, true)


func _on_joy_connection_changed(device: int, connected: bool) -> void:
  if connected:
    print('connected: %s' % Input.get_joy_name(device))
  else:
    print('disconnected: %d' % device)
```

## Analog via Input Map

```gdscript
var direction := Input.get_vector('move_left', 'move_right', 'move_up', 'move_down')
```

`get_vector` applies the action deadzone and works for keyboard + stick.

## Manual radial deadzone (when needed)

```gdscript
func get_stick_input(device: int = 0, deadzone: float = 0.2) -> Vector2:
  var raw := Vector2(
    Input.get_joy_axis(device, JOY_AXIS_LEFT_X),
    Input.get_joy_axis(device, JOY_AXIS_LEFT_Y)
  )
  if raw.length() < deadzone:
    return Vector2.ZERO
  return raw.normalized() * inverse_lerp(deadzone, 1.0, raw.length())
```

## Vibration

```gdscript
Input.start_joy_vibration(device, weak_magnitude, strong_magnitude, duration)
Input.stop_joy_vibration(device)
```

Do not assume device `0` is keyboard/mouse — joypads often use `0`. See SKILL.md for `DEVICE_ID_*` constants.
