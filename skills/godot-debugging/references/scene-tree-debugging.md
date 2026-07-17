# Scene tree debugging

Back to [SKILL.md](../SKILL.md).

## Dump the tree

```gdscript
func _ready() -> void:
  print_tree_pretty()
  # or entire tree:
  get_tree().root.print_tree_pretty()
```

## Remote inspector

1. Run the game.
2. Scene dock → **Remote**.
3. Select live nodes; edit properties to probe behaviour.
4. Pause at a breakpoint to inspect mid-frame state.

## Groups for batch dumps

```gdscript
func _ready() -> void:
  add_to_group('debug_enemies')

func _unhandled_input(event: InputEvent) -> void:
  if event.is_action_pressed('debug_dump_enemies'):
    for enemy in get_tree().get_nodes_in_group('debug_enemies'):
      print(enemy.name, ' ', enemy.global_position)
```

## Editor warnings (`@tool`)

```gdscript
@tool
extends Node2D

@export var target: Node2D

func _get_configuration_warnings() -> PackedStringArray:
  var warnings: PackedStringArray = []
  if target == null:
    warnings.append('target must be assigned')
  return warnings
```

Prefer `@export` node refs over deep `NodePath` strings when fixing "node not found" class bugs.
