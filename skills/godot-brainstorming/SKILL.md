---
name: godot-brainstorming
description: Godot-specific design additions when brainstorming features or systems. Use with the brainstorming skill for the generic process.
---

# Godot Brainstorming

Also load and follow the `brainstorming` skill for the generic process (explore context, approaches, approval before coding). This skill adds **Godot-only** design work — not a second generic Q&A process.

Defer naming, signals, Resources, autoloads, and composition details to `godot-scripts` / `godot-scenes`. Related: `godot-scene-organization`, `godot-components`, `godot-event-bus`, `godot-state-machine`.

## Scene tree first

Sketch the scene tree at least **two levels deep** before implementing.

For every node answer:

1. What does it own?
2. What is its single responsibility?
3. How does it talk to neighbors?

One responsibility per node. If you cannot name it in a few words, split it.

```
chest (StaticBody2D)           # public API: try_open()
├── sprite
├── shape
├── interaction_area           # Area2D — proximity only
│   └── shape
├── animation
└── loot                       # reusable component .tscn if shared
```

Root type is the scene's contract with the world (`CharacterBody2D` for movers, `StaticBody2D`/`Area2D` for interactables, `Control` for UI).

## Communication

| Direction | Mechanism | Scope |
|-----------|-----------|--------|
| Up | Signals (past tense) | Child → parent / ancestors |
| Down | Method calls | Parent → children |
| Sideways | One event-bus autoload | Distant / cross-scene only |

Prefer scene-wired signals. Do not invent a second global bus. Inside one scene, prefer parent mediation over the bus.

## State ownership

One authoritative owner per piece of state. Do not duplicate the same value across nodes "for convenience." Visuals derive from simulation; they do not own the truth.

Ask explicitly: what data exists, who owns each field, what happens if a signal fires twice or a required child is missing.

## Architecture pickers (one-liners)

| Need | Prefer |
|------|--------|
| Truly global cross-cutting service | Autoload — justify a new one with the user |
| Shared defs / tunables / tables | `Resource` (`.tres`) |
| Reusable behaviour across entity types | Component `.tscn` + `@export` surface |
| Complex object with many behaviours | Node finite state machine — root = public API, states drive behaviour |
| Distant game events | Single event-bus autoload |
| Spawned content | `@export var scene: PackedScene` |
| Encapsulated cooldowns / state timers | Timer created in code (see scripts Timers rule) |

## Reuse candidates

Mark reusable pieces as separate `.tscn` files with a clean `@export` + signal surface. Root (or glue) injects deps; siblings do not fish for each other.

Keep one-off helpers on the root until reuse is real — premature component splits create wiring noise.

## Output before coding

Present at least:

- Scene tree sketch (≥2 levels)
- Who owns each important state
- Signal / call / bus map for the hot paths
- Which pieces are separate scenes vs kept together
- Minimum viable slice vs later complexity

Get approval via the `brainstorming` skill flow, then implement.
