# Sources, versions and validation

Research snapshot: 26 October 2026; local-trial integration: 27 October 2026. Native tool metadata identified Studio 21.1.1; installed scripting README was dated 31 August 2026 and changelog 1 September 2026. The MCP documentation tools work while Resolve is closed. Query them again when implementing a recipe on another build; do not infer capability from the major version alone.

## Primary references

- Installed Blackmagic scripting guide/stubs/examples under `/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/Scripting/`; Fusion/DCTL docs via native MCP. These are authoritative for signatures, not proof of runtime behavior. Official examples can contain deprecated signatures.
- [Community source](https://github.com/samuelgursky/davinci-resolve-mcp/tree/931bc2cda8fd9049982a457de9ff70836c406cd7), inspected at `931bc2cda8fd9049982a457de9ff70836c406cd7`.
- [Workflow catalog](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/docs/kernels/README.md), [media analysis](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/docs/guides/media-analysis-guide.md), [tightening](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/.agents/skills/resolve-tighten-recording/SKILL.md), [rough cuts](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/.agents/skills/resolve-rough-cut/SKILL.md), [contact sheets](https://github.com/samuelgursky/davinci-resolve-mcp/blob/931bc2cda8fd9049982a457de9ff70836c406cd7/scripts/contact_sheet.py).

The technical workflow guidance adapts ideas/checks from those MIT-licensed sources; its notice is retained in [../LICENSE](../LICENSE). Helpers are implemented for the native MCP rather than importing the community server. Its `plan_tighten`, variant/range operations, object registry, confirmation tokens, automatic archives, background engine, caps and host-vision protocol are not native guarantees. Its `house-style` is outside this skill.

21.1 adds native transitions/speed/fades, multicam creation, audio normalization/mapping/properties and transcription extraction; older community impossibility claims need rechecking. Community half-open ranges do not establish raw native API endpoints. The official subclip example calls 0..23 the first 24 frames. Probe the actual boundary before relying on frame-accurate assembly.

For advanced specifically requested work, the same repository's `docs/guides/native-drt-authoring.md`, `headless-edit-loop.md`, `color-decision-guide.md`, and `multicam-setup-guide.md` offer leads. Offline project/database/template patching is not the default route. Revalidate their assumptions against the current installation.

## Field-experience additions

[Field notes](field-notes.md) retain operation-specific reports from the same pinned snapshot: inherited render state/localization, persistence after save, source timebases, Fusion invalidation/discovery, interchange tradeoffs, archive crashes, title/subtitle behavior, analysis coverage/silence and grade witnesses. Each section links its evidence and preserves available build/platform qualifiers. These reports have not been reproduced locally. The existing MIT notice covers adapted guidance. No community high-level tool or direct database workflow is implied to be installed.

The separate [local trial](field-notes.md#local-native-mcp-trial) records native MCP observations from macOS Studio 21.1.1.10 on 26 October, including sandbox entry points, imports/timebases, transcription startup, Fusion replacement/rendering and audio analysis. The [Fusion overlay recipe](fusion-overlay.md) distills that working graph without retaining project paths, clip IDs, personal style or media. These additions are first-hand findings, not claims from the community source.

## What is and is not verified

Bundled helpers are checked offline with standard-library tests, restricted-builtins payload execution, simulated API failures/readbacks and synthetic FFmpeg media. These establish plan validation and helper logic, not full native behavior. The initial inspection payload entry points failed live because `globals()` was unavailable; the corrected guards have offline regression coverage. The real production tested operation-specific native edits, audio derivatives, Fusion graphics and a final render/full decode. It did not live-certify the generic same-rate assembly helper or a mixed-rate replacement for it. The integrated documentation/example code was not rerun against the completed project.

At first live use, inspect storage/project and test a small range before a large write. Check source/record endpoints, nonzero timeline origin, duration, required audio/links and actual frames. Validate first/middle/last sync and render/play a short result when the task needs it. Mixed-rate/VFR media, retimes, nested/multicam, Fusion rendering and caption/interchange round trips need their own checks. Broaden the helpers only with evidence, not by weakening their preflight restrictions.

Repository maintenance gates: `pnpm generate:dist`, `pnpm format`, `pnpm test`, `git diff --check`. Python helper tests are invoked by the Node test suite; FFmpeg integration is conditional on binaries being available. Keep skill links/frontmatter valid and preserve the cloud catalog byte/headroom gate. No separate build or lint is configured.
