# AgentMemory hooks for Cursor

This directory is the Cursor-side AgentMemory adapter: local-first,
dependency-free hook scripts that translate Cursor events into AgentMemory
REST calls. Dotbot links `hooks.json` and this directory into `~/.cursor`.
The scripts require Node.js 20.12 or newer; CI uses Node.js 24.

Ownership:

- This repo owns the thin Cursor adapter documented below.
- Server-side architecture and first-class Cursor / event-stream work belong in
  [`martindzejky/agentmemory`](https://github.com/martindzejky/agentmemory).
  That fork's README is the canonical roadmap; do not duplicate it here.

The rest of this document describes the adapter as it works today, including
compatibility workarounds that remain useful until the fork work lands.

## Lifecycle (adapter vs server)

This adapter does not manage session open/close. Conversations are open-ended
on the server (`/session/end` is a deprecated noop there). What the hooks do:

- **Capture** observations via `/observe` (and optional enrich).
- **Fast summarize** on turn boundaries via `stop` and `preCompact`
  (`POST /summarize`).
- **Optional** local `sessionStart` for `/session/start` + context injection.

`sessionStart` is not required to create a session: `/observe`, `/summarize`,
and `/enrich` lazy-create when they send `sessionId` + `project` + `cwd`, and
they honor `agentId: "cursor"`. There is no `sessionEnd` hook. If a summarize
hook is missed (common on Cursor Cloud), the server's idle catch-up sweep
still processes idle sessions in the background. Server details for that
sweep live in the fork README, not here.

## Installed hooks

- `sessionStart` is optional. Locally it still calls `/session/start` to open
  or resume and, when `AGENTMEMORY_INJECT_CONTEXT=true`, returns server context
  through Cursor's documented `additional_context` field. It is not required
  for session creation once the server lazy-creates from observe/summarize.
- `beforeSubmitPrompt` records only the truncated user prompt. It never calls
  `/session/start`, because that endpoint replaces the whole session record and
  would clear `firstPrompt` and `observationCount` on every prompt. AgentMemory
  creates the session from the observation itself when the record is missing,
  which also covers Cloud Agents.
- `afterAgentResponse` records only the truncated final assistant response.
  It does not record reasoning.
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
  parent session as `post_tool_use` with `tool_name: "subagent"` so summarization
  lifts the task/summary text.
- `preCompact` is a fast per-turn summarize path (`POST /summarize`). Upstream
  Claude PreCompact reinjects `/context` via stdout; Cursor cannot do that,
  and a metadata-only observe would not be summarized anyway.
- `stop` is the other fast per-turn summarize path (`POST /summarize` only).
  It never calls `/session/end`. A conversation may continue after a stopped
  turn; sessions stay open-ended on the server.

Every hook fails open and returns Cursor JSON. REST calls use a 2.5s timeout
so remote HTTPS (for example Railway) has room for TLS without exceeding
Cursor's usual 3s hook budget. Prompt, response, authorization, and full Cursor
payloads are never logged. Prompt and response captures are capped at 10,000
characters. Base64 image blobs in tool output are replaced with a placeholder
and are never sent as `image_data`.

Every write that can create or process a session sends `sessionId`, `project`,
`cwd`, and `agentId` where the server needs them for lazy session create:
`/observe`, `/summarize`, and `/enrich` include that set; `/session/start`
already did. `agentId` is always `"cursor"` via `postJson` / `withAgentId`
(not hardcoded a second time in each hook). The server must honor `agentId` on
lazy create (observe-first and summarize paths); older servers that ignore
unknown keys stay compatible with the extra fields.

AgentMemory only summarizes the `toolName`, `toolInput`, `toolOutput`, and
`userPrompt` fields of an observation, and it deduplicates on
`sessionId + tool_name + tool_input` for five minutes. Consequences for the
payloads:

- The assistant response is sent as `post_tool_use` with
  `tool_name: "conversation"`, matching Hermes / OpenClaw / Pi. `tool_output`
  is the assistant text. `tool_input` is the user prompt from a local cache
  written by `beforeSubmitPrompt` (Cursor's response hook only documents
  `text`).
- `prompt_submit` also sets `tool_input` to the prompt text. Identical prompts
  within five minutes may be deduplicated; that rare drop is accepted. Leaving
  `tool_input` unset would make every `prompt_submit` in a session collide.
- Subagent start/stop use the same `post_tool_use` + `tool_name: "subagent"`
  shape. `tool_input` always uses a `start:` / `stop:` prefix plus id, type,
  and task/status when present so the five-minute dedup window does not
  collapse the pair or concurrent same-type Task tools. `tool_output` carries
  the start descriptor or the stop summary.
- The prompt cache is gitignored (`.prompt-cache/`, one JSON file per session)
  so parallel local agents do not share a single read-modify-write map. Growth
  is bounded by per-session overwrite, a 7-day TTL prune on write, and a
  200-entry cap. There is no session-end cleanup path (no `sessionEnd` hook).
  An old single-file `.prompt-cache.json` path is also gitignored and unused.

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
- `preCompact`
- `stop`

Cursor Cloud does not provide `sessionStart` (and never had `sessionEnd`).
Locally, `sessionStart` remains installed as best-effort / optional context
injection. Cloud and other observe-first paths rely on `/observe` (and
`/summarize` with the same identity fields) to create the session. Those
writes must still tag `agentId: "cursor"` so the server can stamp Cursor on
lazy create without a prior `/session/start`. Sessions stay open-ended;
observations and stop/preCompact summaries are still retained. Cloud hooks
are unreliable, so a missed `stop` / `preCompact` is expected sometimes; the
server's idle catch-up sweep covers those gaps without any client end signal.

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
- [`plugin/scripts/pre-compact.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/pre-compact.mjs)
- [`plugin/scripts/stop.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/stop.mjs)
- [`src/hooks/_project.ts`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/src/hooks/_project.ts)
  (`session-end.mjs` was adapted earlier and later removed; the server treats
  `/session/end` as a deprecated noop, so this adapter does not wire it)

Intentional differences:

- The manifest uses Cursor's camelCase events and command schema.
- Cursor's stable `conversation_id` is used when `session_id` is absent.
- Scripts use Cursor's `workspace_roots` and emit protocol-safe JSON.
- `preCompact` only summarizes. Upstream Claude prints `/context` to stdout for
  reinjection; Cursor has no equivalent reinject path, so that side is dropped.
- `stop` and `preCompact` only summarize. This adapter does not wire
  `sessionEnd` and never calls `/session/end`.
- `beforeSubmitPrompt` never calls `/session/start`. Upstream Claude
  `prompt-submit` also only posts `/observe`; an earlier local draft called
  `/session/start` on every prompt and that overwrote the session record.
- `afterAgentResponse` is Cursor-specific; upstream has no direct equivalent, so
  it borrows the `post_tool_use` shape.
- `postToolUse` has no matcher (all tools), matching Claude Code's unfiltered
  PostToolUse capture. Observe always runs; enrich is opt-in and limited to
  file-touching tools. Image base64 is stripped instead of forwarded as
  `image_data`.
- `preToolUse` is omitted: Cursor cannot inject context there. Upstream enrich
  is adapted onto `postToolUse` `additional_context` instead.
- Subagent hooks also borrow `post_tool_use` (`tool_name: "subagent"`) so the
  summarizer sees task/summary text. Cursor field names (`subagent_id`,
  `summary`) still drive `tool_input` / `tool_output`.
- Claude memory bridge, Notification, TaskCompleted, and thought hooks are
  omitted.

Open upstream
[PR #1112](https://github.com/rohitg00/agentmemory/pull/1112) was reviewed for
Cursor-specific operational gotchas, including duplicate plugin/user hooks and
workspace attribution. No code was copied from that unmerged implementation.

## Ownership and future direction

These files are the Cursor-side adapter only. Server architecture belongs in
[`martindzejky/agentmemory`](https://github.com/martindzejky/agentmemory);
its README is the canonical place for the server-side architectural roadmap and
first-class Cursor work.

Today the adapter still carries Claude-shaped compatibility workarounds that
remain real: assistant messages masquerading as tool observations
(`conversation` / `subagent`), prompt caching and pairing for
`afterAgentResponse`, and dedup workarounds around
`sessionId + tool_name + tool_input`. Session open/close is not something this
client manages anymore: start is optional, there is no end hook, and the server
owns open-ended processing plus idle catch-up. Keep documenting the remaining
client workarounds here until the fork lands first-class Cursor / event-stream
support.

Once that lands, this integration should simplify substantially: hooks should
mostly translate Cursor payloads into the server's native event envelope and
send them, instead of compensating for Claude Code tool or dedup assumptions
client-side.

Cursor schema and Cloud support are based on
[Cursor's hook documentation](https://cursor.com/docs/hooks) and
[Cloud Agent hook support](https://cursor.com/docs/hooks#cloud-agent-support).
