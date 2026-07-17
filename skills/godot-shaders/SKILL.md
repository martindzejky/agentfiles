---
name: godot-shaders
description: Write canvas_item shaders for 2D — builtins, uniforms, shared Shader vs ShaderMaterial, ColorRect post. Use when adding dissolve, outline, flash, screen effects, or .gdshader files.
---

# Godot Shaders (2D)

`canvas_item` only. Spatial / compositor / stencil deep dives: not used — 2D project.

## Shader vs material

- `.gdshader` — the code (share across nodes)
- `ShaderMaterial` — per-instance uniforms

Share one `Shader`; use separate `ShaderMaterial`s when uniforms differ. Unique materials break draw batches — see **godot-optimization**.

## Minimal

```glsl
shader_type canvas_item;

void fragment() {
  COLOR = texture(TEXTURE, UV);
}
```

## Builtins

| Name | Notes |
|---|---|
| `UV` / `TEXTURE` / `COLOR` | Sample and write |
| `TEXTURE_PIXEL_SIZE` | Outline / pixel offsets |
| `TIME` | Animation |
| `SCREEN_UV` | Screen-space |
| `VERTEX` | In `vertex()` |

Screen read (`SCREEN_TEXTURE` removed; use a uniform):

```glsl
uniform sampler2D screen_texture : hint_screen_texture, filter_linear_mipmap;
```

## Uniforms

```glsl
uniform float speed : hint_range(0.0, 10.0, 0.1) = 1.0;
uniform vec4 tint_color : source_color = vec4(1.0);
uniform sampler2D noise_texture : filter_linear_mipmap;
```

```gdscript
var mat: ShaderMaterial = $sprite.material
mat.set_shader_parameter('speed', 2.0)
mat.set_shader_parameter('tint_color', Color.RED)
```

Hints: `hint_range`, `source_color`, `filter_*`, `repeat_enable`, `hint_normal`, `hint_screen_texture`.

## Render modes

```glsl
shader_type canvas_item;
render_mode unshaded, blend_mix; // or blend_add, blend_premul_alpha, light_only
```

## Post (ColorRect)

```
root
├── world
└── canvas_layer          # high layer
    └── color_rect        # full rect, mouse_filter = ignore, ShaderMaterial
```

Sample `hint_screen_texture` or drive from a `SubViewport` texture.

## Recipes

See [references/2d-shader-recipes.md](references/2d-shader-recipes.md) — dissolve, outline, flash, color swap, UV scroll, wave.

## Pitfalls

| Symptom | Fix |
|---|---|
| No effect | Material/shader not assigned or not saved |
| Black transparency | Preserve `COLOR.a = tex.a` |
| Uniform missing | Typo / shader compile error |
| Screen sample empty | Need `hint_screen_texture` uniform |
| Batch breaks | Too many unique ShaderMaterials |

Drive animated params with Tween/`AnimationPlayer`, not `_process` when possible.
