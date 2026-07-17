---
name: godot-resources
description: Use Godot Resources for data — sharing vs duplicate, Make Unique, no logic in Resources. Use when defining stats, items, tables, or tunables.
---

# Godot Resources

Expand on `godot-scripts` Resources section. Nodes = behaviour/structure; Resources = pure data (`class_name X extends Resource`).

Related: `godot-components`, `godot-dependency-injection`. After new `class_name` Resources, refresh with `godot-cli`.

## When

Defs, stats, loot tables, tunables, catalogs — anything Inspector-editable and shareable without living in the scene tree.

| Prefer Resource | Prefer Node / other |
|-----------------|---------------------|
| Item / enemy defs | Per-frame behaviour |
| Balance tables | Scene structure |
| Shared tunables | Global mutable session state (careful Autoload) |
| Event payloads | Player save files from disk (see security) |

Prefer Resources over Dictionaries/JSON for typed project data.

```gdscript
class_name ItemData
extends Resource

@export var id: StringName
@export var display_name: String
@export var icon: Texture2D
@export var max_stack: int = 1
```

Wire with `@export var item: ItemData` for scene-assigned data. `preload` of owned project constants is fine per `godot-scripts`.

## Share vs unique

Exported/loaded Resources are **shared by path**. Mutating one instance mutates everyone holding that path.

| Data | Action |
|------|--------|
| Read-only defs (item blueprint, balance sheet) | Share |
| Per-instance mutable runtime state | `duplicate()` or `duplicate(true)` before mutating |
| One scene needs different nested sub-resource values | Editor **Make Unique** on the sub-resource slot |

```gdscript
@export var stats: EnemyStats

func _ready() -> void:
  stats = stats.duplicate()  # shallow; duplicate(true) if nested must diverge
```

See [sharing-vs-unique.md](references/sharing-vs-unique.md).

## No logic in Resources

No `_process`, no `get_tree()`, no input, no node queries. Put behaviour on nodes; Resources expose fields (pure data transforms that only touch their own fields are fine).

## Security

Do **not** load untrusted `.tres` / `.res` for user save data — they can embed scripts. Use JSON/binary or a safe format for player saves; keep `.tres` for trusted project content.

## Resource vs Node

| Aspect | Resource | Node |
|--------|----------|------|
| Role | Data | Behaviour / tree |
| Sharing | Shared by path | Per instance |
| Lifecycle | `_init` only | `_ready`, process, etc. |

If it needs the scene tree, signals from gameplay, or per-frame work → Node. If it is Inspector data → Resource.

## Footguns

- Writing runtime HP into a shared enemy `.tres`
- Monolithic `GameConfig` Resource — split by domain
- Scene-assigned Resource deps without `@export` (prefer Inspector wiring over ad-hoc `load` in `_ready`)
- Path-based `extends` instead of `class_name`
- Shallow `duplicate()` when nested Resources still need isolation
