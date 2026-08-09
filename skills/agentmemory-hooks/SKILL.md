---
name: agentmemory-hooks
description: Cursor hooks that capture agentmemory observations across the agent session lifecycle. Use when installing or debugging automatic memory capture in Cursor, when observations are missing, or when deciding which hook events to wire.
user-invocable: false
---

Cursor hooks are command scripts in `hooks.json`. They get JSON on stdin and can call agentmemory's REST API (or MCP) so memory is captured without a manual `memory_save` on every turn.

This skill is Cursor-only. Prefer user-level hooks in `~/.cursor/hooks.json` for global capture; use project `.cursor/hooks.json` when a repo needs its own wiring (also what cloud agents load).

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
    "preCompact": [{ "command": "./hooks/agentmemory/pre-compact.mjs" }],
    "stop": [{ "command": "./hooks/agentmemory/stop.mjs" }],
    "sessionEnd": [{ "command": "./hooks/agentmemory/session-end.mjs" }]
  }
}
```

User-level paths run from `~/.cursor/`, so `./hooks/...` is correct there. Project-level paths should be `.cursor/hooks/...` instead.

Watch captures at `http://localhost:3113` once the server is up.

## What the hooks should do

- `sessionStart` / `sessionEnd`: frame each local conversation so `handoff` and `session-history` can resume it.
- `beforeSubmitPrompt`: capture intent from the user prompt, without calling
  `/session/start`, which would reset the session record.
- `afterAgentResponse`: capture the final reply as `post_tool_use` with
  `tool_name: "conversation"`, `tool_input` from the cached user prompt, and
  `tool_output` as the assistant text.
- `postToolUse` / `postToolUseFailure`: capture real tool calls and failures
  (all tools; interrupts skipped on failure). With
  `AGENTMEMORY_INJECT_CONTEXT=true`, successful file-touching tools also
  enrich via `/agentmemory/enrich` → `additional_context` (Shell/MCP skipped;
  failure hooks cannot inject on Cursor).
- `preCompact`: record compaction metadata and checkpoint a summary.
- `stop`: summarize without ending a conversation that may continue.

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
- AgentMemory drops observations whose `sessionId + tool_name + tool_input` hash
  repeats within five minutes. Both `prompt_submit` and conversation pairing use
  the user prompt as `tool_input` and accept rare identical-prompt drops.
- REST bodies hardcode `agentId: "cursor"` for multi-agent tagging on a shared
  server. This value is not configurable; the integration is Cursor-only.
- MCP server environment variables may not be inherited by hook processes.
- If hooks are unavailable, use `remember` for explicit saves.

## See also

- agentmemory-config for capture and injection flags.
- agentmemory-agents for Cursor MCP wiring.
- handoff, recap, and session-history consume what hooks record.

## Reference

Cursor event mapping and install notes live in REFERENCE.md.
