---
name: godot-audio
description: Set up Godot audio routing, positional listeners, randomized SFX, loops, and playback lifetimes. Use when wiring or debugging 2D/3D audio; leave listening and mix approval to the user.
---

# Godot Audio

## Instructions

- Follow the project's bus layout and assign every player's `bus` by exact name. Add category buses only when the mix needs them.
- Prefer WAV for short SFX (no decode latency). Prefer OGG for music / long loops. Avoid MP3 for timing-critical SFX (encoder padding).
- Configure loop on the **AudioStream** import / resource, not in playback code.
- Use `linear_to_db` / `db_to_linear` for volume sliders. Mute near-zero instead of `linear_to_db(0)` (`-inf`).
- Prefer scene-local `AudioStreamPlayer`, `AudioStreamPlayer2D`, or `AudioStreamPlayer3D` according to whether the sound is non-positional, 2D, or 3D. Justify a music autoload — music must survive scene changes; review with the user before adding.
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
@export var sfx: AudioStreamPlayer2D
@export var music: AudioStreamPlayer


func _ready() -> void:
  music.play()


func play_jump() -> void:
  sfx.stream = jump_stream
  sfx.play()
```

Prefer `@export` streams assigned in the scene over hard-coded paths.

## AudioStreamPlayer2D

Positional SFX relative to the current `Camera2D` (or an `AudioListener2D` if you need a custom ear).

| Property        | Notes                         |
| --------------- | ----------------------------- |
| `max_distance`  | silent beyond                 |
| `attenuation`   | falloff curve                 |
| `max_polyphony` | overlapping plays on one node |
| `bus`           | usually `'SFX'`               |

Default `area_mask` is `0` (Area2D bus override off). Set mask to the Area2D layer bit if you use bus-override zones.

## 3D listener and routing

Choose where the player should hear from. With a distant or independently moving camera, place an `AudioListener3D` at the intended listening position and call `make_current()`; otherwise the current Camera3D supplies the listener. Check which listener is active before compensating for unexpectedly quiet sounds with gain.

Keep UI feedback non-positional unless spatial placement is intentional. When world sounds share room effects, route them through a world bus feeding the main SFX bus, while UI can use a separate path. A reverb effect on a bus applies to routed audio; it does not automatically become distance-dependent. Use spatial/area reverb deliberately when that behavior is wanted.

## Repeated sounds and lifetimes

- Prefer an `AudioStreamRandomizer` resource for variant selection, small pitch/volume variation, and `PLAYBACK_RANDOM_NO_REPEATS` when consecutive repeats are unwanted. With one variant it necessarily repeats; do not promise otherwise. Keep variation subtle and let the user tune it.
- Decide whether a new cue overlaps, interrupts, or waits for the previous one. One voice can be correct for footsteps or an attack vocal; use polyphony/pooling only when overlap is intended.
- Drive synchronized cues from the actual gameplay or animation event. A one-time success cue should not repeat on later cosmetic repetitions of an already-completed action.
- For a loop or a chain of carry/movement clips, tie playback to the relevant activity and stop/fade it when the activity ends. Avoid replaying `play()` every frame or leaving a loop alive after drop, death, pause, or scene replacement when it should have stopped.

## Verification and listening

Agents can inspect streams, routing, listener setup, triggering, playback state, and timing. They cannot hear the result in this workflow. Do not claim a sound is audible, balanced, or pleasant because a player reports `playing` or an export passes. Leave listening, loudness, reverb, and mix approval to the user; give a repeatable in-game action to audition the change.

Docs: [AudioListener3D](https://docs.godotengine.org/en/stable/classes/class_audiolistener3d.html), [AudioStreamRandomizer](https://docs.godotengine.org/en/stable/classes/class_audiostreamrandomizer.html).

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
  var outgoing := _active
  var next := _player_b if _active == _player_a else _player_a
  next.stream = stream
  next.volume_db = -80.0
  next.play()
  var tween := create_tween().set_parallel(true)
  tween.tween_property(outgoing, 'volume_db', -80.0, crossfade_sec)
  tween.tween_property(next, 'volume_db', 0.0, crossfade_sec)
  tween.chain().tween_callback(func() -> void:
    outgoing.stop()
    _active = next
  )
```

After registering a new autoload, refresh editor state with the `godot-cli` skill (`godot --headless --import`).

## Pitfalls

| Symptom                        | Fix                                       |
| ------------------------------ | ----------------------------------------- |
| no sound                       | player in tree? bus name? muted?          |
| music restarts on change_scene | move player to justified autoload         |
| 2D pan missing                 | need current Camera2D / listener          |
| 3D SFX unexpectedly distant    | check active listener before raising gain |
| slider feels wrong             | use `linear_to_db`                        |
| click/pop                      | tiny fade on WAV edges                    |
| crossfade glitches             | swap `_active` only after fade callback   |
