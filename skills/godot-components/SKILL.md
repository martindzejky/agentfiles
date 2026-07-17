---
name: godot-components
description: Build reusable private Godot components — composition, @export wiring, root glue. Use when extracting shared behaviour into child scenes.
---

# Godot Components

Align with `godot-scenes`: objects are reusable components + root glue. Components are usually **private** — other objects talk to the object's public API, not its internals.

Related: `godot-scene-organization`, `godot-dependency-injection`, `godot-resources`.

## Rules

1. **One responsibility** per component scene/script.
2. **No sibling fishing** — do not `get_parent().get_node('other_component')`. Emit signals or take an `@export` ref wired by the root/glue.
3. **Root glues** — root script (or a scoped glue component) injects exports and scene-wires signals.
4. **`@export` for configuration and deps** — assume required exports are set in the scene; only `if` optional ones (`godot-scripts`).
5. Prefer **scene-wired signals**; connect in code only for dynamic instances.
6. Save reusable pieces as their own `.tscn`.

## Composition sketch

```
enemy (root: public API)
├── sprite
├── shape
├── health          # component .tscn
├── hurtbox         # @export health wired by root/inspector
└── squash
```

Simulation components should not know about visuals. Visuals react to simulation signals/state.

```gdscript
class_name Health
extends Node

signal health_changed(current: int, maximum: int)
signal died

@export var max_health: int = 100
var current: int

func _ready() -> void:
  current = max_health

func take_damage(amount: int) -> void:
  current = maxi(current - amount, 0)
  health_changed.emit(current, max_health)
  if current == 0:
    died.emit()
```

## Wiring preference

| Pattern | When |
|---------|------|
| `@export var health: Health` | Cross-child or configurable deps (preferred) |
| Root assigns in `_ready` | Dynamic spawn / programmatic scenes |
| `$child` on root only | Direct known children of the same scene |

```gdscript
# hurtbox — required dep, no defensive if
@export var health: Health

func receive_hit(amount: int) -> void:
  hurt.emit(amount)
  health.take_damage(amount)
```

Glue components that only connect other components are allowed but keep them scarce and scoped.

## Extract when

- Same behaviour appears on multiple entity types
- Root script is mixing unrelated concerns
- The piece can be tested/previewed alone

Keep tiny one-off helpers on the root until reuse is real. Simple objects often need only a root script plus one or two juice components (`squash`, `shake`).

## Footguns

- Components calling into foreign objects' private components
- Optional-style null checks on required exports
- Logic that belongs on the object root living half-in a "reusable" component
- Deep NodePaths instead of exports
- Component that assumes a specific parent type — prefer injected refs / signals
