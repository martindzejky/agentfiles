# Action rebinding

Capture a new event and replace the Input Map binding. Persistence belongs in the project's settings code.

```gdscript
extends Button

@export var action_name := 'jump'

var _listening := false


func _ready() -> void:
  # restore validated bindings through the project's settings code
  _update_label()


func _pressed() -> void:
  _listening = true
  text = 'press a key...'


func _unhandled_input(event: InputEvent) -> void:
  if not _listening:
    return
  if not (event is InputEventKey or event is InputEventMouseButton or event is InputEventJoypadButton):
    return
  if event is InputEventKey and event.keycode in [KEY_SHIFT, KEY_CTRL, KEY_ALT, KEY_META]:
    return

  InputMap.action_erase_events(action_name)
  InputMap.action_add_event(action_name, event)
  _listening = false
  _update_label()
  # persist the updated binding through the project's settings code
  get_viewport().set_input_as_handled()


func _update_label() -> void:
  var events := InputMap.action_get_events(action_name)
  text = events[0].as_text() if events.size() > 0 else '(none)'
```

For untrusted settings, store primitive values in JSON, validate event types and fields, and construct supported InputEvents explicitly. `ConfigFile` and `str_to_var` can deserialize objects and execute scripts; do not use them to load untrusted bindings. See `godot-save-load` for storage guidance.

Prefer editor Input Map defaults; only add actions in code for mods / generated bindings.
