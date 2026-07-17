---
name: godot-debugging
description: Debug Godot 2D GDScript projects — prints, breakpoints, signal tracing, scene tree inspection, profiler, and a systematic method. Use when hunting runtime bugs or performance issues.
---

# Godot Debugging

2D + GDScript. For smoke/debug runs from the terminal, use the `godot-cli` skill:

```bash
godot --headless --import
godot path/to/scene.tscn --quit
godot path/to/scene.tscn --debug --quit
godot --headless --script path/to/file.gd --check-only
```

Isolated object scenes may error from missing world context — distinguish that from real regressions (see `godot-cli`).

## Quick tools

| Tool | Use |
|------|-----|
| `print` / `print_rich` | Values / colour-coded logs |
| `print_debug` | Like `print()`, plus stack frame when debugger is attached (still prints in release) |
| `push_warning` / `push_error` | Recoverable vs programmer errors (stack traces) |
| `breakpoint` | Pause in debugger |
| Remote scene tree | Live node Inspector while running |
| Debugger → Profiler / Monitors | Self-time, FPS, object count, draw calls |

```gdscript
print_rich('[color=yellow]%s[/color] hp=%d' % [name, health])
push_error('required export missing: interaction_area')
```

## Common errors

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Node not found | Bad path / too early | After `_ready`; prefer `@export` |
| Null instance | Freed node or unset export | `is_instance_valid`; assign exports in scene |
| Flushing queries | Mutate collision in physics callback | `set_deferred(...)` |
| Already connected | Double `connect` | `is_connected` or scene-wire once |
| Await after free | Node freed during await | Guard with `is_instance_valid` |
| Invalid call / wrong type | Bad cast or missing script | Typed refs / `as` + assert |

## Footguns

- `$` / `get_node` / `load` in `_process` — cache or use `@export`
- Syncing UI/state every frame — prefer signals/setters (`godot-scripts`)
- Shared Resource mutation — `duplicate()` first
- Signal never fires — wrong name, wrong node, connected after emit, or not scene-wired
- Lambdas on long-lived emitters capturing freed `self`
- Physics callback mutating `CollisionShape2D.disabled` without `set_deferred`

```gdscript
# inside body_entered / similar
shape.set_deferred('disabled', true)
```

## Method

Reproduce → Isolate → Hypothesis → Trace → Fix → Verify.

Prefer minimal repro scenes; when an object needs world context, smoke the real entry scene. Full steps: [systematic-method.md](references/systematic-method.md).

Do not jump to a speculative fix — kill or confirm the hypothesis with a trace first.

## References

- [systematic-method.md](references/systematic-method.md) — ordered debug loop
- [scene-tree-debugging.md](references/scene-tree-debugging.md) — `print_tree_pretty`, Remote, groups, `@tool` warnings
- [signal-tracing.md](references/signal-tracing.md) — connection dumps, double-connect, await-after-free
- [performance-debugging.md](references/performance-debugging.md) — Profiler, Monitors, 2D hotspots
