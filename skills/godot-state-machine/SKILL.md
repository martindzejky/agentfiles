---
name: godot-state-machine
description: Implement Godot finite state machines for complex objects — enum, node, and resource patterns; hierarchical/parallel when needed. Use when behaviour has clear states with enter/exit.
---

# Godot State Machine

Follow [game-composition](../game-composition/SKILL.md) for state, behaviour, and decision-making responsibilities. Inspect the project's existing stacked state machine first and reuse its API. The contract below illustrates a node-based machine; it does not replace the project's implementation.

Related: `godot-components`, `godot-scene-organization`.

## Pick a shape

Use an enum only for very simple state. Prefer the existing state machine once behaviour needs enter/exit handling or several state-dependent rules. Choose based on behaviour complexity, not a fixed number of states.

Consider hierarchical or parallel machines only when the existing model needs them. Resource-configured state data can help when transitions and parameters need Inspector editing.

## Node finite state machine (preferred for complex objects)

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
  state_machine.get_current().on_damage_taken(amount)
```

Expose state changes for presentation components to observe. Keep animation playback and cleanup in those components; simulation states must still work when presentation is disabled.

Internal timers for state duration/cooldowns: create in code per `godot-scripts-rules` Timers rule — do not `@export` a Timer for encapsulated timing.

## Hierarchical / parallel

Flat state machine exploding (movement × combat × …) → split:

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
- Enum state machine that grew past its complexity budget without extracting states
- Forgetting `exit` before `enter` on transition (leaked timers/tweens/anim state)
