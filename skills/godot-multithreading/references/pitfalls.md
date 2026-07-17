# Multithreading pitfalls

Back to [SKILL.md](../SKILL.md).

## Deadlocks

- `wait_for_*_completion` from inside another pool task → `ERR_BUSY`
- Nested mutexes: always acquire in a fixed global order
- Skip `wait_for_*` → leak; double-wait freed id → `ERR_INVALID_PARAMETER`

## Data races

- Snapshot data before the worker; never touch live nodes off-main
- Guard shared scalars and container resizes with `Mutex`
- Do not mutate the same `Resource` instance from multiple threads

## When threading hurts

- Cheap work: pool overhead can exceed a plain loop
- Creating `Thread`s just-in-time is slow — pre-create long-lived workers
- Over-locking serializes back to single-thread speed
- GPU calls off-main force expensive sync stalls

## Await

Do not `await` node signals / coroutines from a `Thread` body — defer to main first.

## Separate render thread

`Rendering → Driver → Thread Model = Separate` has known bugs; prefer main-thread scene work + deferred adds. Not required for typical 2D loads.
