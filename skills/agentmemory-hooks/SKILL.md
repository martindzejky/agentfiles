---
name: agentmemory-hooks
description: Cursor hooks that capture agentmemory observations across the agent session lifecycle. Use when installing or debugging automatic memory capture in Cursor, when observations are missing, or when deciding which hook events to wire.
user-invocable: false
---

Cursor hooks are command scripts in `hooks.json`. They get JSON on stdin and can call agentmemory's REST API (or MCP) so memory is captured without a manual `memory_save` on every turn.

This skill is Cursor-only. Prefer user-level hooks in `~/.cursor/hooks.json` for global capture; use project `.cursor/hooks.json` when a repo needs its own wiring (also what cloud agents load).

## Quick start

Target layout (not installed yet in this repo; add when you set hooks up):

```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [{ "command": "./hooks/agentmemory/session-start.sh" }],
    "sessionEnd": [{ "command": "./hooks/agentmemory/session-end.sh" }],
    "beforeSubmitPrompt": [{ "command": "./hooks/agentmemory/prompt.sh" }],
    "postToolUse": [{ "command": "./hooks/agentmemory/tool.sh" }],
    "afterFileEdit": [{ "command": "./hooks/agentmemory/edit.sh" }],
    "preCompact": [{ "command": "./hooks/agentmemory/pre-compact.sh" }],
    "stop": [{ "command": "./hooks/agentmemory/stop.sh" }]
  }
}
```

User-level paths run from `~/.cursor/`, so `./hooks/...` is correct there. Project-level paths should be `.cursor/hooks/...` instead.

Watch captures at `http://localhost:3113` once the server is up.

## What the hooks should do

- `sessionStart` / `sessionEnd`: frame each unit of work so `handoff` and `session-history` can resume it.
- `beforeSubmitPrompt`: capture intent from the user prompt.
- `postToolUse` / `afterFileEdit`: capture what changed and why. Raw material for `recall` and `recap`.
- `preCompact`: preserve high-signal context before Cursor trims the window.
- `stop`: close the turn, optionally flush a short summary.

Post observations to the agentmemory REST base (`AGENTMEMORY_URL`, default `http://localhost:3111`). Fail open: a down server must not block the agent.

## Important

- Capture scripts should spend no LLM tokens. `AGENTMEMORY_AUTO_COMPRESS` and `AGENTMEMORY_INJECT_CONTEXT` stay separate opt-ins.
- If observations are missing, confirm the MCP/REST server is up, the hook scripts are executable, and Cursor loaded `hooks.json` (restart after edits).
- Until hooks are installed, use `remember` for explicit saves.

## See also

- agentmemory-config for capture and injection flags.
- agentmemory-agents for Cursor MCP wiring.
- handoff, recap, and session-history consume what hooks record.

## Reference

Cursor event mapping and install notes live in REFERENCE.md.
