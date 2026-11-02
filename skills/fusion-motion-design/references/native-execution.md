# Native execution and compatibility

This is the execution contract for every reference in this skill. The detailed library preserves upstream craft and examples; it does not install the upstream connector, helper scripts, data tables, or control surface. Use the existing [Resolve skill](../../davinci-resolve/SKILL.md) and its [native MCP guidance](../../davinci-resolve/references/native-mcp.md) for execution. Current instructions and installed documentation take precedence over older technical claims.

## Discover and target

Discover native tools and schemas. Check status without launching unnecessarily. Query get_whats_new, search_scripting_api, relevant API definitions, and developer documentation before relying on unfamiliar behavior. Read the version/edition, project/timeline identities, intended item and comp, actual frame format/range, and media dependencies. Example names are placeholders; use verified IDs.

Use GetRegList/GetAttrs for registry IDs and GetInputList/GetAttrs for input IDs, types, ranges, and options. Inspect connected outputs for image/material/3D ports rather than sampling them as scalar values. The upstream TSV files are not distributed here: [TSV] means an ID was found in the author's historical harvest, not that it is installed now. No full harvest is needed for a targeted task.

Probe uncertain operations in an authorized scratch comp or named iteration. Preserve a recoverable baseline before structural edits. A scratch-only upstream test rule is not a ban on the requested production edit: target the authorized production item after qualifying the technique.

## Scripts and sandbox

Use run_script for inspection and ordinary API edits. Resolve/project proxies are injected; return JSON-safe IDs and values in result. Read source with host tools before sending it; do not ask the sandbox to open/import recipe files. Follow the existing skill's restricted-builtins guidance and current tool schema. Examples using imports, files, subprocesses, or host libraries are not automatically sandbox-compatible.

Use run_script_unsafe only when the Resolve interaction genuinely needs system access, such as reading a .setting file or checking/writing render files. Do not switch merely because a signature or expression failed. Host-side analysis can use existing tools such as FFmpeg; new dependencies are not prerequisites. Upstream snippets sometimes define small helpers inline. Bare helper names and script paths do not imply installed scripts or native MCP operations. Inspect and adapt needed code; do not run an absent helper or install its dependencies automatically.

## Translate upstream control paths

| Need                             | Native route                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| Surgical change                  | Inspect the tool, change owned inputs/keys, read back wiring/values, render                  |
| Whole semantic component         | Native .setting text or explicit AddTool/SetInput/ConnectInput calls                         |
| Tool/input lookup                | Current registry/input attrs and installed API documentation                                 |
| Scene plan                       | Component/beat specification implemented as native nodes; no custom scene DSL                |
| Frame/contact-sheet/motion check | Native render or Deliver, inspect files/playback; existing analysis tools can assemble views |
| Comparison                       | Matching mapped rendered frames, whole-frame/crop inspection; optional image metrics         |
| Graph layout                     | FlowView positions/Underlays or authored ViewInfo; preserve unrelated layout/wiring          |
| Cache                            | Native freeze or managed Saver→files→Loader; track invalidation/recovery explicitly          |
| UI-only operation                | Inspect the app and use available computer-use tools deliberately                            |

Historical custom operation names describe the author's server, not callable capabilities here. Native batches inherit none of its allowlist, receipt journal, atomicity, rollback, automatic retry, cache fingerprint, or motion-audit guarantees. Never install that server to satisfy a reference.

## Native authoring checks

- Clear the active tool before AddTool; use current documented arguments and connection flags. Short creation locks can prevent file pickers; unlock in finally and respect the existing skill's locked-write caveats.
- Check returned handles, actual names, and connections. Names can be normalized or collide case-insensitively. Pasted names can gain suffixes; re-read identities before cross-group wiring.
- Paste only into the verified current Fusion-page comp. Deferred Execute needs bounded polling and error capture, not an immediate success claim. Use safe literals for text/paths; native timeout limits still apply.
- Scalar splines, point paths, expressions, and modifiers differ. Inspect existing animation before replacing it. Python and .setting Bezier handles use different conventions. Check the exact key set and in-between values.
- Shared sources can have consumers at different source times. Inspect retimes, holds, instance overrides, and name-based expressions before changing them.
- Timeline, composition, and source time differ. For verified equal-rate/no-retime mapping use C=C0+(T-T0); probe otherwise. RenderStart/End can change with previews and are not stable animation origins.

## Partial writes and recovery

A timeout leaves unknown state. Stop dependent writes and inspect planned tool names, wiring, keys, render state, and saved artifacts before retrying. Do not resend a whole build blindly. Undo grouping is organizational, not a transaction. Verify the actual undo event: an empty group can expose an older unrelated event. See [undo findings](technical/fusion-realities.md).

If null/contradictory returns suggest a modal, inspect the UI before further calls. Do not kill processes, restart Resolve, alter scripting ports/preferences, or overwrite another project automatically. Follow existing authorization. Upstream restart/port incidents are diagnostic evidence, not recovery scripts.

## Evidence and delivery

Keep readback, pixels, continuous playback, saved-state persistence, and creative acceptance separate. A completed short movie through the delivery path is stronger evidence than a stale viewer or isolated still. Verify output range, dimensions, fps, alpha/audio where relevant, and affected consumers. Use [validation and delivery](09-validation-delivery.md) for detailed review. Current native capability wins over historical impossibility claims; record any newly verified behavior with its build and limits.
