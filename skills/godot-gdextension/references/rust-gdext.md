# Rust — godot-rust / gdext

Community binding (MPL-2.0), not official — godot-cpp is the official path. Back to [SKILL.md](../SKILL.md).

## Crate

```toml
[lib]
crate-type = ["cdylib"]

[dependencies]
godot = "0.x.y"
```

## Entry point

No `extern "C"` function — an attribute on an `ExtensionLibrary` impl:

```rust
use godot::prelude::*;

struct MyExtension;

#[gdextension]
unsafe impl ExtensionLibrary for MyExtension {}
```

## Class, methods, signals

`#[derive(GodotClass)]` registers the type, `#[class(init, base=...)]` picks the base and generates a constructor, `#[init(val = ...)]` sets a default. Engine virtuals go in the `I*` trait impl, your own API in a plain `impl`; `#[func]` exposes a method, `#[signal]` declares a signal.

```rust
#[derive(GodotClass)]
#[class(init, base=Sprite2D)]
struct Player {
    base: Base<Sprite2D>,
    #[init(val = 100)]
    hitpoints: i32,
}

#[godot_api]
impl ISprite2D for Player {
    fn ready(&mut self) {
        godot_print!("player ready");
    }
}

#[godot_api]
impl Player {
    #[func]
    fn take_damage(&mut self, damage: i32) {
        self.hitpoints -= damage;
    }

    #[signal]
    fn got_message();
}
```

## .gdextension

Same as C++ except the entry symbol, which gdext fixes:

```ini
[configuration]
entry_symbol = "gdext_rust_init"
compatibility_minimum = "<engine-version>"
```

A gdext extension loads on any engine whose runtime version is at least the API version it was built against.
