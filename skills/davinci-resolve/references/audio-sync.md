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

Source-frame offsets, source seconds, timeline frames and WAV import-time rates have distinct domains. Before deriving ranges from getter values, read [source-frame field notes](field-notes.md#source-frames-audio-and-timecode); absolute timecode seconds must not be multiplied into file-relative frame offsets.

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

For a section measurement, trim **before** the analyzer. Output `-t` alone can let a buffering analyzer consume beyond the requested window:

```sh
ffmpeg -hide_banner -nostdin -i render.mp4 -map 0:a:0 -vn \
  -af "atrim=start=12:end=20,asetpts=PTS-STARTPTS,ebur128=peak=true" \
  -f null - 2> section-loudness.log
```

The seconds above are illustrative; resolve the actual section and stream first. Keep floating-point samples through EQ/compression/peak control if intermediate gain could exceed fixed-point headroom, and check the rendered output. Resolve WAVs can use WAVE_FORMAT_EXTENSIBLE, unsupported by Python 3.9's `wave`; decode through FFmpeg rather than declaring the source corrupt.

### Repair a word from existing speech

For an authorized audio-only repair, first search the same speaker/session for a donor with compatible pronunciation, pitch and surrounding coarticulation. Keep picture/timing unchanged. Record donor and destination source seconds, account for extraction offsets, and build a separate repaired audio derivative with short joins. Avoid forcing a whole word into too short a gap or assuming transcript timings capture consonants. Compare duration, sample/channel layout and early/late sync, then render and audition the whole sentence. The local trial produced an accepted repair, but a slightly fast/cut-off word remained: intelligibility and naturalness require review, not just a duration match.

## Fairlight scope

Native per-clip gain/pan/isolation is not full Fairlight plugin-graph or mix-automation control. The [community audio skill](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/.agents/skills/resolve-audio/SKILL.md) identifies saved Fairlight presets as a whole-mix workaround, not a content-adaptive auto-mix. The inspected native API exposes `GetFairlightPresets` and `ApplyFairlightPresetToCurrentTimeline` (20.2.2+); applying one can replace existing mix state. Inspect the target and preserve recovery before using a requested preset. No AI Audio Assistant trigger was documented in the inspected 21.1 API. Recheck current definitions before offering that automation rather than inventing a method or treating a saved preset as equivalent.
