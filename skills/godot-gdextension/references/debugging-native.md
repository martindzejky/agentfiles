# Debugging native code

The script debugger cannot step into a native library — debug it as a shared library with the engine as host process. Back to [SKILL.md](../SKILL.md).

## Hot reload

`reloadable = true` in `[configuration]` reloads the library when you recompile, no editor restart. **Debug builds only.** Turn it off for shipped games.

## Debug vs release libs

```ini
[libraries]
windows.debug.x86_64 = "res://bin/gdexample.windows.template_debug.x86_64.dll"
windows.release.x86_64 = "res://bin/gdexample.windows.template_release.x86_64.dll"
```

- `template_debug` — symbols and assertions; used by the editor and debug exports
- `template_release` — optimized; must exist in a release export or the native type is missing at runtime

Keep both built so editor and exported game each load the right one.

## Attaching a debugger

- Build with debug symbols (`template_debug`, unoptimized)
- Launch the editor or game, then attach GDB (Linux), LLDB (macOS), or Visual Studio / WinDbg (Windows) to the process
- Break in your extension's source and trigger the code path from the game
- On Windows you can launch Godot directly as the debuggee with the `.pdb` next to the `.dll`

## Sanitizers

For memory and UB bugs, build the extension (ideally with a matching Godot) using `-fsanitize=address` / `-fsanitize=undefined` via your SCons or CMake flags, then run the game under it to catch use-after-free, out-of-bounds, and UB a plain debugger misses.
