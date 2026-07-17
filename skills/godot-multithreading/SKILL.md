---
name: godot-multithreading
description: Thin reference for off-main-thread work — scene tree not thread-safe, call_deferred, WorkerThreadPool waits, Mutex on Array resize, load_threaded poll. Use when adding threads or threaded resource loads.
---

# Godot Multithreading

Thin reference. Profile first (**godot-optimization**) — only thread genuinely expensive CPU work.

## Rules

- Scene tree is **not** thread-safe. Mutate nodes only on the main thread.
- From workers: hand results back with `call_deferred` / `set_deferred`.
- `Array`/`Dictionary`: reading existing elements across threads is OK; **resize/add/remove needs a `Mutex`**.
- No GPU/texture work off the main thread (RenderingServer sync stalls).
- AStar is not thread-safe across threads.

```gdscript
# unsafe from worker:
world.add_child(enemy)
# safe:
world.add_child.call_deferred(enemy)
```

## WorkerThreadPool

Prefer for short parallel jobs. **Always** `wait_for_task_completion` / `wait_for_group_task_completion` or resources leak.

```gdscript
func _process(_delta: float) -> void:
  var task_id := WorkerThreadPool.add_group_task(_process_enemy_ai, enemies.size())
  # ... other main-thread work ...
  WorkerThreadPool.wait_for_group_task_completion(task_id)

func _process_enemy_ai(enemy_index: int) -> void:
  var enemy = enemies[enemy_index]
  # pure CPU — no scene-tree mutation
```

Do not wait on a pool task from inside another pool task (`ERR_BUSY` deadlock risk).

## Thread / Mutex

Use for long-lived workers. Join with `wait_to_finish()` before free. Keep critical sections short; lock all resizes.

## Threaded resource load

```gdscript
ResourceLoader.load_threaded_request(path)
# poll load_threaded_get_status each frame; only then load_threaded_get
```

Statuses: `IN_PROGRESS` / `LOADED` / `FAILED` / `INVALID_RESOURCE`.

## Pitfalls

See [references/pitfalls.md](references/pitfalls.md).
