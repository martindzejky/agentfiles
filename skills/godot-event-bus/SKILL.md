---
name: godot-event-bus
description: Use one Autoload event bus for distant/cross-scene Godot events. Use when unrelated scenes must communicate without holding refs.
---

# Godot Event Bus

Must match `godot-scripts`: **one** bus for distant / cross-scene game events. Prefer scene-local signal wiring or parent mediation inside a single scene.

Related: `godot-scene-organization`, `godot-dependency-injection`.

## When to use

| Situation | Use bus? |
|-----------|----------|
| Child → parent / parent → child | No — signal up / call down |
| Siblings under same parent | No — parent mediates |
| Unrelated scenes (HUD ↔ enemy, audio ↔ gameplay) | Yes |
| Would need `get_node('../../..')` | Yes — redesign toward bus or inject |
| Tight inner-loop call | No — direct method |

Rule of thumb: if sender and receiver share an ancestor that can mediate, skip the bus.

## Shape

```gdscript
# autoload event_bus.gd — past-tense signals, typed args
extends Node

signal player_died
signal score_changed(new_score: int)
signal item_collected(item_id: StringName)
```

```gdscript
# producer
EventBus.score_changed.emit(score)

# consumer
func _ready() -> void:
  EventBus.player_died.connect(_on_player_died)

func _exit_tree() -> void:
  if EventBus.player_died.is_connected(_on_player_died):
    EventBus.player_died.disconnect(_on_player_died)
```

**Disconnect in `_exit_tree` when the emitter (bus) outlives the receiver.** Fire-and-forget: `CONNECT_ONE_SHOT`.

Register/remove autoloads via project settings, then refresh with `godot-cli` (`godot --headless --import`). Justify a new bus-like autoload the same way as any autoload — usually you already have one.

## Payloads

Prefer a small `Resource` for structured multi-field events over untyped `Dictionary`. Keep payloads data-only (no node tree walks inside the Resource).

```gdscript
class_name CombatHitData
extends Resource

@export var damage: int
@export var is_critical: bool
```

## Anti-patterns

- Bus for parent/child chatter (over-decoupling)
- Multiple competing buses
- Handler re-emitting the same signal (loops)
- Long chains of bus → handler → bus → handler (orchestrate in one owner)
- Request/response RPCs over the bus when a direct call exists
- Forgetting disconnect on short-lived listeners of a long-lived bus
- Using the bus as a Service Locator / god object registry

## Groups note

For "announce to all of kind" without a typed bus signal, `get_tree().call_group('units', 'tick', 1)` is fine for reference-free broadcasts — different tool, same "don't hard-wire distant nodes" goal.

## Tiny verify

When checking a new bus signal: emit once from a producer smoke path, confirm the consumer handler runs, confirm `_exit_tree` disconnect leaves no dangling connection warnings on free.
