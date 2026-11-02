> Adapted craft reference from [open-fusion-mcp](https://github.com/legionsound/open-fusion-mcp/blob/f0b20ca2caaf93fde88515fce3569511d9170d78/skills/fusion-motion-design/references/17-visual-foundation.md). Read [native execution](native-execution.md) before acting. Examples and reported live results retain their upstream build/date scope; they have not been live-certified here. [TSV]/[corpus] labels describe upstream evidence, not bundled tables or installed helpers. Use the current native API, project format, and authorized assets. See [sources](sources.md).

# 17 Visual foundation: concepts, style frames and the storyboard before building

Load for any new original piece (a brief with no finished design to follow), and use a lighter version for a small text-only insert. A piece described only in words is the weakest brief there is; building straight
from it is how a piece turns generic. The default below was run end to end on 2026-09-27 (the
open-fusion-mcp explainer: three concepts in 19 min, a 23-frame storyboard in 17 min, no Resolve time
used); the generated-image route is kept for photographic looks.

## The flow (the user approves at two gates)

1. **Concepts**: 2-3 genuinely different directions, each with two realistic style frames.
2. **Gate 1, the user picks** one direction, or combines them (the explainer used all three looks in one
   film, joined by motivated morphs).
3. **Storyboard**: every beat, caption and transition as finished-looking frames, plus a beat map,
   caption table, sound plan and photosensitivity check.
4. **Gate 2, the user approves** or sends notes. Revise only the frames the notes touch.
5. **Optional timing preview**: block the chosen frames and beats in Fusion when motion needs review before detailed construction. HTML stills remain optional layout targets; no external animation pipeline is required.
6. **Build** in Fusion (Stage C). The frames are the look target, never source artwork.

For a substantial new piece, resolve the visual direction and storyboard before detailed production; rough Fusion style frames and timing previews can support those decisions. Existing approval and small revisions do not require repeating both gates. Keep a cost log (timestamps, tool calls by kind) from the
first action; the concept and storyboard phases need no Resolve calls.

## Route L (default): local style frames

Render style frames natively in Fusion, or use HTML/CSS stills when that speeds layout work. Keep type, color, composition, and planned lens/material effects transferable to native nodes. No bundled browser or lens-pass script is required.

- **Why this is the default:** type is exact (real fonts, real kerning, real sizes), colours are exact
  hex, it costs nothing, and the page becomes the spec the build and an animatic reuse. Image models
  mangle type and drift in colour; motion design is mostly type and shape.
- **Fonts:** load them from their installed files with `@font-face` (the same files Fusion will use).
  Choose licences that allow sharing (SIL OFL or similar) when the project may leave the upstream test machine; no Apple
  system fonts in shared work. Verify loading visibly: `document.fonts.check()` has reported a face as
  loaded when its file path was wrong (the page silently used a fallback). Variable-only families are a
  risk in Text+; prefer static cuts.
- **Only constructions Fusion has natively.** Flat shapes, Text+ layouts, 2.5D cards with a real camera
  and depth of field, line fields (sRectangle + sDuplicate), glows, masks, grain. A recursive "Droste"
  zoom is an acyclic chain of Merge + Transform levels, not feedback. Anything the browser does that
  Fusion cannot (CSS filters without a node equivalent) is a trap for the build.
- **Measure before layout in Fusion:** Text+ size per font comes from the upstream font-calibration helper; a browser px
  size is not a Fusion size.

## Stage A: concepts

- 2-3 directions that differ in world, not in detail (a flat Ordinary-Folk-grade shape language, a
  trippy recursive idea, an op-art field were the explainer's three). If the user named a reference he
  loves, one direction leans fully into that language, in original design, never copied.
- Per direction: a name; the idea in two sentences; palette (hex); fonts with licences; motif; why it
  explains or sells this particular piece; the music it wants (tempo range, energy curve, where the drop
  lands); risks (the op-art direction flagged pattern sensitivity and compression shimmer).
- Two style frames per direction at output resolution, chosen at different beats (one "how it works",
  one proof or close), and one concept sheet with all of them (`concepts/concepts_sheet.png`).
- Visual copy: real headline wording is fine; no invented numbers or claims.

## Stage B: storyboard

- **Timing grid in beats.** Pick a tempo and fps where a beat is a whole number of frames (150 BPM at
  30 fps: beat 12 f, bar 48 f). Write every time as bar.beat and frame, so any real music track retimes
  the plan by changing one number.
- **Frames:** 16-24 finished-looking frames at the key beats, plus one frame in the middle of every
  look change or transition (the author’s starting preference is a motivated morph between visual worlds; use a hard cut when the brief or editing rhythm calls for it). One sheet with a bar timeline across the top (sections, looks, transitions, drops), then the
  frames with bar.beat, frame, caption, action and sound cue under each (`storyboard.png`).
- **Beat map JSON** (`storyboard/beatmap.json`): fps, bpm, beatFrames, barFrames, bars, frames, seconds,
  sections (id, look, name, start, end, startBarBeat), transitions, music cues, captions (id, section,
  text, inFrame, outFrame, words, wps), reading load per section and peak, storyboard frames.
- **Captions** carry the story when the video autoplays muted: short lines inside the motion, each about
  3 words per second or slower on screen (count a number with its unit as one word); check the peak over
  a 3 s window too. Cut words before adding frames.
- **Claims:** state only facts from an agreed fact list. Audience-facing claims only: viewers do not care
  about the maker's internal before/after (the user cut "same ad, built twice, 5.6 h to 1 h 19 m" and
  internal speed percentages from the explainer). Keep other brands off screen unless the user chooses to
  name one; a plain comparison without a logo is his call.
- **Sound plan:** one track with clear sections (search spec: genre, tempo range, moods, keywords, stems
  if available), the cue list (hits, silences, drops, stabs on bar.beat) and SFX per beat change. Use music the user is entitled to use; keep licensed source media out of public repositories.
- **Photosensitivity:** no more than 3 full-screen flashes in any one second; no large saturated-red
  flicker; moving stripe patterns limited (the explainer used a period of at least 18 px, strokes of at
  least 6 px, low contrast outside type, about a third of the frame, no oscillation faster than 2 Hz).

## Photographic or material-led looks

Use approved photographic assets or native material/lighting studies. If the user separately requests generated imagery, verify the available provider and preserve the chosen configuration; no generation tool is a prerequisite. Generated type is not trusted. Keep the style frame a look target and reconstruct editable graphics natively.

## Stage C: construction

Build from the approved storyboard with this skill: the beat map is the scene plan (design-first scene
spec, native component descriptions with start times in comp frames), the frames are the look target, and every
element takes the simplest native representation (01). Do not load frames into the comp, crop them into
objects or trace them. Check the planned timing against the beat map before detailed construction, and
compare rendered frames to the style frames at the same beats.

## When the user wants to skip the foundation

Allowed: proceed from the text, state that composition, palette and timing are invented, and record which
decisions were yours. A foundation the user never approved is not a brief.
