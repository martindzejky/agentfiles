# Native build-loop performance

Adapted from upstream build-loop-caching and Fusion realities. Measurements were reported on macOS Studio 21.1 in September 2026 on specific large scenes; benchmark the current job rather than expecting the same speedups. Details remain in [render efficiency](technical/fusion-realities-3.md).

## Draft versus final

Block layout, text, keys, and timing with costly blur/accumulation disabled. Inspect final-quality hero poses, fastest in-betweens, focus changes, and activation boundaries before accepting the look. A draft cannot judge final DOF, bloom softness, grain, or fine edges. Smaller output alone may not reduce expensive upstream work.

Upstream found motion-blur time samples dominated several 3D scenes while accumulation DOF added little cost. Quality inputs interacted with accumulation settings. Inspect current renderer-specific inputs and compare pixels as well as runtime.

## Static branches and scene boundaries

Freeze genuinely static artwork with constant-time sampling where appropriate. Separate expensive static texture construction from object/camera animation so shutter samples do not rebuild it. Do not freeze needed motion, particles, or changing text. Geometry blur may not sample animated textures at subframes; verify texture blur separately.

For multi-scene films the author's tested starting architecture is one comp with scene Merge ladder enabled regions trimmed to each scene. Blend 0 or Dissolve endpoints did not reliably cull hidden inputs. Check inclusive boundaries and motion-blur handles for holes. Separate comps remain appropriate for independent editing; do not restructure accepted work without a concrete need.

Upstream measured an animated MultiMerge stack slower than a Merge chain with static lower layers cached. Avoid replacing chains merely for visual tidiness. Texture size, overscan, accumulation buffers, and repeated renders can dominate memory despite modest node counts.

## Explicit disk caches

Freeze while upstream changes; consider disk caching once a heavy branch is stable and edits are downstream:

1. Record live source, every consuming port, comp/source mapping, required range, format/color/alpha interpretation, and a recoverable graph version.
2. Render the complete range through a temporary Saver. Check files and decode before rewiring.
3. Load the sequence with correct source-to-comp mapping and bit depth/alpha. Reconnect recorded consumers; preserve the live branch.
4. Compare cached/live frames at start, middle, end, and retimed range edges.
5. Any upstream content, key, expression, media, or wiring change invalidates the cache. Re-render or restore live wiring. There is no automatic fingerprint or stale-cache warning here.
6. Before delivery confirm freshness or restore live branches. Disconnect/bypass temporary Savers to avoid unintended writes during Deliver.

One upstream 3640×2440 UI branch took about 11–12 s live, 8–9 s frozen, and 7 s from disk per check render; creating 31 cached frames cost about 20 s. These illustrate the tradeoff, not a promise. PNG RGBA 8-bit matched that branch; gradients/HDR need an appropriately tested format and color/alpha path. Upstream's scripting EnableDiskCache read back enabled but wrote no files on that build; recheck current behavior.

## Measurement and memory

Time Deliver as well as check renders. Hold source range, renderer, quality, cache state, and background workload constant; repeat A–B–B–A for meaningful comparisons. Supply explicit job IDs/settings so stale queue state does not enter the test.

Return compact summaries on large graphs. Watch memory pressure after heavy previews; purging may recover only a small fraction. Do not write preferences or routinely use undocumented purge calls. Restart only with authorization and a saved checkpoint. A cancellation request can precede completion of an in-flight frame: cancelled does not mean idle.
