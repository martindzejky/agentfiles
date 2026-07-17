---
name: godot-optimization
description: Profile and fix 2D performance — Self vs Total, CanvasGroup batching, unique materials, VisibleOnScreenNotifier2D, pools, typed/Packed/StringName. Use when FPS drops, draw calls spike, or hot paths allocate.
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

- Wrap related siblings in `CanvasGroup` when you need one composite draw (especially overlapping translucency)
- Atlas sprites; one atlas per tile layer
- Unique `ShaderMaterial` / `material = Material.new()` breaks batches — share materials; vary uniforms
- Cull off-screen work with `VisibleOnScreenNotifier2D`

```gdscript
func _ready() -> void:
  $visible_on_screen_notifier_2d.screen_entered.connect(func() -> void: set_process(true))
  $visible_on_screen_notifier_2d.screen_exited.connect(func() -> void: set_process(false))
  set_process(false)
```

See [references/draw-calls.md](references/draw-calls.md).

## Hot-path GDScript

- No `Array` / `Dictionary` / `String` alloc in `_process` / `_physics_process`
- Compare with `StringName` (`&'enemies'`)
- Prefer typed `Array[T]` and `Packed*Array`
- `preload` at class scope — never `load()` per frame
- Prefer signals over per-frame polling

See [references/cpu.md](references/cpu.md).

## Memory & pools

- Watch `Performance.MEMORY_STATIC` / `OBJECT_COUNT` across reloads
- Path-loaded resources are shared — `duplicate()` before mutating instance state
- Prefer `queue_free()`; pool bullets/VFX instead of spawn/`queue_free` churn

See [references/pools.md](references/pools.md).

## Anti-patterns

| Bad | Better |
|---|---|
| Alloc in `_process` | Cache / mutate in place |
| Unique material per instance | Shared material + uniforms |
| `load()` / `instantiate()` in hot path | `preload` + pool |
| Legacy `TileMap` | `TileMapLayer` + single atlas |
