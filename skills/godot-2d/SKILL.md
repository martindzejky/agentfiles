---
name: godot-2d
description: 2D cheatsheet — TileMapLayer, CanvasLayer, Parallax2D, pixel snap, draw order, tiling, parallax. Use when working with 2D nodes, draw order, tiling, parallax, or pixel-art.
---

# Godot 2D

Quick reference for common 2D nodes and pitfalls. See **godot-ui**, **godot-shaders**, **godot-assets** for related topics.

## TileMapLayer

Legacy `TileMap` (multi-layer in one node) is **deprecated**. Use one `TileMapLayer` per layer sharing a `TileSet` `.tres`.

- Set tile size **before** building atlases
- Enable atlas **Use Texture Padding** to stop bleeding
- Physics on tiles via TileSet physics layers — not ad-hoc `CollisionShape2D` per tile

## CanvasLayer vs z_index

| Need                                            | Use                           |
| ----------------------------------------------- | ----------------------------- |
| Draw order in the same world / camera           | Scene-tree order or `z_index` |
| Independent of camera (HUD, pause, transitions) | `CanvasLayer.layer`           |

Do not invent CanvasLayers just to sort sprites — that fights the camera and y-sort.

```
main
├── parallax layers / world (Node2D)
│   ├── tile_map_layer
│   └── player
└── hud (CanvasLayer, layer = 1)
```

## Parallax2D

`Parallax2D` replaces `ParallaxBackground` / `ParallaxLayer`.

- `scroll_scale` `< 1` = farther; `0` = static; `1` = camera lock
- Texture top-left at `(0, 0)` for repeat
- `repeat_size` must match texture size; raise `repeat_times` if the camera zooms out

## Pixel snap / subpixel jitter

Symptoms: shimmering edges, 1px crawl when camera/player moves.

Enable as needed:

- `Rendering → 2D → Snapping → Snap 2D Transforms to Pixel`
- `Snap 2D Vertices to Pixel`
- `GUI → General → Snap Controls to Pixels`

Also: stretch `viewport` + `Nearest` filter + integer scale (**godot-ui** pixel-art ref). Avoid MSAA 2D on pixel art — it softens intentional edges.

Camera/player positions that stay on fractional pixels will still crawl; snap motion or enable the project snap flags above.
