---
name: godot-optimization
description: Profile and fix 2D performance — Self vs Total, draw calls, materials, VisibleOnScreenNotifier2D, pools, typed/Packed/StringName. Use when FPS drops, draw calls spike, or hot paths allocate.
---

# Godot Optimization

Profile before changing code. Budget ≈ 16.6 ms/frame at 60 fps.

## Profiler

Debugger → Profiler: **Self** = time in the function excluding callees (hotspot); **Total** = including callees; **Calls** = per-frame count.

```gdscript
var start := Time.get_ticks_usec()
_run_expensive()
print('_run_expensive: %d µs' % (Time.get_ticks_usec() - start))
```

Monitors: FPS, Process, Physics Process, Total Draw Calls, Video RAM, Object Count.

## Draw calls / batching

- Use `CanvasGroup` for group compositing (especially overlapping translucency), not as a general batching optimization: it needs a backbuffer pass
- Atlas sprites where useful; keep draw order and material compatibility in mind
- Unique `ShaderMaterial`s can break batches — share materials; use `instance uniform` + `set_instance_shader_parameter()` for per-node values when supported
- Cull off-screen work with `VisibleOnScreenNotifier2D`

```gdscript
@export var visible_on_screen_notifier_2d: VisibleOnScreenNotifier2D

func _on_screen_entered() -> void:
  set_process(true)

func _on_screen_exited() -> void:
  set_process(false)
```

Wire the notifier's `screen_entered` and `screen_exited` signals to these callbacks in the scene. Start processing disabled when appropriate; do not disable physics that must continue off-screen.

See [references/draw-calls.md](references/draw-calls.md).

## Hot-path GDScript

- No `Array` / `Dictionary` / `String` alloc in `_process` / `_physics_process`
- Compare with `StringName` (`&'enemies'`)
- Prefer typed `Array[T]` and `Packed*Array`
- `@export` scene/resources at class scope — never `load()` per frame
- Prefer signals over per-frame polling

See [references/cpu.md](references/cpu.md).

## Memory & pools

- Watch `Performance.MEMORY_STATIC` / `OBJECT_COUNT` across reloads
- Path-loaded resources are shared — `duplicate()` before mutating instance state
- Prefer `queue_free()`; pool bullets/VFX instead of spawn/`queue_free` churn

See [references/pools.md](references/pools.md).

## Anti-patterns

| Bad                                    | Better                               |
| -------------------------------------- | ------------------------------------ |
| Alloc in `_process`                    | Cache / mutate in place              |
| Unique material per instance           | Shared material + instance uniforms  |
| `load()` / `instantiate()` in hot path | `@export` scene + pool               |
| Legacy `TileMap`                       | `TileMapLayer` with suitable atlases |
