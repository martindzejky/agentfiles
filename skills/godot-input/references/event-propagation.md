# Event propagation

## Mark handled

```gdscript
func _unhandled_input(event: InputEvent) -> void:
  if event.is_action_pressed('interact'):
    _interact()
    get_viewport().set_input_as_handled()
```

Without `set_input_as_handled()`, sibling/ancestor handlers may also see the event.

## Order

- Propagation is reverse tree order (deepest child first).
- UI Controls run before `_unhandled_input`.
- Prefer `_unhandled_input` for gameplay so focused UI can consume first.
- Prefer `_input` only when gameplay must beat UI.

## Pause

Default process modes stop input when `get_tree().paused`. Pause UI must opt in:

```gdscript
func _ready() -> void:
  process_mode = Node.PROCESS_MODE_ALWAYS
```

Wire that in the scene when possible; set in code only if the node is created at runtime.
