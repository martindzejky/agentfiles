# CPU hot paths (thin)

```gdscript
# bad
func _process(_delta: float) -> void:
  for enemy in get_tree().get_nodes_in_group('enemies'):
    _check(enemy)

# better — cache + maintain via signals/groups
var _enemies: Array[Node] = []

func _process(_delta: float) -> void:
  for enemy in _enemies:
    _check(enemy)
```

```gdscript
# StringName in hot compares
if node.is_in_group(&'enemies'):
  pass

# Packed arrays for bulk numeric data
var points: PackedVector2Array = PackedVector2Array()
```

Static-type params/returns on hot functions. Prefer `distance_squared_to` for comparisons.
