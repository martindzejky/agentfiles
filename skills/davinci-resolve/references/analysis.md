# Footage analysis

Analysis informs an edit. Keep provider/version, source identity, stream/channel, language, extraction offset and time basis beside its outputs. Save sidecars and sampled frames outside the originals; reuse valid analysis rather than retranscribing on every task.

## Check evidence coverage

Before proposing cuts, check which source clips and regions have current transcripts/visuals. Record gaps and stale analysis; a replaced/relinked file may no longer match old descriptions. Verify important marker labels against frames. Reuse current sidecars, but do not present sparse or stale evidence as full-footage review. See [coverage lessons](field-notes.md#analysis-coverage-and-silence).

## Transcript

For existing Resolve transcription, read `MediaPoolItem.GetTranscription`. To request it, inspect `TranscribeAudio`, the relevant background-status APIs and current speaker options first. Start once, poll where supported, and read the completed transcript. Native transcription `start`/`end` values are **timecode strings**, not ElevenLabs-style seconds. Preserve the actual data structure and frame/drop-frame basis.

For ElevenLabs use [toolkit.md](toolkit.md). Prefer it when the task benefits from its transcript/diarization or Resolve transcription is unavailable. Word timings are estimates: inspect audio around suspected retakes and unusually long words. Empty speech is valid. Check truncation and fetch complete word timing output before planning cuts.

## Signal candidates with FFmpeg

These host commands analyze one input without changing it. Thresholds are illustrative detector parameters, not personal pacing or delivery standards. Change them for the footage. FFmpeg logs filter results to stderr.

```sh
ffmpeg -hide_banner -nostdin -i input.mov -map 0:a:0 -vn \
  -af silencedetect=noise=-35dB:d=0.6 -f null - 2> silence.log

ffmpeg -hide_banner -nostdin -i input.mov -map 0:v:0 -an \
  -vf "scdet=threshold=10" -f null - 2> scenes.log

ffmpeg -hide_banner -nostdin -i input.mov -map 0:v:0 -an \
  -vf "blackdetect=d=0.5:pix_th=0.10,freezedetect=n=-50dB:d=2" \
  -f null - 2> picture-qc.log

ffmpeg -hide_banner -nostdin -i input.mov -map 0:a:0 -vn \
  -af ebur128=peak=true -f null - 2> loudness.log
```

Before using a silence threshold, inspect representative speech/room levels, optionally with FFmpeg `astats`, then review a short candidate pass. If the gate cannot distinguish speech from background, keep that region and report uncertainty. A fixed threshold can mark an entire quiet program as silence; the values above are detector examples, not a calibrated cut plan. See [silence lessons](field-notes.md#analysis-coverage-and-silence).

Select the right audio stream/channel: camera scratch audio and a recorder can yield very different silence candidates. Handle trailing silence explicitly if converting log events into intervals. Preserve file-relative timestamps, stream start times and any `-ss` extraction offset. Never feed raw log seconds directly into a cut timeline after edits.

Silent screencast activity, held shots, black transitions and freeze frames may be intentional. Pair candidates with transcript and visual evidence. Review large removals and ambiguous moments rather than letting the detector choose the story.

## Visual review without flooding context

Probe duration, then sample the **whole** recording at an appropriate cadence. A cap must not silently omit the tail. This command selects the first available frame and then frames at least 30 seconds apart, recording actual selected timestamps in `frames.log`:

```sh
ffmpeg -hide_banner -nostdin -n -i input.mov \
  -vf "select='isnan(prev_selected_t)+gte(t-prev_selected_t,30)',showinfo,scale=320:-2" \
  -fps_mode vfr /work/analysis/frame-%05d.jpg 2> /work/analysis/frames.log
```

For a contact sheet of the first 25 selected frames:

```sh
ffmpeg -hide_banner -nostdin -n -i input.mov \
  -vf "select='isnan(prev_selected_t)+gte(t-prev_selected_t,30)',showinfo,scale=320:-2,tile=5x5" \
  -frames:v 1 /work/analysis/sheet.jpg 2> /work/analysis/sheet.log
```

Read `showinfo`'s `pts_time` values in order to map filenames or row-major tile positions to actual source timestamps. Preserve stream/extraction origin; do not invent a label from frame index times nominal rate. The contact-sheet command covers only its first 25 selections; create additional windows/sheets for the rest and record each window's source offset. `drawtext` can burn labels when available, but the authoring machine's FFmpeg lacks that filter, so these recipes use a timestamp sidecar without additional dependencies. Read images with the available image tool, then extract more frames around candidate shots/cuts. Sparse frames do not establish motion or smooth transitions.

For cut-boundary checks, sample before/after frames with handles, inspect the actual short motion sequence where possible, and listen to the join. Avoid cutting mid-word or removing a demonstrated operation merely because it has no speech.

## Analysis record

Use a small task-specific JSON sidecar: source path/size/mtime or hash; stream selection; exact rates; extraction origin; transcript provider/language/time basis; candidate silence/scenes; visual findings with sampled timestamps; proposed keeps/removals and rationale. It is analysis evidence, not a native Resolve format. Keep fractional seconds/rational rates until the explicit conversion to integer source frames. Use decimal strings with `fractions.Fraction` on the host when precision matters; do not round the rate before multiplication.
