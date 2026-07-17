# Pools (thin)

```gdscript
var _pool: Array[Node2D] = []

func _ready() -> void:
  for i in 32:
    var bullet: Node2D = preload('res://objects/bullet.tscn').instantiate()
    bullet.visible = false
    bullet.set_process(false)
    add_child(bullet)
    _pool.append(bullet)

func acquire() -> Node2D:
  for bullet in _pool:
    if not bullet.visible:
      bullet.visible = true
      bullet.set_process(true)
      return bullet
  return null  # or grow pool

func release(bullet: Node2D) -> void:
  bullet.visible = false
  bullet.set_process(false)
  # reset velocity/position/signals here
```

Reset all state on release. Size the pool for peak gameplay, not average.
