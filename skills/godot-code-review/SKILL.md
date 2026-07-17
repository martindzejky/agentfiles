---
name: godot-code-review
description: Review GDScript/Godot 2D code for Godot-specific footguns. Use when reviewing gameplay scripts, scenes, or PRs that touch Godot systems.
---

# Godot Code Review

Review against `godot-scripts` and `godot-scenes`. Do not restate naming/composition/event-bus policy at length — flag violations and point at those rules.

2D + GDScript only. Output findings as **Critical** / **Important** / **Suggestions**.

## Critical / Important: frame loops

Any `_process` / `_physics_process` is an **automatic red flag**.

Require a justification that the work must run every frame (mouse follow, interpolation, held analog movement + `move_and_slide`, etc.). Prefer signals, setters, or explicit on-change updates — see `godot-scripts` ("Signals over `_process`", "Updates as needed").

Unjustified frame loops that only "keep things in sync" = **Important** or **Critical**.

Also flag:

- Enabling process every frame when it could stay off until needed
- `is_action_just_pressed` only inside process (one-shots can be missed) — prefer `_unhandled_input`
- `move_and_slide` in `_process` instead of `_physics_process`

```gdscript
# bad — sync via poll
func _process(_delta: float) -> void:
  $hud/health.value = health

# good — react once
var health: int:
  set(value):
    health = value
    health_changed.emit(health)
```

## Other red flags

| Flag | Why | Severity guide |
|------|-----|----------------|
| `$` / `get_node` / `load` inside hot loops or process | Tree walks / disk every frame | Critical / Important |
| Deep NodePaths (`$A/B/C/D`) | Fragile; prefer `@export` wiring | Important |
| Mutating physics-related state inside physics callbacks without `set_deferred` | "Can't change this state while flushing queries" | Critical |
| `await` then use self/node without `is_instance_valid` | Use-after-free | Critical |
| `CharacterBody*` locomotion via raw `position` instead of `velocity` + `move_and_slide` | Skips collision / tunnelling | Critical |
| Mutating a shared Resource without `duplicate()` / deep duplicate | One instance corrupts all | Critical |
| Signals connected in code when they could be scene-wired | Prefer editor connections | Important |
| Defensive `if` on required `@export` / deps | Required means assume present; optional gets `if` | Important |
| Missing static types on vars / params / returns | Silent runtime failures | Important |
| Hard-coded paths for scene-assigned deps (use `@export`) | Fragile wiring — `preload`/`load` of owned constants is fine | Important |
| New Autoload without justification | Scope creep — scripts rule | Important |
| `distance_to` in tight comparisons | Prefer `distance_squared_to` | Suggestions / Important if hot |
| Sibling fishing / `get_parent()` chains | Breaks composition | Important |

## Prefer (brief)

- Scene-wired signals; past-tense names
- `@export` for deps; root/glue injects; no sibling fishing
- Resources for data; nodes for behaviour
- Event bus only for distant / cross-scene
- Discrete input in `_unhandled_input`; held movement poll in `_physics_process`
- Internal timers created in code; external deps exported

## Output format

```
## Code Review — <scope>

### Critical
- <location> — <issue> — fix: <short fix>

### Important
- ...

### Suggestions
- ...
```

Skip empty sections. Cite the governing rule when the fix is "follow project convention," not a novel invention.
