---
name: godot-dependency-injection
description: Wire Godot dependencies via @export, parent injection, or justified Autoloads. Use when deciding how a node gets its collaborators.
---

# Godot Dependency Injection

Skip Service Locator. Prefer explicit wiring that matches `godot-scripts` / `godot-scenes`.

Related: `godot-components`, `godot-event-bus`, `godot-resources`.

## Decision table

| Situation | Prefer |
|-----------|--------|
| Dep known at edit time, scene-authored | `@export` typed ref — wire in Inspector |
| Parent owns consumer + dependency | Parent injects downward (assign exports / call setup) |
| Truly global cross-cutting service | Autoload — **justify new ones with the user** |
| Distant one-to-many game events | One event-bus autoload (not a pile of service autoloads) |
| Optional collaborator | `@export` + `if` only because it is optional |

```
Every scene needs it forever?
  yes → Autoload (justify) / event bus for events
  no ↓
Known at edit time?
  yes → @export in Inspector
  no ↓
Parent owns both sides?
  yes → parent injects
  no → restructure ownership; do not add a locator
```

## Required vs optional

Required `@export`s are part of scene setup — assume present (assert at startup if useful). Do not wrap required deps in defensive `if`s; that hides bugs. Optional deps get explicit null checks.

```gdscript
@export var health: Health          # required — use directly
@export var sparkle: GpuFx       # optional — if sparkle: sparkle.play()

func _ready() -> void:
  assert(health, 'health export must be set in the scene')
```

`@export` node refs are assigned before `_ready()`.

## Autoloads

Be careful; do not overuse. Good candidates: settings, one event bus, rare platform services. Bad: every manager (`EnemySpawner`, `Inventory`, per-feature systems) — keep those in the world/scene and inject.

After adding/renaming an autoload or `class_name`, refresh with `godot-cli` (`godot --headless --import`).

## Parent injection

```gdscript
# level.gd — root/glue
func _ready() -> void:
  hud.bind_player(player)
  for enemy in enemies.get_children():
    enemy.target = player
```

Children declare `@export` / setters; they do not crawl the tree for siblings. Siblings that need the same dep both receive it from the parent — they do not fetch each other.

## Anti-patterns

- Autoload everything
- Deep `get_node` chains as "injection"
- Circular ready-time deps (break with signals or defer)
- Treating required refs as optional to "be safe"
- Second global registry (service locator) alongside the scene tree
- Injecting concrete UI/gameplay managers into leaf components that only needed a signal
- Hiding deps behind stringly `has_method` / group lookups when an `@export` would do

File paths are deps too — never hard-code `res://`; export `PackedScene` / `Resource` / node refs.
