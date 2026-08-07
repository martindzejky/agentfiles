# Performance debugging

Back to [SKILL.md](../SKILL.md).

## Profiler

Debugger → **Profiler** → Start → play the heavy scenario → Stop.

- Sort by **Self** time first.
- High **Calls** on cheap functions still burns budget — often unjustified `_process`.
- Manual block timing:

```gdscript
var start := Time.get_ticks_usec()
_do_work()
print('took %d us' % (Time.get_ticks_usec() - start))
```

## Monitors

| Monitor                         | Watch for                              |
| ------------------------------- | -------------------------------------- |
| FPS / Process / Physics Process | Frame budget overrun                   |
| Object Count                    | Climbing = leak / missing `queue_free` |
| Video RAM                       | Climbing textures                      |
| 2D draw calls                   | Excessive unique materials/sprites     |

## Usual culprits (2D)

- Unjustified `_process` / `_physics_process` sync loops
- `$` / `get_node` / `load` in hot paths
- `distance_to` in tight loops — prefer `distance_squared_to`
- Too many physics bodies awake; overlap spam without filters
- Off-screen work — pause with `VisibleOnScreenNotifier2D` + `set_process(false)`

## Physics spiral

If physics ticks/sec fall below `Engine.physics_ticks_per_second`, cut work in `_physics_process` or reduce body/collision complexity before lowering tick rate.
