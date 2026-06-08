---
name: godot-cli
description: Work with Godot from the terminal. Use when refreshing editor-managed project state after new `class_name`s, autoload registration, or `uid` changes, when parse-checking scripts, smoke-checking or debugging scenes, or when exporting builds from the CLI.
---

# Godot CLI

## Instructions

- Run commands from the project root.
- Prefer `godot` from `PATH`.
- Use Godot's editor CLI instead of workarounds when the editor needs to refresh project-managed state.

## Refresh editor-managed state

Run this first when you need Godot to pick up project changes such as:

- a new or renamed `class_name`
- a newly registered autoload
- regenerated or newly assigned scene/resource `uid`s

```bash
godot --import --headless .
```

## Verify a specific script

If you still need Godot to parse-check a specific GDScript file after the refresh step, run:

```bash
godot --headless --script path/to/file.gd --check-only
```

The path is interpreted as relative to the project's root.

Use this second, after `godot --import --headless .`, when the change depends on editor-managed project state. You can also use this check on its own if you did not change anything needing a full editor refresh and just want to verify your changes in scripts.

## Smoke-check a scene

Use this to run a scene briefly and quit while still printing startup errors:

```bash
godot path/to/scene.tscn --quit
```

This is useful after editing a scene when you want a quick verification that it starts without obvious runtime errors.

Be careful with object scenes run in isolation. Some scenes are only valid when spawned by the real game flow and may depend on:

- runtime-assigned data before entering the tree
- autoload-backed setup that only exists in the main game
- parent or sibling nodes from the full world scene
- global helper nodes such as shared shadow or rendering setup

If an isolated scene reports errors that clearly come from missing game context rather than from the edited code itself, treat that as an expected limitation of the check, not as an automatic failure. In those cases, prefer smoke-checking the real entry scene or the smallest valid in-game context instead.

## Debug a scene

Use this when a scene smoke check fails and you want Godot's debugger:

```bash
godot path/to/scene.tscn --debug --quit
```

Notes:

- Scene paths are interpreted as relative to the project root.
- Some object scenes depend on being run inside the full game/world setup, so isolated scene checks may fail even if the scene works in normal gameplay.
- Do not overreact to expected context errors from isolated object scenes. Distinguish "this scene needs game context" from "this change introduced a real bug".
- If the debugger stops on an error, use `q` to quit.

## Export a build

Use this to generate a new release export from the terminal:

```bash
godot --headless --export-release "<preset>" <path>
```

Notes:

- `<preset>` must exactly match a preset name from `export_presets.cfg`.
- `<path>` should include the output filename, not just the directory, i.e. `dist/web/index.html`.
- Use `--headless` for CLI exports so no window is spawned.
- Godot must be an editor build, and export templates must be installed.

## Notes

- Do not switch to path-based `extends` just because a new `class_name` has not been registered yet.
- If a script check does not depend on refreshed editor-managed state, you can run `--script ... --check-only` directly.
