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

Workers must operate on plain data (positions, ids, numbers) — never live Nodes. Snapshot on the main thread, compute off-thread, apply on the main thread.

```gdscript
# main thread: snapshot data only
var snapshots: Array[Dictionary] = []
for enemy in enemies:
  snapshots.append({
    'id': enemy.get_instance_id(),
    'pos': enemy.global_position,
  })

var results: Array[Dictionary] = []
results.resize(snapshots.size())

var task_id := WorkerThreadPool.add_group_task(
  func(i: int) -> void:
    var snap: Dictionary = snapshots[i]
    # pure CPU on snap data — no Node access
    var desired: Vector2 = snap['pos'] + Vector2.RIGHT
    results[i] = {'id': snap['id'], 'pos': desired}
  ,
  snapshots.size()
)
WorkerThreadPool.wait_for_group_task_completion(task_id)
# main thread: apply results to nodes
```

Do not wait on a pool task from inside another pool task (`ERR_BUSY` deadlock risk).

## Thread / Mutex

Use for long-lived workers. Join with `wait_to_finish()` before free. Keep critical sections short; lock all resizes.

## Threaded resource load

```gdscript
ResourceLoader.load_threaded_request(path)
# poll load_threaded_get_status each frame; only then load_threaded_get
```

Statuses: `THREAD_LOAD_IN_PROGRESS` / `THREAD_LOAD_LOADED` / `THREAD_LOAD_FAILED` / `THREAD_LOAD_INVALID_RESOURCE`.

## Pitfalls

### Deadlocks

- `wait_for_*_completion` from inside another pool task → `ERR_BUSY`
- Nested mutexes: always acquire in a fixed global order
- Skip `wait_for_*` → leak; double-wait freed id → `ERR_INVALID_PARAMETER`

### Data races

- Snapshot data before the worker; never touch live nodes off-main
- Guard shared scalars and container resizes with `Mutex`
- Do not mutate the same `Resource` instance from multiple threads

### When threading hurts

- Cheap work: pool overhead can exceed a plain loop
- Creating `Thread`s just-in-time is slow — pre-create long-lived workers
- Over-locking serializes back to single-thread speed
- GPU calls off-main force expensive sync stalls

### Await

Do not `await` node signals / coroutines from a `Thread` body — defer to main first.

### Separate render thread

`Rendering → Driver → Thread Model = Separate` has known bugs; prefer main-thread scene work + deferred adds. Not required for typical 2D loads.
