# Companion tools

Use installed tools for their strengths; do not add another Resolve server or install a transcription stack by default. Check availability at use time. During authoring FFmpeg/FFprobe 9.0.2 were on PATH; `elevenlabs`, `whisper`, `auto-editor`, and `yt-dlp` CLIs were not. The ElevenLabs connector is independent of a local CLI or API key.

| Need                                                        | Preferred route                                                       |
| ----------------------------------------------------------- | --------------------------------------------------------------------- |
| Timeline/media operations                                   | Native Resolve MCP and installed scripting docs                       |
| Streams, signal analysis, sample frames, output QC          | Host FFprobe/FFmpeg; [analysis.md](analysis.md)                       |
| Shot meaning, retake comparison, story candidates           | Codex language/vision over timestamps and sampled frames              |
| Transcription, generated voice/music/SFX, isolation/dubbing | Available ElevenLabs connector; load its relevant skill               |
| Published YouTube references, packaging or upload analysis  | Available vidIQ tools and relevant vidIQ skill, when requested/useful |
| Detailed music/sound production                             | Available Ableton tools, only when the task needs them                |
| Requested still graphics/inserts/thumbnails                 | Image generation or existing design tools and their skills            |

## ElevenLabs handoff

For connected media operations, read the installed ElevenLabs `creative-studio` skill. Discover dedicated transcription/speech tools and flow-node types for music, SFX, voice isolation, dubbing and voice conversion. Fetch the relevant model schema/guide before choosing arguments. SDK/API development skills do not establish the connector's schema. During research the connected transcription tool exposed Scribe v1 while the SDK skill described v2; do not copy model IDs or defaults between them.

1. Identify source/stream, requested result and acceptable use of remote processing. Inspect the live file-attachment schema instead of assuming a picker is required or arbitrary local paths are readable. The local trial's connector accepted an authorized absolute-path WAV attachment; FLAC failed with a MIME-type error. A local-file picker can initially create an empty node; verify the actual asset before generation. SDK instructions and the connector's overview/parameter descriptions can disagree; report what the actual supported call establishes.
2. Keep related operations in one flow and use returned node/session IDs. A visible async progress view may handle progress itself; otherwise query the documented status route. Never resubmit generation as a status poll.
3. Check transcript truncation flags and retrieve full word timing output when needed. Preserve speaker labels and empty-speech results. Word start/end seconds need extraction offsets before conversion to source time.
4. Materialize authorized generated/processed output at a stable local project path before Resolve import. Short-lived cloud URLs/flow nodes are not media-pool file paths. Keep source and derivative names distinct.
5. Probe actual output duration, sample rate, channel layout and delay. Generated speech/music length may differ from the request. Align, trim/fade and place based on measured output; verify sync and listen.

Remote tool catalog availability does not prove funds or generation success. Handle the actual tool result and do not hide a failed generation behind a placeholder. Preserve scripts/transcript, provider/model, source offset and output identity in the analysis record; no credentials in sidecars or repository files.

## Vision and local derivatives

Use timestamped low-resolution samples/contact sheets to cover the full source, then refine candidate moments. Do not load hundreds of full-resolution stills into context. A cap should spread samples across the duration rather than silently stop early. Model confidence is not frame-accurate motion analysis.

For narration/transcription input, extract a separate audio derivative only when needed by the authorized workflow. Example with a selected stream:

```sh
ffmpeg -hide_banner -nostdin -n -i input.mov -map 0:a:0 -vn \
  -c:a pcm_s16le /work/analysis/speech.wav
```

This preserves decoded sample rate/channels unless explicitly changed; it does not preserve every container tag. If downmixing/resampling/trimming is needed, record those choices and offsets. Never overwrite the source or relink the original to this analysis derivative.

Use existing CLI filters/libraries before writing custom audio/vision algorithms. Optional tools should not become prerequisites for a basic rough cut. Publication, uploads and messaging remain separate actions from editing/analysis.

For exact crops/resizes of existing screenshot assets, use deterministic image operations that preserve the remaining source pixels. Image generation can reconstruct details even under a crop-only instruction. Use generative enhancement only when that transformation is intended, preserve the original, and label the result as reconstruction rather than recovered detail. This is distinct from designing an editable Fusion graphic.
