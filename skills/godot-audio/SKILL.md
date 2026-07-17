---
name: godot-audio
description: 2D audio in Godot — buses, linear_to_db, stream looping, WAV SFX vs OGG music, AudioStreamPlayer2D, SFX pool, music autoload.
---

# Godot Audio (2D)

## Instructions

- Set up buses: at least `Master`, `Music`, `SFX`. Assign every player's `bus` by exact name.
- Prefer WAV for short SFX (no decode latency). Prefer OGG for music / long loops. Avoid MP3 for timing-critical SFX (encoder padding).
- Configure loop on the **AudioStream** import / resource, not in playback code.
- Use `linear_to_db` / `db_to_linear` for volume sliders. Mute near-zero instead of `linear_to_db(0)` (`-inf`).
- Prefer scene-local `AudioStreamPlayer` / `AudioStreamPlayer2D` for object SFX. Justify a music autoload — music must survive scene changes; review with the user before adding.
- Prefer an SFX pool (or `max_polyphony`) over spawning players every shot.

## Buses and volume

```gdscript
func set_bus_volume_linear(bus_name: String, linear: float) -> void:
  var index := AudioServer.get_bus_index(bus_name)
  if linear <= 0.001:
    AudioServer.set_bus_mute(index, true)
    return
  AudioServer.set_bus_mute(index, false)
  AudioServer.set_bus_volume_db(index, linear_to_db(linear))


func get_bus_volume_linear(bus_name: String) -> float:
  var index := AudioServer.get_bus_index(bus_name)
  return db_to_linear(AudioServer.get_bus_volume_db(index))
```

## Playback

```gdscript
@onready var sfx: AudioStreamPlayer2D = $sfx
@onready var music: AudioStreamPlayer = $music


func _ready() -> void:
  music.play()


func play_jump() -> void:
  sfx.stream = jump_stream
  sfx.play()
```

Prefer `@export` streams assigned in the scene over hard-coded paths.

## AudioStreamPlayer2D

Positional SFX relative to the current `Camera2D` (or an `AudioListener2D` if you need a custom ear).

| Property | Notes |
|----------|-------|
| `max_distance` | silent beyond |
| `attenuation` | falloff curve |
| `max_polyphony` | overlapping plays on one node |
| `bus` | usually `'SFX'` |

Default `area_mask` is `0` (Area2D bus override off). Set mask to the Area2D layer bit if you use bus-override zones.

## SFX pool idea

```gdscript
extends Node

@export var pool_size := 16

var _players: Array[AudioStreamPlayer] = []
var _index := 0


func _ready() -> void:
  for i in pool_size:
    var player := AudioStreamPlayer.new()
    player.bus = 'SFX'
    add_child(player)
    _players.append(player)


func play(stream: AudioStream, volume_db := 0.0, pitch_scale := 1.0) -> void:
  var player := _players[_index]
  _index = (_index + 1) % pool_size
  player.stream = stream
  player.volume_db = volume_db
  player.pitch_scale = pitch_scale
  player.play()
```

Round-robin steals the oldest voice when saturated — fine for SFX. Pitch-vary footsteps slightly to reduce machine-gun repetition.

## Music autoload (justified)

Only when tracks must outlive the current scene. Dual `AudioStreamPlayer` + volume tween crossfade is enough:

```gdscript
func play_music(stream: AudioStream) -> void:
  if _active.stream == stream and _active.playing:
    return
  var next := _player_b if _active == _player_a else _player_a
  next.stream = stream
  next.volume_db = -80.0
  next.play()
  var tween := create_tween().set_parallel(true)
  tween.tween_property(_active, 'volume_db', -80.0, crossfade_sec)
  tween.tween_property(next, 'volume_db', 0.0, crossfade_sec)
  tween.chain().tween_callback(_active.stop)
  _active = next
```

After registering a new autoload, refresh editor state with the `godot-cli` skill (`godot --headless --import`).

## Pitfalls

| Symptom | Fix |
|---------|-----|
| no sound | player in tree? bus name? muted? |
| music restarts on change_scene | move player to justified autoload |
| 2D pan missing | need current Camera2D / listener |
| slider feels wrong | use `linear_to_db` |
| click/pop | tiny fade on WAV edges |
