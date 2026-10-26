# Native MCP execution

Use the available tools by capability; the Codex namespace is currently `mcp__davinci_resolve`. Discover their current schemas before calling them. Resolve Studio 21.1.1 was installed during authoring; do not assume that version on another machine.

## Documentation without launching

Call `get_whats_new` with the last version/date you know. Search `search_scripting_api` with a narrow regex, then request the relevant definitions with `get_scripting_api(types=[...])`. The main stub is `DaVinciResolveScript.pyi`; Fusion and UI have separate stubs. For broad research, use `as_file=true` and search locally. Read `get_scripting_docs` sections for settings dictionaries, constants and deprecated signatures. Release notes may lag the installed API changelog.

On macOS, official developer files are under `/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/Scripting/`. Use the installed docs rather than copying whole stubs into this skill. The native MCP also supplies DCTL documentation and LUT/DCTL tools.

## Run a recipe

`run_script` executes Python 3.14 with `resolve` and current `project` injected. Assign JSON-safe output to `result`. Objects from Resolve are native proxies: serialize IDs/properties, not proxy objects. `print` is captured. Filesystem/network/process access is blocked; `os`, `sys`, `pathlib` and `shutil` are unavailable. Default timeout is 10 seconds, maximum 60.

1. Read the recipe source with host tools.
2. Prefix a `CONFIG = ...` **Python literal** generated with `repr` from validated data. JSON booleans/null are not Python literals. Do not interpolate unescaped paths/text into source code.
3. Send the source text to `run_script`; do not ask the sandbox to open/import the recipe file.
4. Inspect `result`, then perform readback/visual checks needed for the task.

For assembly, concatenate the source of `validate_edit_plan.py` before `assemble_ranges.py`. Its host CLI guard stays inactive when `resolve` is injected. Both scripts live in this skill's `scripts/` directory. `CONFIG` is the plan described in [editing.md](editing.md).

Read-only recipes:

- `inspect_session.py`: no configuration; version, project, timelines and bin counts.
- `inspect_timeline.py`: `CONFIG = {"project_id": "returned ID", "timeline_id": "returned ID"}`; does not switch timelines. Returns raw API frame coordinates; intervals compare consecutive coverage within each track, excluding leading/trailing gaps and cross-track coverage. Overlaps may be transitions or intentional; inspect them.

Use host-side Python/FFmpeg for media analysis. Use `run_script_unsafe` only when a Resolve interaction genuinely needs system access. It is not necessary just to read a recipe before sending it.

## Targeting and failure handling

Native indices for tracks/timelines and many grade nodes are 1-based. Resolve proxy attribute lookup can be permissive; `hasattr` alone is not a capability test. Use installed definitions, inspect `dir` where supported, and make a small controlled call with readback.

Current 21.1 forms include `GetSettings`/`SetSettings`, `GetProperties`/`SetProperties`, and list-of-dictionary `ImportMedia`/`AppendToTimeline`. Older examples may use deprecated overloads. Setting dictionaries are not atomic; earlier keys can stick when a later one fails. Snapshot relevant settings and inspect each result. Enabling custom timeline settings uses `useCustomSettings: "1"`.

Native calls do not promise transactions, automatic timeline archives, retries, confirmation tokens or object registries. Do not inherit these guarantees from the community server. If a batch partly succeeds, report the created timeline/items and stop before compounding the failure. Do not automatically delete the evidence or retry the whole batch.

Long jobs: start once, retain the returned job ID, and poll its documented status getter in later bounded calls. A timeout does not establish that nothing happened; inspect state before retrying.
