# Signal tracing

Back to [SKILL.md](../SKILL.md). Prefer scene-wired connections; use these helpers when a wire is missing or doubles.

## Inspect connections

```gdscript
func _dump_signal(node: Object, signal_name: StringName) -> void:
  for conn in node.get_signal_connection_list(signal_name):
    print(signal_name, ' -> ', conn['callable'])

func _dump_all_connected(node: Object) -> void:
  for sig in node.get_signal_list():
    var conns := node.get_signal_connection_list(sig['name'])
    if not conns.is_empty():
      print(sig['name'], ': ', conns.size(), ' connection(s)')
```

## Common issues

| Issue | Check |
|-------|--------|
| Never fires | Signal name typo; connected to wrong node; emit before connect; scene connection missing |
| Fires twice | Connected in scene **and** in code, or `connect` in `_ready` without guard |
| Arg mismatch | Handler signature must match signal params |
| Emitter outlives receiver | Disconnect in `_exit_tree` (autoload / event bus) or `CONNECT_ONE_SHOT` |
| Emit before listeners ready | `call_deferred` emit from early autoload `_ready` |

```gdscript
# typed connect preferred over string names
health.health_changed.connect(_on_health_changed)

func _exit_tree() -> void:
  if EventBus.player_died.is_connected(_on_player_died):
    EventBus.player_died.disconnect(_on_player_died)
```

After `await`, guard before touching nodes:

```gdscript
await some_signal
if not is_instance_valid(self):
  return
```
