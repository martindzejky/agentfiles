# Pools (thin)

```gdscript
@export var bullet_scene: PackedScene

var _pool: Array[Node2D] = []

func _ready() -> void:
  for i in 32:
    var bullet: Node2D = bullet_scene.instantiate() as Node2D
    bullet.visible = false
    bullet.process_mode = Node.PROCESS_MODE_DISABLED
    add_child(bullet)
    _pool.append(bullet)

func acquire() -> Node2D:
  for bullet in _pool:
    if not bullet.visible:
      bullet.visible = true
      bullet.process_mode = Node.PROCESS_MODE_INHERIT
      return bullet
  return null  # or grow pool

func release(bullet: Node2D) -> void:
  bullet.visible = false
  bullet.process_mode = Node.PROCESS_MODE_DISABLED
  # reset velocity/position/signals here
```

Reset all state on release. Disabling processing does not remove a body or Area2D from the physics world: deactivate collision/monitoring too, using deferred changes during physics callbacks. Restore the intended process mode and collisions on acquire. Size the pool for peak gameplay, not average.
