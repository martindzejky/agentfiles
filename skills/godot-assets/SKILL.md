---
name: godot-assets
description: Import and manage 2D assets — .import commit, compression, Fix Alpha Border, Nearest filter, audio, .tres vs .res, threaded load. Use when importing textures/audio or fixing blurry/halo sprites.
---

# Godot Assets (2D)

## Import rules

```
textures/player.png          ← commit
textures/player.png.import   ← commit (settings)
.godot/imported/             ← gitignore only
```

- Never edit `.godot/imported/`
- Change settings in Import dock → **Reimport**
- Lost settings after clone → `.import` files were not committed

## Texture compression (2D)

| Mode            | Use                                |
| --------------- | ---------------------------------- |
| Lossless        | Pixel art, UI icons, small sprites |
| Lossy           | Large photos/backgrounds           |
| VRAM Compressed | Large 2D sprites / mobile VRAM     |

Also: **Fix Alpha Border** on (kills dark edges on transparency). Pixel art → filter **Nearest** (project default or per-file). Mipmaps usually off for UI/sprites unless Camera2D zooms out a lot.

```
Project → Rendering → Textures → Canvas Textures → Default Texture Filter → Nearest
```

## Audio

| Format | Use                     |
| ------ | ----------------------- |
| WAV    | Short SFX (low latency) |
| OGG    | Music / long loops      |
| MP3    | Music fallback          |

Import: Loop / Loop Offset for music; trim pops at loop points in the source file.

## .tres vs .res

|         |                                     |
| ------- | ----------------------------------- |
| `.tres` | Text, diffable — data defs, configs |
| `.res`  | Binary — large/generated            |
| `.tscn` | Prefer text scenes for VCS          |

Path-loaded resources are shared; `duplicate()` before mutating instance state.

## Threaded load

```gdscript
ResourceLoader.load_threaded_request(path)

func _process(_delta: float) -> void:
  var progress: Array = []
  var status := ResourceLoader.load_threaded_get_status(path, progress)
  match status:
    ResourceLoader.THREAD_LOAD_LOADED:
      var scene: PackedScene = ResourceLoader.load_threaded_get(path)
      add_child(scene.instantiate())
      set_process(false)
    ResourceLoader.THREAD_LOAD_FAILED, ResourceLoader.THREAD_LOAD_INVALID_RESOURCE:
      push_error('load failed: %s' % path)
      set_process(false)
```

Always poll status before `load_threaded_get` (it blocks if unfinished). See **godot-multithreading**.

## Pitfalls

| Symptom              | Fix                               |
| -------------------- | --------------------------------- |
| Blurry pixels        | Nearest filter                    |
| Dark sprite outlines | Fix Alpha Border                  |
| Import settings lost | Commit `.import`                  |
| High VRAM            | VRAM Compressed on large textures |
