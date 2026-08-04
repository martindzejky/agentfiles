---
name: godot-gdextension
description: Native extension reference — godot-cpp setup, GDCLASS + _bind_methods, entry symbol, .gdextension libraries, compatibility rules. Use when moving a hot path to native C++/Rust or wrapping a C/C++ library.
---

# Godot GDExtension

Native shared library loaded by a **stock** engine — no custom engine build. It is more work than GDScript, so profile first (**godot-optimization**) and exhaust typed / `Packed*Array` / pooling idioms before going native. See **godot-addons** for shipping it as an editor plugin.

## When

- A profiled hot loop GDScript genuinely cannot keep up with
- Wrapping a C/C++ library you must call directly
- Building a language binding

C++ **modules** are the other native option, but they compile into the engine and force shipping a custom engine binary. GDExtension ships only the library.

Three pieces make it work: `gdextension_interface.h` (C ABI), `extension_api.json` (exposed engine API), and the `*.gdextension` load config.

## Setup

```bash
mkdir gdextension_example && cd gdextension_example
git init
# branch must match the target engine version, '4.x' in the docs is a placeholder
git submodule add -b 4.3 https://github.com/godotengine/godot-cpp
cd godot-cpp && git submodule update --init && cd ..
```

```
gdextension_example/
├── project/                 # demo project to test the extension
│   ├── main.tscn
│   └── bin/gdexample.gdextension
├── godot-cpp/               # bindings submodule
└── src/
    ├── register_types.{h,cpp}
    └── gdexample.{h,cpp}
```

