# Sharing vs unique Resources

Back to [SKILL.md](../SKILL.md).

## Shared by default

```gdscript
var a: EnemyStats = load('res://data/enemies/goblin.tres')
var b: EnemyStats = load('res://data/enemies/goblin.tres')
print(a == b)  # true — same object
```

Any write to `a.health` is visible through `b`.

## Duplicate for instance state

```gdscript
@export var stats: EnemyStats

func _ready() -> void:
  stats = stats.duplicate()       # nested Resources still shared
  # stats = stats.duplicate(true) # deep — use when nested must be unique
```

Original `.tres` on disk is unchanged.

## Make Unique (editor)

Inspector → sub-resource → **Make Unique** embeds a private copy in the parent scene/resource so this instance can diverge without forking the shared file for everyone.

## Rule of thumb

- Blueprints / catalogs → share
- Runtime mutable copies → duplicate (deep if needed)
- One-off editor variance → Make Unique
