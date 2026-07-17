---
name: godot-state-machine
description: Implement Godot finite state machines for complex objects — enum, node, and resource patterns; hierarchical/parallel when needed. Use when behaviour has clear states with enter/exit.
---

# Godot State Machine

Align with `godot-scripts` complex objects: **root = public API / type / shared state; states drive behaviour.** Root may hold tiny mutators that update state, emit, then call into the current state. Prefer this over giant `if`/`match` chains on the root.

Related: `godot-components`, `godot-scene-organization`.

## Pick a shape

| Approach | Use when |
|----------|----------|
| Enum + `match` | ≤ ~5 states, little enter/exit logic |
| Node-based FSM | Characters / complex objects (default for this project) |
| Resource-configured | Designers tune transitions/params in Inspector without new scripts |

Upgrade off enums when enter/exit duplicates, animation sync needs hooks, or the match block sprawls.

```
Fewer than ~5 simple states?     → enum
Multiple orthogonal concerns?    → parallel machines
States naturally nest?           → hierarchical
Inspector-tunable AI data?       → resource-configured
Otherwise                        → node-based
```

## Node FSM (preferred for complex objects)

```
entity (root script = public API)
└── state_machine
    ├── idle
    ├── run
    └── attack
```

Contract:

- `State`: `enter` / `exit` / `physics_update` / `handle_input` (as needed)
- `StateMachine`: owns current state, `transition_to`, forwards process/input only to current
- Root exposes `open()`, `take_damage()`, etc.; implementation lives in states
- When root events happen: `state_machine.get_current().on_work_performed()` (or similar)

```gdscript
# root — public API only
func take_damage(amount: int) -> void:
  health = maxi(health - amount, 0)
  health_changed.emit(health)
  state_machine.get_current().on_damage_taken(amount)
```

Animations: start in `enter`, clean up in `exit`. States own their animation lifecycle.

Internal timers for state duration/cooldowns: create in code per `godot-scripts` Timers rule — do not `@export` a Timer for encapsulated timing.

## Hierarchical / parallel

Flat FSM exploding (movement × combat × …) → split:

- **Hierarchical** — parent states own sub-machines (`on_ground` → idle/walk/run)
- **Parallel** — separate machines per concern (movement + combat); one owner per writable field (e.g. only movement sets `velocity`)

See [hierarchical-and-parallel.md](references/hierarchical-and-parallel.md).

## Resource-configured (brief)

Export `Array[StateData]` (name, animation, speed, allowed transitions). Runtime looks up the active entry and validates `transition_to`. Keep executable logic in nodes; Resources stay data.

## Footguns

- Transition loops that re-enter forever in one frame
- Logic still piled on root while "having" a state machine
- Parallel machines fighting over the same property
- Unjustified `_process` in every state — prefer signals/input hooks; physics update only when movement needs it
- Enum FSM that grew past its complexity budget without extracting states
- Forgetting `exit` before `enter` on transition (leaked timers/tweens/anim state)
