# Audio and synchronization

## External audio and stacked recordings

Inspect streams, channel layout, rates and starting timecodes. Choose the audio master explicitly. For external audio, current native `MediaPool.AutoSyncAudio` accepts at least one video and one audio item:

```python
ok = project.GetMediaPool().AutoSyncAudio(clips, {
    "syncMode": resolve.AUDIO_SYNC_WAVEFORM,
    "channelNumber": resolve.AUDIO_SYNC_CHANNEL_AUTOMATIC,
    "retainEmbeddedAudio": True,
    "retainVideoMetadata": True,
})
if not ok:
    raise RuntimeError("audio sync failed")
result = [{"id": c.GetUniqueId(), "properties": c.GetClipProperty()} for c in clips]
```

`clips` are the exact matched media objects. Retaining embedded audio here is an explicit example to keep a recovery path, not a mix decision. Inspect actual channel mapping, playback and timing afterward. Choose timecode sync only when the devices/timecodes support it. Sync can alter media-pool associations; avoid applying it to unrelated footage.

For existing timeline items, fetch `Timeline.AutoAlignClips` and `AutoAlignOptions`. Inspect placement before/after and neighboring tracks. For manual offset analysis, extract short matching windows from the correct audio streams with FFmpeg and compare transients/correlation. Account for window origins and lag sign; verify with a known impulse before using correlation math. No untested fingerprint helper is bundled.

Document offsets with direction: `source_time = master_time + offset`, not an unexplained signed number. Check early/middle/late alignment. Sample-rate/device drift or interruptions invalidate a single constant offset. Do not force such recordings into the simple assembly helper. The helper also requires numeric Resolve `Frames` and `FPS` for every source, including WAVs; if unavailable, establish that source's frame/time mapping through a small native sync/placement probe rather than inventing an FPS from its sample rate.

When tightening screen+camera footage, apply the same edit mapping to both picture layers and all required audio. Inspect bounds for each source; use matching record positions and `SetClipsLinked` where appropriate. A timeline with the right duration can still have missing camera/audio or wrong source spans.

## Multicam

Resolve 21.1 exposes `MediaPool.CreateMulticamClip(clips, MulticamOptions)` and `TimelineItem.PerformMulticamSmartSwitch`/`FlattenMulticam`. Fetch their definitions and constants for the installed build. Choose angle naming, sync mode and audio policy deliberately, then inspect the resulting angles and sync. A stack of aligned tracks is not itself a native multicam clip. Do not flatten as an incidental analysis step, and do not feed nested multicam objects to the plain-source helper.

## Levels, fades and cleanup

Read current `TimelineItemProperties`; 21.1 includes native dB volume/pan/pitch, voice-isolation and dialogue-leveler controls. Example:

```python
before = item.GetProperties()
if not item.SetProperties({"AudioVolume": -3.0}):
    raise RuntimeError("audio gain change failed")
result = {"before": before, "after": item.GetProperties()}
```

Check the current unit/range and stream mapping; a successful value write does not establish a good mix. Use `SetFades` for explicit frame-counted fades. Normalization: discover `timeline.GetNormalizeAudioModes()`, fetch `NormalizeAudioOptions`, and call `NormalizeAudioLevel` only on the requested items. Loudness targets depend on the actual delivery requirement; do not invent one from platform folklore.

For channel changes inspect `GetAudioMapping`/`SetAudioMapping` and `GetSourceAudioChannelMapping`/`SetSourceAudioChannelMapping`. Preserve a mapping snapshot, inspect the channel assignments and listen to the result. Stereo helper tracks are not a substitute for production multichannel routing.

Voice isolation, dialogue processing, narration, music and SFX may use native features or ElevenLabs; see [toolkit.md](toolkit.md). Keep processed files separate, compare duration/channel/sample-rate/delay, and align them back to the original time basis. Processing can introduce leading silence, codec delay or shifted words. Check joins and sync across the recording.

Measure final output with FFmpeg `ebur128`, peaks and stream probing. These measurements cannot establish intelligibility, natural processing or whether music masks dialogue; listening remains part of finished-edit verification.
