# Draw calls (2D thin)

`CanvasGroup` composites child `CanvasItem`s through a backbuffer so overlapping translucent items can be faded as a group. The children still need rendering; this is not a general way to reduce draw calls and can add cost. Automatic 2D batching applies separately to compatible items in draw order.

```gdscript
# bad — unique material per sprite
@export var sprite: Sprite2D
@export var tint_shader: Shader

func _ready() -> void:
  var mat := ShaderMaterial.new()
  mat.shader = tint_shader
  sprite.material = mat

# better — scene assigns a shared material whose shader declares:
# instance uniform vec4 tint : source_color = vec4(1.0);

func _ready() -> void:
  sprite.set_instance_shader_parameter('tint', Color(randf(), randf(), randf()))
```

Duplicate a material only when the required parameters cannot be instance uniforms, such as different textures. Atlas pack sprites/UI icons where useful; a `TileMapLayer` can use multiple atlas sources from its TileSet.

Docs: [CanvasGroup](https://docs.godotengine.org/en/stable/classes/class_canvasgroup.html) · [CanvasItem instance uniforms](https://docs.godotengine.org/en/stable/classes/class_canvasitem.html#class-canvasitem-method-set-instance-shader-parameter).