- Build with `scons platform=<platform>` (omit for the current one, `platform=list` to enumerate). Default target is **debug**; add `target=template_release` for optimized builds. Output lands in `project/bin/`.
- Take the `SConstruct` from the C++ tutorial or [godot-cpp-template](https://github.com/godotengine/godot-cpp-template) instead of hand-rolling one — the template also ships a GitHub Actions matrix for cross-platform builds.
- Develop and test against the **earliest** engine version you intend to support.
- godot-cpp 10.x (`master`, still beta) is versioned independently of the engine: pick the target with `scons api_version=4.3` (or `custom_api_file=extension_api.json` from `godot --dump-extension-api`) instead of a version branch.

## Bind a class

```cpp
#pragma once
#include <godot_cpp/classes/sprite2d.hpp>

namespace godot {
class GDExample : public Sprite2D {
    GDCLASS(GDExample, Sprite2D)
private:
    double time_passed = 0.0;
    double speed = 1.0;
protected:
    static void _bind_methods();
public:
    void _process(double delta) override;
    void set_speed(double p_speed);
    double get_speed() const;
};
}
```

```cpp
void GDExample::_bind_methods() {
    ClassDB::bind_method(D_METHOD("get_speed"), &GDExample::get_speed);
    ClassDB::bind_method(D_METHOD("set_speed", "p_speed"), &GDExample::set_speed);
    ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "speed", PROPERTY_HINT_RANGE, "0,20,0.01"),
                 "set_speed", "get_speed");

    ADD_SIGNAL(MethodInfo("position_changed",
               PropertyInfo(Variant::OBJECT, "node"),
               PropertyInfo(Variant::VECTOR2, "new_pos")));
}
```

- `GDCLASS(Class, Parent)` — first line of the class body, registers the type in `ClassDB`
- `ClassDB::bind_method(D_METHOD("name", "arg"), &Class::method)` — exposes a method and names its arguments
- `ADD_PROPERTY(PropertyInfo(...), setter, getter)` — Inspector property; bind getter and setter **first**, then reference them by name. There is no `@export` here.
- `PROPERTY_HINT_RANGE` with `"0,20,0.01"` — min, max, step slider; other hints come from `@GlobalScope`
- `ADD_SIGNAL(MethodInfo(...))` — typed signal, emit with `emit_signal("position_changed", this, new_position)`
- Engine virtuals are plain `override`s (`_process`, `_ready`, ...)
- Listening to another node's signal: `other->connect("the_signal", Callable(this, "my_method"))` — `my_method` must be bound first

## Entry point

```cpp
void initialize_example_module(ModuleInitializationLevel p_level) {
    if (p_level != MODULE_INITIALIZATION_LEVEL_SCENE) return;
    GDREGISTER_CLASS(GDExample);
}
void uninitialize_example_module(ModuleInitializationLevel p_level) {
    if (p_level != MODULE_INITIALIZATION_LEVEL_SCENE) return;
}
extern "C" {
GDExtensionBool GDE_EXPORT example_library_init(
    GDExtensionInterfaceGetProcAddress p_get_proc_address,
    const GDExtensionClassLibraryPtr p_library,
    GDExtensionInitialization *r_initialization) {
    godot::GDExtensionBinding::InitObject init_obj(p_get_proc_address, p_library, r_initialization);
    init_obj.register_initializer(initialize_example_module);
    init_obj.register_terminator(uninitialize_example_module);
    init_obj.set_minimum_library_initialization_level(MODULE_INITIALIZATION_LEVEL_SCENE);
    return init_obj.init();
}
}
```

```ini
[configuration]
entry_symbol = "example_library_init"
compatibility_minimum = "4.3"
reloadable = true

[libraries]
macos.debug = "./libgdexample.macos.template_debug.dylib"
macos.release = "./libgdexample.macos.template_release.dylib"
windows.debug.x86_64 = "./gdexample.windows.template_debug.x86_64.dll"
windows.release.x86_64 = "./gdexample.windows.template_release.x86_64.dll"
linux.debug.x86_64 = "./libgdexample.linux.template_debug.x86_64.so"
linux.release.x86_64 = "./libgdexample.linux.template_release.x86_64.so"
```

- The exported `extern "C"` symbol must equal `entry_symbol`, or nothing loads.
- `[libraries]` keys are feature tags (`platform.build.arch`). Entries are evaluated top to bottom, so put the more specific tags first. Relative paths are preferred over `res://` so the extension survives being installed elsewhere. Only the matching binary gets exported.
- Optional `[icons]` maps a class to a 16×16 SVG editor icon; `[dependencies]` lists extra libs to copy on export (macOS wants them under `Contents/Frameworks`).

## Compatibility

- Forward, not backward: an extension built for 4.2 loads in 4.3, but a 4.3 one will not load in 4.2. Exception: 4.0 extensions do not work in 4.1+.
- `compatibility_minimum` (4.1+) = lowest engine version you support; `compatibility_maximum` (4.3+) locks out newer ones.
- `reloadable = true` reloads on recompile without restarting the editor — godot-cpp 4.2+, **debug builds only**, meant for development.
- Rebuild against bindings matching the engine when upgrading. Notably 4.7 changed `Object.is_class()` to take a `StringName`, deprecated the `object_cast_to` / `classdb_get_class_tag` interface functions in favour of `is_class` casts, and dropped GDExtension support for custom text servers (a `TextServer` now needs an engine module).

## Use from GDScript

Once built, the bound class behaves like any node type: properties show in the Inspector, signals in the Node dock.

```gdscript
extends Node

func _ready() -> void:
  var example := GDExample.new()
  example.speed = 2.0
  example.position_changed.connect(_on_example_position_changed)
  add_child(example)

func _on_example_position_changed(node: Node, new_pos: Vector2) -> void:
  print('%s moved to %s' % [node.get_class(), new_pos])
```

Wire native nodes in scene files like any other node; `new()` only for dynamic spawns.

## Pitfalls

| Symptom | Cause |
|---|---|
| Extension never loads | `entry_symbol` differs from the exported `extern "C"` symbol |
| Works locally, missing on another platform | wrong path / arch key in `[libraries]`, or a broader tag listed above a specific one |
| Class unknown in an exported game | `template_release` binaries not built or not shipped |
| Load failure on the target engine | `compatibility_minimum` too low, or bindings built against a newer engine |
| Class not registered | registration not gated on `MODULE_INITIALIZATION_LEVEL_SCENE` |
| Method unknown from GDScript | not bound in `_bind_methods` |
| Hot reload does nothing | release build, or `reloadable` not set |

## Optional refs

- [references/rust-gdext.md](references/rust-gdext.md) — community Rust binding, fixed entry symbol
- [references/debugging-native.md](references/debugging-native.md) — debug vs release libs, attaching a debugger, sanitizers

## Docs

- [What is GDExtension](https://docs.godotengine.org/en/stable/engine_details/engine_api/gdextension/what_is_gdextension.html)
- [C++ getting started](https://docs.godotengine.org/en/stable/tutorials/scripting/cpp/gdextension_cpp_example.html)
- [The .gdextension file](https://docs.godotengine.org/en/stable/engine_details/engine_api/gdextension/gdextension_file.html)
- [godot-cpp](https://github.com/godotengine/godot-cpp) · [godot-cpp-template](https://github.com/godotengine/godot-cpp-template)
