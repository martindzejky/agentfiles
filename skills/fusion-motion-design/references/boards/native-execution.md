> Adapted craft reference from [open-fusion-mcp](https://github.com/legionsound/open-fusion-mcp/blob/f0b20ca2caaf93fde88515fce3569511d9170d78/skills/fusion-motion-design/references/boards/native-execution.md). Read [native execution](../native-execution.md) before acting. Examples and reported live results retain their upstream build/date scope; they have not been live-certified here. [TSV]/[corpus] labels describe upstream evidence, not bundled tables or installed helpers. Use the current native API, project format, and authorized assets. See [sources](../sources.md).

# Boards: native execution

Scoped to board work. General API rules live in [10](../native-execution.md) and
[fusion-realities](../technical/fusion-realities.md); this file only adds
what board builds hit.

## Routes and verification

- Routes: official Resolve MCP `run_script` (sandboxed Python with `resolve`/`project`) for comp
  edits; `run_script_unsafe` only when files must be read or written (`.setting` files, renders);
  `.setting` paste for whole groups (notes, cursors, panels) on the Fusion-page comp; native API calls. No route runs arbitrary code "to get around" a failing call: find why it failed.
- A multi-call build is not a transaction (realities §15). After an uncertain result, inspect the comp
  (`FindTool` for planned names, wiring, keys) before retrying. Reconcile partial native state before deciding the next edit.
- When a return value lacks the detail you need (`AddModifier` returns, `Render` True), read the state
  directly: `GetConnectedOutput`, `GetKeyFrames`, `GetInput` at two frames, the rendered file.
- Paste board groups with a unique prefix per paste; a collision renames `_1` and rewrites inner
  expressions only (realities §9). Re-read names before wiring expressions that point across groups
  (hover highlights, cursor-driven reveals).

## Font and glyph work

- Before a project-wide font replacement: export every comp in scope, run the glyph check (14) on the
  target font for every string in scope, then change `Font`/`Style` inputs; read back and render.
- Fusion's font menu names can differ from the file's name table; if `SetInput("Font", ...)` reads
  back but renders a fallback, pick the family/style exactly as the Text+ font menu lists it.

## UI recovery (computer use, UI layer)

Only when the API cannot do it (Macro Editor, template save dialogs, a stuck modal):

- Screenshot first; clear dialogs before any further API call.
- Re-query accessibility state after each action and use fresh element references.
- If the viewer and time ruler disagree, stop playback and set the frame by API
  (`comp.CurrentTime = f`) before inspecting.
- Reconnect to the existing project when control goes stale; keep the user's intervening changes and
  confirm what already executed before resuming.

## Visual proof

- Saver PNG renders (09) are local files and publish nothing. Viewer screenshots are an alternative
  when computer use is active. A generation provider used for board imagery may publish or host its
  results: check that before sending anything, since local editing authorization does not authorize
  public publishing.
