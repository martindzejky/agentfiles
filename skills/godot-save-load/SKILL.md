---
name: godot-save-load
description: Persist Godot 4 data with ConfigFile and JSON on user://. Never load user .tres saves (script exec risk). Version migration, Vector2 as dict, DirAccess. No C#.
---

# Godot Save / Load

## Instructions

- Prefer `ConfigFile` for settings (audio, locale, bindings). Prefer JSON for game saves.
- Never use `.tres` / `.res` for player-controlled saves — loading them can execute embedded GDScript.
- Always write under `user://`, never `res://` (read-only when exported).
- Include a `version` int in every save; migrate old schemas forward incrementally.
- Serialize `Vector2` as `{ 'x': ..., 'y': ... }` — JSON has no Vector type.
- Call `DirAccess.make_dir_recursive_absolute` before first write. Check `FileAccess` errors and `push_error`.

## Strategy

| Format | Use | Avoid |
|--------|-----|-------|
| ConfigFile | settings, keybinds | deep nested game state |
| JSON | save slots, world state | pretending Resources are safe user files |
| `.tres` / `.res` | editor/project data only | anything from `user://` or untrusted sources |

## ConfigFile (settings)

```gdscript
func save_settings(master_linear: float, locale: String) -> void:
  var cfg := ConfigFile.new()
  cfg.set_value('audio', 'master', master_linear)
  cfg.set_value('general', 'locale', locale)
  cfg.save('user://settings.cfg')


func load_settings() -> void:
  var cfg := ConfigFile.new()
  if cfg.load('user://settings.cfg') != OK:
    return
  var master: float = cfg.get_value('audio', 'master', 1.0)
  var locale: String = cfg.get_value('general', 'locale', 'en')
  # apply...
```

## JSON (game save)

```gdscript
const SAVE_DIR := 'user://saves/'
const CURRENT_VERSION := 2


func _ready() -> void:
  DirAccess.make_dir_recursive_absolute(SAVE_DIR)


func save_game(slot: String) -> bool:
  var data := {
    'version': CURRENT_VERSION,
    'player': {
      'position': { 'x': player.global_position.x, 'y': player.global_position.y },
      'health': player.health,
    },
  }
  var path := SAVE_DIR + slot + '.json'
  var file := FileAccess.open(path, FileAccess.WRITE)
  if file == null:
    push_error('save failed: %s' % FileAccess.get_open_error())
    return false
  file.store_string(JSON.stringify(data, '\t'))
  return true


func load_game(slot: String) -> bool:
  var path := SAVE_DIR + slot + '.json'
  if not FileAccess.file_exists(path):
    return false
  var file := FileAccess.open(path, FileAccess.READ)
  if file == null:
    return false
  var parsed: Variant = JSON.parse_string(file.get_as_text())
  if typeof(parsed) != TYPE_DICTIONARY:
    push_error('invalid save: %s' % path)
    return false
  var data: Dictionary = _migrate(parsed)
  var pos: Dictionary = data['player']['position']
  player.global_position = Vector2(pos['x'], pos['y'])
  player.health = data['player']['health']
  return true
```

## Version migration

```gdscript
func _migrate(data: Dictionary) -> Dictionary:
  if not data.has('player') or typeof(data['player']) != TYPE_DICTIONARY:
    data['player'] = {}
  var player: Dictionary = data['player']
  var version: int = data.get('version', 0)
  if version < 1:
    player['inventory'] = []
    version = 1
  if version < 2:
    player['stamina'] = 100
    version = 2
  data['player'] = player
  data['version'] = CURRENT_VERSION
  return data
```

Ensure nested dicts exist before writing keys. Migrate `v1 → v2 → … → current` in order. Never require players to delete old slots.

## Slots

```gdscript
func list_slots() -> PackedStringArray:
  var slots: PackedStringArray = []
  var dir := DirAccess.open(SAVE_DIR)
  if dir == null:
    return slots
  dir.list_dir_begin()
  var name := dir.get_next()
  while name != '':
    if not dir.current_is_dir() and name.ends_with('.json'):
      slots.append(name.trim_suffix('.json'))
    name = dir.get_next()
  return slots


func delete_save(slot: String) -> void:
  DirAccess.remove_absolute(SAVE_DIR + slot + '.json')
```

## Pitfalls

| Symptom | Fix |
|---------|-----|
| save works in editor, fails export | use `user://` |
| Vector2 becomes string/null | store x/y dict |
| old saves crash | version + `_migrate` |
| “convenient” Resource save | do not — script exec risk |
