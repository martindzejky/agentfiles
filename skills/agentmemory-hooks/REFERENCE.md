# agentmemory Cursor hooks reference

## Event map

| Cursor event         | Capture job                                             |
| -------------------- | ------------------------------------------------------- |
| `sessionStart`       | Open or resume a memory session; optionally add context |
| `beforeSubmitPrompt` | Store the user prompt                                   |
| `afterAgentResponse` | Store the final assistant response                      |
| `preCompact`         | Record compaction metadata and checkpoint a summary     |
| `stop`               | Summarize without ending the conversation               |
| `sessionEnd`         | Mark the local session complete                         |

No tool, thought, file, shell, MCP, or subagent hooks are installed.

The capture hooks never call `/session/start`; it replaces the session record
and resets `firstPrompt` and `observationCount`. `/observe` creates the session
on its own when `project` and `cwd` are present. The assistant response rides on
the `post_tool_use` shape because AgentMemory summarizes only `toolName`,
`toolInput`, `toolOutput`, and `userPrompt`.

## Install targets

| Scope         | Config                      | Scripts run from |
| ------------- | --------------------------- | ---------------- |
| User (global) | `~/.cursor/hooks.json`      | `~/.cursor/`     |
| Project       | `<repo>/.cursor/hooks.json` | project root     |

Cloud agents only see project hooks. User hooks stay local. Cursor Cloud
currently supports `beforeSubmitPrompt`, `afterAgentResponse`, `preCompact`,
and `stop`, but not `sessionStart` or `sessionEnd`.

## Transport

Use REST from hook scripts:

- Local config: gitignored `hooks/agentmemory/.env`, copied from `.env.example`
- Base URL: required `AGENTMEMORY_URL`
- Auth: required `Authorization: Bearer $AGENTMEMORY_SECRET`
- Fail open on network errors so a down daemon does not stall Cursor

The hooks load only recognized AgentMemory keys from the local file. Existing
process variables take precedence. MCP-scoped environment variables may not be
inherited by hook processes.

## Debug checklist

1. Server live: `curl -fsS "$AGENTMEMORY_URL/agentmemory/livez"`
2. Hook script executable and on a path Cursor can run
3. Cursor restarted (or hooks reloaded) after `hooks.json` edits
4. Viewer at `:3113` shows new observations while you exercise the agent
5. Action skills still work via MCP (`remember` / `recall`) even if hooks are off

## Status in this repo

The six user-level hooks are installed from `hooks.json` and
`hooks/agentmemory/`. Implementation details, Cloud limitations, smoke-test
instructions, and the pinned upstream audit trail are in
`hooks/agentmemory/README.md`.
