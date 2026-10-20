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
  stats = stats.duplicate()  # nested containers and Resources stay shared
```

Original `.tres` on disk is unchanged.

- `duplicate(true)` recursively copies containers and internal subresources. External Resources can remain shared.
- `duplicate_deep(Resource.DEEP_DUPLICATE_ALL)` also duplicates external Resources. Use only when they must diverge; textures and other immutable assets usually should stay shared.
- Custom Resources with required `_init()` arguments cannot be duplicated this way.

## Make Unique (editor)

Inspector → sub-resource → **Make Unique** makes an editor copy for that property. It does not guarantee a fresh copy for every runtime scene instance. Set `resource_local_to_scene` before instantiation when each packed-scene instance needs its own resource.

## Rule of thumb

- Blueprints / catalogs → share
- Runtime mutable copies → duplicate (deep if needed)
- One-off editor variance → Make Unique

Docs: [Resource duplication and scene-local resources](https://docs.godotengine.org/en/stable/classes/class_resource.html).
