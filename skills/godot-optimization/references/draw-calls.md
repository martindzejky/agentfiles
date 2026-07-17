# Draw calls (2D thin)

`CanvasGroup` renders all child `CanvasItem`s as one draw (backbuffer composite). Use for correct translucency stacking and fewer draw passes. Clip children / occluders between groups break batching. Automatic 2D batching (same texture, blend mode, shader) applies separately without `CanvasGroup`.

```gdscript
# bad — unique material per sprite
func _ready() -> void:
  var mat := ShaderMaterial.new()
  mat.shader = preload('res://shaders/tint.gdshader')
  $sprite.material = mat

# better — share material; duplicate only when uniforms must diverge
@export var shared_material: ShaderMaterial

func _ready() -> void:
  var mat: ShaderMaterial = shared_material.duplicate()
  mat.set_shader_parameter('tint', Color(randf(), randf(), randf()))
  $sprite.material = mat
```

Atlas pack sprites/UI icons. Prefer one TileSet atlas per `TileMapLayer`.
