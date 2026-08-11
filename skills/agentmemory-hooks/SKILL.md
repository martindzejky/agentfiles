---
name: agentmemory-hooks
description: Cursor hooks that capture agentmemory observations during agent turns. Use when installing or debugging automatic memory capture in Cursor, when observations are missing, or when deciding which hook events to wire.
user-invocable: false
---

Cursor hooks are command scripts in `hooks.json`. They get JSON on stdin and can call agentmemory's REST API (or MCP) so memory is captured without a manual `memory_save` on every turn.

This skill documents the Cursor-side AgentMemory adapter in this repo
(`hooks/agentmemory/`). Server architecture and first-class Cursor /
event-stream work belong in
[martindzejky/agentmemory](https://github.com/martindzejky/agentmemory);
that fork's README is the canonical roadmap. Prefer user-level hooks in
`~/.cursor/hooks.json` for global capture; use project `.cursor/hooks.json`
when a repo needs its own wiring (also what cloud agents load).

## Quick start

This repo installs the following local user hooks:

```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [{ "command": "./hooks/agentmemory/session-start.mjs" }],
    "beforeSubmitPrompt": [
      { "command": "./hooks/agentmemory/before-submit-prompt.mjs" }
    ],
    "afterAgentResponse": [
      { "command": "./hooks/agentmemory/after-agent-response.mjs" }
    ],
    "postToolUse": [{ "command": "./hooks/agentmemory/post-tool-use.mjs" }],
    "postToolUseFailure": [
      { "command": "./hooks/agentmemory/post-tool-failure.mjs" }
    ],
    "subagentStart": [{ "command": "./hooks/agentmemory/subagent-start.mjs" }],
    "subagentStop": [{ "command": "./hooks/agentmemory/subagent-stop.mjs" }]
  }
}
```

User-level paths run from `~/.cursor/`, so `./hooks/...` is correct there. Project-level paths should be `.cursor/hooks/...` instead.

Watch captures at `http://localhost:3113` once the server is up.

## What the hooks should do

Sessions are open-ended on the server. Hooks capture observations only; they
must not call `/summarize`. The server's idle / obs-count catch-up sweep owns
summarization. See `hooks/agentmemory/README.md` for the lifecycle boundary.

- `sessionStart`: optional local open/resume plus optional context injection.
  Not required for session creation; the server lazy-creates from observe/enrich.
- `beforeSubmitPrompt`: capture intent from the user prompt
  (`prompt_submit` → `data.prompt` only), without calling `/session/start`,
  which would reset the session record.
- `afterAgentResponse`: capture the final reply as `assistant_response` with
  `data.assistantResponse`.
- `postToolUse` / `postToolUseFailure`: capture real tool calls and failures
  with tool-shaped observe fields (`tool_name`, `tool_input`, `tool_output`
  or `error`; all tools; interrupts skipped on failure). With
  `AGENTMEMORY_INJECT_CONTEXT=true`, successful file-touching tools also
  enrich via `/agentmemory/enrich` → `additional_context` (Shell/MCP skipped;
  failure hooks cannot inject on Cursor).
- `subagentStart` / `subagentStop`: capture Task-tool subagent lifecycle on the
  parent session as `subagent_start` / `subagent_stop` with
  `subagent_id`, `subagent_type`, `task`, `status`, and `summary` (omit blanks).

These Cursor lifecycle hooks do not link git commits. `commit-context` and
`commit-history` need a separate git `post-commit` hook that POSTs to
`/agentmemory/session/commit` (agentmemory ships one as
`plugin/scripts/post-commit.mjs`). That hook is not installed here yet.

Hooks load `hooks/agentmemory/.env` into their process environment and require
`AGENTMEMORY_URL` and `AGENTMEMORY_SECRET`. Explicitly inherited environment
variables take precedence. They fail open: missing configuration or a down
server must not block the agent.

## Important

- Hook scripts never call an LLM provider directly. Summarization, reflection,
  consolidation, and any resulting token usage happen on the configured
  AgentMemory server. `AGENTMEMORY_INJECT_CONTEXT=true` must also be present in
  the local hook environment to opt into returning server context.
- Copy `.env.example` to `.env`, fill in the secret, and set its permissions to
  `600`. The real file is gitignored.
- If observations are missing, confirm the MCP/REST server is up, the hook scripts are executable, and Cursor loaded `hooks.json` (restart after edits).
- Every `/agentmemory/observe` POST sends a unique top-level `eventId`. The
  martindzejky fork deduplicates on that exact id. `prompt_submit` sends
  `prompt` → `userPrompt`; assistant and subagent turns use
  `assistant_response` and `subagent_*` hookTypes.
- REST bodies hardcode `agentId: "cursor"` for multi-agent tagging on a shared
  server. This value is not configurable; the integration is Cursor-only.
- MCP server environment variables may not be inherited by hook processes.
- If hooks are unavailable, use `remember` for explicit saves.
- This adapter requires the
  [martindzejky/agentmemory](https://github.com/martindzejky/agentmemory)
  fork, which summarizes `assistant_response` and `subagent_*` observes.
  Implementation details live in `hooks/agentmemory/README.md`.

## See also

- agentmemory-config for capture and injection flags.
- agentmemory-agents for Cursor MCP wiring.
- handoff, recap, and session-history consume what hooks record.
- [martindzejky/agentmemory](https://github.com/martindzejky/agentmemory)
  for server-side Cursor architecture (canonical roadmap).

## Reference

Cursor event mapping and install notes live in REFERENCE.md.
