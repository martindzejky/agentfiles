# AgentMemory hooks for Cursor

This is a local-first, dependency-free Cursor adaptation of AgentMemory's hook
scripts. Dotbot links `hooks.json` and this directory into `~/.cursor`.
The scripts require Node.js 20.12 or newer; CI uses Node.js 24.

## Installed hooks

- `sessionStart` opens or resumes the AgentMemory session and, when
  `AGENTMEMORY_INJECT_CONTEXT=true`, returns server context through Cursor's
  documented `additional_context` field.
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
  `/agentmemory/enrich` and return Cursor `additional_context` (Shell and MCP
  skipped). Cursor's `preToolUse` has no injection field, so this is the
  Cursor-native home for upstream PreToolUse enrich.
- `postToolUseFailure` records failed tool calls (skips user interrupts). It
  does not enrich: Cursor documents no output fields for this event.
- `preCompact` records documented compaction metadata, then asks AgentMemory to
  summarize the session. It cannot alter Cursor's compaction.
- `stop` asks AgentMemory to summarize, but deliberately does not end the
  session because Cursor may continue the same conversation after a stopped
  turn.
- `sessionEnd` marks the AgentMemory session complete.

Every hook fails open and returns Cursor JSON. Requests have short timeouts.
Prompt, response, authorization, and full Cursor payloads are never logged.
Prompt and response captures are capped at 10,000 characters.

Every REST body includes a hardcoded `agentId: "cursor"` so a shared
AgentMemory server can tell Cursor writes apart from other agents later.
`/session/start` is what stamps the session today; `/observe`, `/summarize`,
and `/session/end` still receive the field for forward compatibility even if
the current server ignores unknown keys on those routes.

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
- The prompt cache is gitignored (`.prompt-cache/`, one JSON file per session)
  so parallel local agents do not share a single read-modify-write map. Growth
  is bounded by per-session overwrite, a 7-day TTL prune on write, a 200-entry
  cap, and deletion on `sessionEnd`.

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

Cursor Cloud does not provide `sessionStart` or `sessionEnd`. No fallback is
needed for session creation: AgentMemory creates the session from the first
observation that carries `project` and `cwd`. Cloud sessions may remain active;
observations and stop summaries are still retained.

This repo currently installs the lifecycle and tool hooks in
[Installed hooks](#installed-hooks). Thought and subagent Cloud events are
supported by Cursor but not wired here yet.

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
- [`plugin/scripts/pre-compact.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/pre-compact.mjs)
- [`plugin/scripts/stop.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/stop.mjs)
- [`plugin/scripts/session-end.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/session-end.mjs)
- [`src/hooks/_project.ts`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/src/hooks/_project.ts)

Intentional differences:

- The manifest uses Cursor's camelCase events and command schema.
- Cursor's stable `conversation_id` is used when `session_id` is absent.
- Scripts use Cursor's `workspace_roots` and emit protocol-safe JSON.
- `preCompact` checkpoints instead of printing context.
- `stop` never calls `/session/end`.
- `beforeSubmitPrompt` never calls `/session/start`. Upstream Claude
  `prompt-submit` also only posts `/observe`; an earlier local draft called
  `/session/start` on every prompt and that overwrote the session record.
- `afterAgentResponse` is Cursor-specific; upstream has no direct equivalent, so
  it borrows the `post_tool_use` shape.
- `postToolUse` has no matcher (all tools), matching Claude Code's unfiltered
  PostToolUse capture. Observe always runs; enrich is opt-in and limited to
  file-touching tools.
- `preToolUse` is omitted: Cursor cannot inject context there. Upstream enrich
  is adapted onto `postToolUse` `additional_context` instead.
- Claude memory bridge, Notification, TaskCompleted, thought, and subagent
  hooks are omitted.

Open upstream
[PR #1112](https://github.com/rohitg00/agentmemory/pull/1112) was reviewed for
Cursor-specific operational gotchas, including duplicate plugin/user hooks and
workspace attribution. No code was copied from that unmerged implementation.

Cursor schema and Cloud support are based on
[Cursor's hook documentation](https://cursor.com/docs/hooks) and
[Cloud Agent hook support](https://cursor.com/docs/hooks#cloud-agent-support).
