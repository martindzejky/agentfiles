---
name: davinci-resolve
description: Edit and analyze video with native DaVinci Resolve MCP, reusable Python recipes, FFmpeg, and companion media tools.
---

# DaVinci Resolve

Use the native Blackmagic MCP and current scripting documentation. This skill supplies technical recipes; learn the user's editing style separately. Do not assume pacing, format, voice, music, or project organization preferences.

## Start with the task

Read [native-mcp.md](references/native-mcp.md) before executing Resolve scripts. For offline media analysis, read [analysis.md](references/analysis.md). The [workflow catalog](references/workflows.md) routes other tasks to focused references; load only what the task needs.

Check whether Resolve is running. Respect instructions to keep it closed or wait for storage. Offline documentation and host-side analysis do not require launching it. When launch is needed, confirm storage readiness with the user first. Inspect the current project and timeline before editing; target returned IDs rather than ambiguous names.

Keep camera originals intact and analysis/derived files separate. Assemble rough cuts in new timelines. Preserve all required audio and visual layers; source-range rebuilding does not preserve an existing edit's Fusion, grades, retimes or nested clips. Do not silently drop them.

Use [toolkit.md](references/toolkit.md) to supplement Resolve with FFmpeg, ElevenLabs, vision, and optional publishing/audio tools. Discover their actual schemas and assets rather than assuming installed CLIs or model IDs.

## Deliver and verify

Return the requested timeline or artifact, its identity, what changed, and any limitations. Check actual source/record spans, duration, tracks and audio after writes. Inspect representative frames and play back cut boundaries; gaplessness alone does not prove a correct edit. Listening is needed to judge the mix.

The helpers have offline tests; Resolve execution remains unverified until used with a real project. The assembly helper deliberately supports only same-rate, plain CFR sources and requires an explicit native endpoint convention. Probe one range and read it back before a full assembly. Report partial failures without implying rollback. See [editing.md](references/editing.md).

Community recipes are references, not additional native tools. Topic references link to [field notes](references/field-notes.md) for operation-specific failure modes and build qualifiers. Version/provenance and migration caveats are in [sources.md](references/sources.md).
