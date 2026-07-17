# Draw calls (2D thin)

`CanvasGroup` batches children when they share texture, blend mode, and shader. Clip children / occluders between them break batches.

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
