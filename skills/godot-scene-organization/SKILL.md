---
name: godot-scene-organization
description: Structure Godot scene trees — when to split scenes, composition vs inheritance, and node communication. Use when designing or refactoring .tscn hierarchies.
---

# Godot Scene Organization

Align with `godot-scenes`: world → objects → components + glue. Lowercase underscore node/file names. Prefer `@export` wiring over deep paths or scene-unique names. Signals connected in the scene when possible.

Related: `godot-components`, `godot-event-bus`, `godot-brainstorming`.

## One scene, one responsibility

A scene should be understandable in isolation and reusable without rewriting. If naming needs a paragraph, split.

Composition model:

- **Object root** — public type/API (`class_name`), signals, shared state
- **Components** — private reusable behaviours (often their own `.tscn`)
- **Glue** — root (or a scoped glue component) wires exports and scene signals
- **Visuals** — derive from simulation; do not own authoritative state

## Split vs keep together

**Split** when:

- Reused in more than one parent
- Scene is getting heavy / multi-concern
- Editable/testable on its own helps

**Keep together** when:

- Tightly coupled and only used once
- Split would force noisy signal wiring for a trivial interaction
- The piece is a tiny helper with no reuse path

Rule of thumb: if the parent must wire three signals just to say "you were hit," the split is not paying for itself yet.

## Communication

| Direction | Mechanism                                           |
| --------- | --------------------------------------------------- |
| Up        | Signals (prefer scene-wired, past tense)            |
| Down      | Method calls on children                            |
| Sideways  | One event-bus autoload — distant / cross-scene only |

Siblings do not hard-wire each other. Parent/root injects refs, connects signals, or calls methods.

```gdscript
# bad
get_parent().get_node('hud').update_health(hp)

# good — child emits; owner reacts
health_changed.emit(hp)
```

No `get_parent().get_parent()` or `$../../foo` fishing. Expose `@export` and let the owner wire.

## Inheritance vs composition

| Situation                                             | Prefer                          |
| ----------------------------------------------------- | ------------------------------- |
| Mix-and-match behaviours across entity types          | Composition (component scenes)  |
| Shared **structure** with small property/art variance | Inheritance (inherited `.tscn`) |

Inheritance for shared bones (same collision + sprite + health slots, different stats/art). Do not inherit just to share a couple of functions — extract a component.

## Typical object skeleton

```
object_root (Node2D / CharacterBody2D / StaticBody2D)
├── sprite
├── shadow
├── shape / interaction_area
├── animation
├── squash / shake / mouse_events   # components
├── state_machine                   # complex objects
└── (glue lives on root script)
```

World: autoloads/systems at root; main Y-sorted container holds game objects. Prefer organizational plain `Node`/`Node2D` groups only when they clarify concerns — not card-like nesting for its own sake.

New scenes: path-only `ext_resource`s; do not invent `uid://`. Preserve existing UIDs; refresh with `godot-cli`.

## Smoke note

Some object scenes expect world context. Isolated smoke failures from missing context are not automatic design failures — still aim for independence where practical. See `godot-cli`.
