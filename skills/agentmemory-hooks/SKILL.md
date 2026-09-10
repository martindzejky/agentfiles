---
name: agentmemory-hooks
description: Hooks that capture agentmemory observations during agent turns. Use when installing or debugging automatic memory capture for Cursor or Codex. Use when observations are missing or when deciding which hook events to wire.
user-invocable: false
---

Agent hooks are command scripts in `hooks.json` (Cursor) or Codex hook config. They get JSON on stdin and POST `/agentmemory/observe` so the turn is recorded without a manual `memory_save`. They never inject context. Agents query memory with MCP (`recall`, `memory_smart_search`).

This skill documents the AgentMemory adapter in this repo (`hooks/agentmemory/`).
Cursor uses `hooks.json`. Codex uses generated `~/.codex/hooks.json`. Server
architecture belongs in
[martindzejky/agentmemory](https://github.com/martindzejky/agentmemory);
that fork's README is the canonical roadmap. Prefer user-level hooks for global
capture; use project `.cursor/hooks.json` when a repo needs its own wiring
(also what Cursor cloud agents load).

## Quick start

This repo installs the following local user hooks:

```json
{
  "version": 1,
  "hooks": {
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

User-level Cursor paths run from `~/.cursor/`, so `./hooks/...` is correct there. Codex commands use absolute paths because Codex runs hooks from the session cwd. After install, trust new Codex hooks with `/hooks`.

Watch captures at `http://localhost:3113` once the server is up.

## What the hooks should do

Sessions are open-ended on the server. Hooks capture observations only; they
must not call `/summarize`, `/enrich`, or `/session/start`. The server's idle /
obs-count catch-up sweep owns summarization. See `hooks/agentmemory/README.md`.

- `beforeSubmitPrompt`: capture the user prompt (`prompt_submit` → `data.prompt`).
- `afterAgentResponse`: capture the final reply as `assistant_response` with
  `data.assistantResponse`.
- `postToolUse` / `postToolUseFailure`: capture real tool calls and failures
  with tool-shaped observe fields (`tool_name`, `tool_input`, `tool_output`
  or `error`; all tools; interrupts skipped on failure).
- `subagentStart` / `subagentStop`: capture Task-tool subagent lifecycle on the
  parent session as `subagent_start` / `subagent_stop` with
  `subagent_id`, `subagent_type`, `task`, `status`, and `summary` (omit blanks).

`sessionStart` is not installed. It only injected context and does not run in
Cursor Cloud. The server lazy-creates the session from `/observe`.

These Cursor lifecycle hooks do not link git commits. `commit-context` and
`commit-history` need a separate git `post-commit` hook that POSTs to
`/agentmemory/session/commit`. That hook is not installed here yet.

Hooks load `hooks/agentmemory/.env` and require `AGENTMEMORY_URL` and
`AGENTMEMORY_SECRET`. Inherited environment variables take precedence. They fail
open: missing configuration or a down server must not block the agent.

## Important

- Hook scripts never call an LLM provider and never return `additional_context`.
- Copy `.env.example` to `.env`, fill in the secret, and set its permissions to
  `600`. The real file is gitignored.
- If observations are missing, confirm the MCP/REST server is up, the hook scripts are executable, and Cursor loaded `hooks.json` (restart after edits).
- Per-session debug log (local only, not uploaded): `~/.cursor/hooks-logs/<id>.jsonl` or `~/.codex/hooks-logs/<id>.jsonl`.
- Every `/agentmemory/observe` POST sends a unique top-level `eventId`.
- REST bodies set `agentId` to `"cursor"` or `"codex"` from the hook event.
- MCP server environment variables may not be inherited by hook processes.
- Use `remember` for explicit saves and `recall` when you need past context.
- This adapter requires the
  [martindzejky/agentmemory](https://github.com/martindzejky/agentmemory)
  fork, which summarizes `assistant_response` and `subagent_*` observes.

## See also

- agentmemory-config for server flags.
- agentmemory-agents for Cursor MCP wiring.
- recall, handoff, recap, and session-history consume what hooks record.
- [martindzejky/agentmemory](https://github.com/martindzejky/agentmemory)
  for server-side Cursor architecture (canonical roadmap).

## Reference

Event mapping and install notes live in REFERENCE.md.
