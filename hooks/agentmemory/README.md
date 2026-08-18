# AgentMemory hooks for Cursor

This directory is the Cursor-side AgentMemory adapter: local-first,
dependency-free hook scripts that translate Cursor events into AgentMemory
REST calls. Dotbot links `hooks.json` and this directory into `~/.cursor`.
The scripts require Node.js 24 (see `package.json` engines, `.nvmrc`, and CI).

Ownership:

- This repo owns the thin Cursor adapter documented below.
- Server-side architecture and first-class Cursor / event-stream work belong in
  [`martindzejky/agentmemory`](https://github.com/martindzejky/agentmemory).
  That fork's README is the canonical roadmap; do not duplicate it here.

This adapter requires the
[`martindzejky/agentmemory`](https://github.com/martindzejky/agentmemory)
fork, which summarizes `assistant_response` and `subagent_*` observes
([PR #10](https://github.com/martindzejky/agentmemory/pull/10)). Older servers
that ignore unknown `hookType` values will store those observes without
summarizing them.

## Lifecycle (adapter vs server)

This adapter does not manage session open/close. Conversations are open-ended
on the server (`/session/end` is a deprecated noop there). What the hooks do:

- **Capture** observations via `/observe` (and optional enrich).
- **Optional** local `sessionStart` for `/session/start` + context injection.
- **Server-owned** summarization via idle / observation-count catch-up sweep.

`sessionStart` is not required to create a session: `/observe`, `/summarize`,
and `/enrich` lazy-create when they send `sessionId` + `project` + `cwd`, and
they honor `agentId: "cursor"`. There is no `sessionEnd` hook. Hooks capture
observations only; they must not call `/summarize`. The server's idle /
obs-count catch-up sweep processes sessions in the background. Server details
for that sweep live in the fork README, not here.

## Installed hooks

- `sessionStart` is optional. Locally it still calls `/session/start` to open
  or resume and, when `AGENTMEMORY_INJECT_CONTEXT=true`, returns server context
  through Cursor's documented `additional_context` field. It is not required
  for session creation once the server lazy-creates from `/observe` or
  `/enrich`.
- `beforeSubmitPrompt` records only the truncated user prompt
  (`hookType: prompt_submit`, `data: { prompt }`). It never calls
  `/session/start`, because that endpoint replaces the whole session record and
  would clear `firstPrompt` and `observationCount` on every prompt. AgentMemory
  creates the session from the observation itself when the record is missing,
  which also covers Cloud Agents.
- `afterAgentResponse` records only the truncated final assistant response as
  `hookType: assistant_response` with `data: { assistantResponse }` (camelCase;
  no aliases). It does not record reasoning.
- `postToolUse` records successful tool calls (`tool_name`, `tool_input`,
  `tool_output`) for every tool, matching Claude Code's PostToolUse capture.
  When `AGENTMEMORY_INJECT_CONTEXT=true`, file-touching tools also call
  `/agentmemory/enrich` and return Cursor `additional_context` (includes
  Cursor `StrReplace` / `Delete`; Shell and MCP skipped). Cursor's
  `preToolUse` has no injection field, so this is the Cursor-native home for
  upstream PreToolUse enrich.
- `postToolUseFailure` records failed tool calls (skips user interrupts). It
  does not enrich: Cursor documents no output fields for this event.
- `subagentStart` / `subagentStop` record Task-tool subagent lifecycle on the
  parent session as `subagent_start` / `subagent_stop` observes. Data keys are
  exactly `subagent_id`, `subagent_type`, `task`, `status`, and `summary`
  (blank values omitted). Stop keeps the Cursor summary fallback
  `summary ?? last_assistant_message`.

Every hook fails open and returns Cursor JSON. REST calls use a 2.5s timeout
so remote HTTPS (for example Railway) has room for TLS without exceeding
Cursor's usual 3s hook budget. Prompt, response, authorization, and full Cursor
payloads are never logged. Prompt and response captures are capped at 10,000
characters.

Images are not captured. AgentMemory's vision path does not work end to end,
and Cursor's hook payloads carry no image data anyway: `beforeSubmitPrompt`
attachments are `{ type: "file" | "rule", file_path }` with no image type, and
`afterAgentResponse` is a single text field. The only place a blob could turn
up is tool output, so `stripImageData` walks `tool_output` at every depth and
replaces base64 images with a placeholder. Nothing is ever sent as
`image_data`.

Every write that can create or process a session sends `sessionId`, `project`,
`cwd`, and `agentId` where the server needs them for lazy session create:
`/observe`, `/summarize`, and `/enrich` include that set; `/session/start`
already did. `agentId` is always `"cursor"` via `postJson` / `withAgentId`
(not hardcoded a second time in each hook). The server must honor `agentId` on
lazy create (observe-first and summarize paths); older servers that ignore
unknown keys stay compatible with the extra fields.

Every `/agentmemory/observe` POST sends a unique top-level `eventId` (a fresh
UUID per hook invocation). The
[`martindzejky/agentmemory`](https://github.com/martindzejky/agentmemory)
fork deduplicates on that exact id. Older servers that ignore unknown fields
still accept the payload. `eventId` is omitted on `/summarize`, `/enrich`, and
`/context`.

## Observe wire contract

Fields on lifecycle observes feed compression on the fork. Blank values are
omitted for subagent keys.

| hookType             | data keys (exact)                                           |
| -------------------- | ----------------------------------------------------------- |
| `assistant_response` | `assistantResponse`                                         |
| `subagent_start`     | `subagent_id`, `subagent_type`, `task`                      |
| `subagent_stop`      | `subagent_id`, `subagent_type`, `task`, `status`, `summary` |
| `prompt_submit`      | `prompt`                                                    |

Tool observes keep tool-shaped fields:

| hookType            | data keys                                                            |
| ------------------- | -------------------------------------------------------------------- |
| `post_tool_use`     | `tool_name`, `tool_input`, `tool_output`                             |
| `post_tool_failure` | `tool_name`, `tool_input`, `error`; optional `failure_type` when set |

## Runtime configuration

Create the ignored local configuration from the committed example:

```sh
cp hooks/agentmemory/.env.example hooks/agentmemory/.env
chmod 600 hooks/agentmemory/.env
```

Then fill in `AGENTMEMORY_SECRET`. Because Dotbot symlinks the whole `hooks`
directory, the file is also available to the installed scripts at
`~/.cursor/hooks/agentmemory/.env`; no additional symlink or Cursor setting is
needed.

Each hook loads this file before reading its configuration. Existing process
environment variables take precedence over file values. Only these keys are
loaded:

- `AGENTMEMORY_URL`
- `AGENTMEMORY_SECRET`
- `AGENTMEMORY_REQUIRE_HTTPS`
- `AGENTMEMORY_INJECT_CONTEXT`
- `AGENTMEMORY_PROJECT_NAME`

Optional settings:

- `AGENTMEMORY_REQUIRE_HTTPS=1` rejects all non-HTTPS URLs. Without it, plain
  HTTP is accepted only for loopback development hosts.
- `AGENTMEMORY_INJECT_CONTEXT=true` opts `sessionStart` and file-tool
  `postToolUse` into context injection (default off; see upstream #143).
- `AGENTMEMORY_PROJECT_NAME` overrides Git-based project discovery.

Server-side (AgentMemory host, not this `.env`): raise `MAX_OBS_PER_SESSION`
when tool/subagent capture makes busy Cursor sessions hit the default cap
(this integration's Railway host uses `2000`).

The real `.env` is gitignored and must never be committed. It is still a
plaintext local secret, so keep its permissions at `600`. Environment variables
inside an MCP server block remain scoped to that MCP subprocess and may not be
inherited by Cursor hook processes; the local file avoids relying on that.

Do not enable AgentMemory's plugin-scoped Cursor hooks at the same time as
these user-level hooks. Cursor can run both scopes and record every event
twice. The scripts use documented `workspace_roots` first; verify the project
name in the viewer if Cursor supplies no workspace root and the process falls
back to its working directory.

After running `./install`, a local smoke test can be sent without printing the
secret:

```sh
printf '%s\n' \
  '{"conversation_id":"cursor-hook-smoke","workspace_roots":["'"$PWD"'"],"prompt":"AgentMemory hook smoke test"}' |
  "$HOME/.cursor/hooks/agentmemory/before-submit-prompt.mjs"
```

Successful no-op output is `{}`. Confirm the `cursor-hook-smoke` session and
prompt observation in the configured AgentMemory viewer (the local default is
`http://localhost:3113`).

## Cursor Cloud Agents

Cursor Cloud Agents run many of the same agent hooks as the local editor,
including:

- `beforeSubmitPrompt`
- `afterAgentResponse`
- `afterAgentThought`
- `preToolUse` / `postToolUse` / `postToolUseFailure`
- `subagentStart` / `subagentStop`

Cursor Cloud does not provide `sessionStart`. Locally, `sessionStart` remains
installed as best-effort / optional context injection. Cloud and other
observe-first paths rely on `/observe` (and `/enrich` when enabled) to create
the session. Those writes must still tag `agentId: "cursor"` so the server can
stamp Cursor on lazy create without a prior `/session/start`. Sessions stay
open-ended; observations are retained. The server owns summarization through
its idle / obs-count catch-up sweep.

This repo currently installs the lifecycle, tool, and subagent hooks in
[Installed hooks](#installed-hooks). Thought hooks are supported by Cursor but
not wired here yet.

Cloud Agents load project-level `.cursor/hooks.json`, not this user-level
`~/.cursor/hooks.json`. A project that opts into Cloud capture must add its own
manifest and make these scripts available there. Globally configured Cloud
process environment variables take precedence; a local `.env` file is not
required there. This repository does not install hooks into unrelated projects.

## Upstream audit trail

Adapted from AgentMemory commit
[`d60652a7058773fa9428fa720eda38942f12f014`](https://github.com/rohitg00/agentmemory/commit/d60652a7058773fa9428fa720eda38942f12f014):

- [`plugin/scripts/session-start.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/session-start.mjs)
- [`plugin/scripts/prompt-submit.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/prompt-submit.mjs)
- [`plugin/scripts/post-tool-use.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/post-tool-use.mjs)
- [`plugin/scripts/post-tool-failure.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/post-tool-failure.mjs)
- [`plugin/scripts/pre-tool-use.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/pre-tool-use.mjs)
  (enrich logic only; wired on Cursor `postToolUse`)
- [`plugin/scripts/subagent-start.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/subagent-start.mjs)
- [`plugin/scripts/subagent-stop.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/subagent-stop.mjs)
- [`src/hooks/_project.ts`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/src/hooks/_project.ts)

Intentional differences:

- The manifest uses Cursor's camelCase events and command schema.
- Cursor's stable `conversation_id` is used when `session_id` is absent.
  Claude / marketplace plugin payloads also accept camelCase `sessionId`.
- Scripts prefer the first non-empty `workspace_roots` entry over `cwd`, then
  emit protocol-safe JSON.
- `beforeSubmitPrompt` never calls `/session/start`. That endpoint replaces the
  whole session record. Upstream Claude `prompt-submit` also only posts
  `/observe`.
- `afterAgentResponse` is Cursor-specific; it posts `assistant_response` with
  `data.assistantResponse`.
- `postToolUse` has no matcher (all tools), matching Claude Code's unfiltered
  PostToolUse capture. Observe always runs; enrich is opt-in and limited to
  file-touching tools. Image base64 is stripped instead of forwarded as
  `image_data`; vision is unsupported, see above.
- `preToolUse` is omitted: Cursor cannot inject context there. Upstream enrich
  is adapted onto `postToolUse` `additional_context` instead.
- Subagent hooks post `subagent_start` / `subagent_stop` with Cursor field
  names (`subagent_id`, `subagent_type`, `task`, `status`, `summary`).
- Claude memory bridge, Notification, TaskCompleted, and thought hooks are
  omitted.

Open upstream
[PR #1112](https://github.com/rohitg00/agentmemory/pull/1112) was reviewed for
Cursor-specific operational gotchas, including duplicate plugin/user hooks and
workspace attribution. No code was copied from that unmerged implementation.

Merged upstream
[PR #1213](https://github.com/rohitg00/agentmemory/pull/1213) ships a Cursor
marketplace plugin (hooks + MCP + skills) and a `sessionEnd` transcript
backfill for CLI print mode. This adapter already had the useful Cursor-native
pieces (`conversation_id`, `workspace_roots`, `additional_context` JSON,
capture-only `/observe`). Taken from that PR: camelCase `sessionId` fallback
and first-non-empty `workspace_roots` scan. Skipped on purpose:

- Marketplace plugin / MCP package: this repo stays on Dotbot user hooks.
- `sessionEnd` prompt backfill + `/session/end`: sessions stay open-ended;
  `/session/end` is a noop on the fork; the fork dedups on `eventId` only, so
  a GUI live capture plus transcript re-post would duplicate `prompt_submit`.
  Historical JSONL/cloud import is the importer, not a session-end hook.
- `stop` / `preToolUse` / `preCompact`: no client `/summarize`; Cursor cannot
  inject on `preToolUse` (enrich stays on `postToolUse`).

## Wire summary

Writes from this adapter: `prompt_submit`, `assistant_response`,
`post_tool_use` / `post_tool_failure`, `subagent_start` / `subagent_stop`,
each `/observe` with a unique `eventId`, plus optional `/session/start` and
`/enrich`. No client `/summarize` and no session end. Summarization is the
server idle / obs-count catch-up sweep.

Cursor schema and Cloud support follow
[Cursor's hook documentation](https://cursor.com/docs/hooks) and
[Cloud Agent hook support](https://cursor.com/docs/hooks#cloud-agent-support).
