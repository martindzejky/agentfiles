# Action rebinding

Capture a new event, replace the Input Map binding, persist with ConfigFile.

```gdscript
extends Button

@export var action_name := 'jump'

var _listening := false


func _ready() -> void:
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
  _save_bindings()
  get_viewport().set_input_as_handled()


func _update_label() -> void:
  var events := InputMap.action_get_events(action_name)
  text = events[0].as_text() if events.size() > 0 else '(none)'


func _save_bindings() -> void:
  var cfg := ConfigFile.new()
  for action in InputMap.get_actions():
    if str(action).begins_with('ui_'):
      continue
    var encoded: Array = []
    for event in InputMap.action_get_events(action):
      encoded.append(var_to_str(event))
    cfg.set_value('input', action, encoded)
  cfg.save('user://input_bindings.cfg')


func load_bindings() -> void:
  var cfg := ConfigFile.new()
  if cfg.load('user://input_bindings.cfg') != OK:
    return
  for action in cfg.get_section_keys('input'):
    if not InputMap.has_action(action):
      continue
    InputMap.action_erase_events(action)
    for encoded in cfg.get_value('input', action, []):
      var event: InputEvent = str_to_var(encoded)
      if event:
        InputMap.action_add_event(action, event)
```

Call `load_bindings()` from an autoload or settings root on boot. Prefer editor Input Map defaults; only add actions in code for mods / generated bindings.
