# Assembly and editing

## Rough cut or tighten a recording

1. Inspect source identity, frame/time bases, existing timeline layers and audio. Analyze speech/visual evidence using [analysis.md](analysis.md).
2. Write explicit keep ranges with reasons, speech handles and sync offsets. For dead-air work, show the largest proposed removals and ambiguous silent demonstrations. Do not apply a generic filler list or pause threshold as the user's style. Repeated takes often need semantic comparison and listening.
3. Build a separately named variant. Preserve the original timeline. A source-range assembly is suitable for plain footage, not reconstruction of an already graded/retimed/Fusion/nested edit.
4. Read back source spans, record positions, duration, tracks, links and audio. Inspect first/middle/last placements and every suspicious join. Preview the actual motion and sound when available.
5. For a saved deliverable, save through the project manager and inspect the cut again after saving; the helper does not save. Failed appends have reportedly left visible placements that vanished on save. Stop on a save/count/span discrepancy rather than replaying the full batch. See [persistence evidence](field-notes.md#saved-state-and-project-switches).

## Bundled conservative assembly helper

The helper handles up to 100 explicit ranges of plain CFR media at the timeline's frame rate. It creates tracks as needed (stereo for audio), makes a new timeline, and restores the previous current timeline when there was one. It does not save, render, delete, import media, copy an existing edit's effects, or infer which audio to retain. It uses current default resolution/color settings; inspect those before assembly. Multichannel routing, mixed-rate/VFR sources, retimes, multicam and compound sources need a separate recipe.

Example JSON plan for a 24 fps clip with 240 frames, keeping source frames 24..71 and matching audio. Replace IDs, path and media facts from inspection:

```json
{
  "version": 1,
  "project_id": "project ID",
  "timeline_name": "Rough cut 01",
  "rate": [24, 1],
  "start_timecode": "01:00:00:00",
  "native_end": "inclusive",
  "sources": [
    {
      "id": "media ID",
      "path": "/media/camera.mov",
      "rate": [24, 1],
      "frames": 240,
      "kind": "plain",
      "cfr": true,
      "has_video": true,
      "has_audio": true
    }
  ],
  "ranges": [
    {
      "source_id": "media ID",
      "in": 24,
      "out": 72,
      "record": 0,
      "media_type": 1,
      "track": 1,
      "link": "take-1"
    },
    {
      "source_id": "media ID",
      "in": 24,
      "out": 72,
      "record": 0,
      "media_type": 2,
      "track": 1,
      "link": "take-1"
    }
  ]
}
```

Plan `in/out` are **source** `[in,out)` frames. `record` is a nonnegative frame offset from the new timeline start. `media_type` is explicitly video=1 or audio=2; add both when retaining embedded A/V. Audio-only B-roll exclusion can be deliberate; never infer it silently. `link` joins ranges with matching record position/duration. Ranges can be layered across tracks but may not overlap within one destination track. Store analysis/rationale separately from this small execution plan.

Run on the host:

```sh
python3 scripts/validate_edit_plan.py /work/analysis/edit-plan.json
```

For native execution follow [native-mcp.md](native-mcp.md): prefix `CONFIG` with the parsed plan's Python representation, then concatenate validator source and assembly source. Do not run the assembly script with the system Python or expect the MCP sandbox to load files.

`native_end` is mandatory. The official 21.1 example treats 0..23 as 24 frames; community wrapper plans use exclusive ends. The example above follows the official inclusive convention. Before a substantial live edit, test one short range with both picture and sound and inspect native source/start/end/duration readback. Do not switch conventions merely to suppress a mismatch; determine the actual coordinate semantics first. The helper stops on the first readback mismatch and retains the partial timeline with its ID. It does not roll back. Inspect that result before another attempt.

Native source-frame getters can disagree, and source seconds can include embedded media timecode. Review [source-time witnesses](field-notes.md#source-frames-audio-and-timecode) before diagnosing a mismatch or adapting this helper. Keep its strict stop behavior until an independent frame/time witness explains the discrepancy.

Exact fractional rates use e.g. `[30000,1001]`. Source/timeline equality is checked by integer cross multiplication. The adapter must use Resolve's decimal settings representation; its readback tolerance handles that representation only, not mixed-rate conform. Never use this helper to prove mixed-rate/VFR behavior. Plan facts (`plain`, `cfr`, streams) require source inspection; the helper cannot establish them from assertions alone.

## Existing layered edits

Duplicate the target timeline with `DuplicateTimeline(new_name)` before exploratory changes. Resolve API availability for move/trim/range operations varies; search the current definitions. The community `copy_range`, `lift_range`, `create_variant_from_ranges` and `execute_tighten` are wrapper implementations, not native methods. If no supported native operation preserves the required state, use a verified interchange/UI workflow instead of deleting/rebuilding source clips.

For screen/camera recordings, map every keep interval to every required layer using measured offsets. Preserve the chosen audio master and links. A full-frame camera on V2 obscures the screen on V1: choose picture-in-picture framing, alternate shots, or another deliberate composition, then inspect it. The assembly helper does not set that composition. Check drift, source bounds and first/middle/last sync; see [audio-sync.md](audio-sync.md).

## Clip changes

For a resolved timeline item:

```python
before = item.GetProperties()
if not item.SetProperties({"ZoomX": 1.1, "ZoomY": 1.1}):
    raise RuntimeError("zoom change failed")
result = {"before": before, "after": item.GetProperties()}
```

Values are examples, not framing preferences. Read current property definitions and check image boundaries, rotation metadata and all affected orientations. A phone's display rotation may already be honored; do not rotate twice. Vertical variants need deliberate reframing of each shot and checking titles/captions, not only a resolution change.

21.1 supports `GetSpeed`/`SetSpeed(SpeedOptions)`, `GetFades`/`SetFades({"FadeIn": frames, "FadeOut": frames})`, and `AddTransition(TransitionOptions)`. Fetch the options before use. Example documented transition shape:

```python
transition = item.AddTransition({"type": "Cross Dissolve", "category": "simple",
                                 "position": "end", "alignment": "center", "duration": 12})
if not transition:
    raise RuntimeError("transition not created; inspect handles and installed type")
result = {"id": transition.GetUniqueId(), "duration": transition.GetDuration()}
```

Confirm installed transition/type, available handles and neighboring footage. Retiming can change duration and neighboring alignment; inspect the whole affected span and audio pitch/sync afterward. Do not assume ripple behavior from a setter's success.
