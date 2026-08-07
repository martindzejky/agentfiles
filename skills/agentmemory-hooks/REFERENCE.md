# agentmemory Cursor hooks reference

## Event map

| Cursor event                               | Capture job                                                        |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `sessionStart`                             | Open or resume a memory session for the workspace cwd              |
| `sessionEnd`                               | Mark the session completed or abandoned                            |
| `beforeSubmitPrompt`                       | Store user intent / prompt snapshot                                |
| `postToolUse`                              | Store successful tool outcomes (files touched, decisions)          |
| `postToolUseFailure`                       | Store failures worth recalling later                               |
| `afterFileEdit`                            | Store edit summaries with paths                                    |
| `beforeMCPExecution` / `afterMCPExecution` | Optional: audit MCP calls without double-logging agentmemory tools |
| `preCompact`                               | Snapshot high-importance notes before context trim                 |
| `stop`                                     | End-of-turn flush                                                  |

Skip `beforeShellExecution` for capture. Gate shell there only if you want policy, not memory.

## Install targets

| Scope         | Config                      | Scripts run from |
| ------------- | --------------------------- | ---------------- |
| User (global) | `~/.cursor/hooks.json`      | `~/.cursor/`     |
| Project       | `<repo>/.cursor/hooks.json` | project root     |

Cloud agents only see project hooks. User hooks stay local.

## Transport

Prefer REST from hook scripts:

- Base URL: `AGENTMEMORY_URL` or `http://localhost:3111`
- Auth: send `Authorization: Bearer $AGENTMEMORY_SECRET` only when that secret is set
- Fail open on network errors so a down daemon does not stall Cursor

Exact ingest paths depend on your agentmemory version. Confirm against agentmemory-rest-api before hard-coding.

## Debug checklist

1. Server live: `curl -fsS "$AGENTMEMORY_URL/agentmemory/livez"`
2. Hook script executable and on a path Cursor can run
3. Cursor restarted (or hooks reloaded) after `hooks.json` edits
4. Viewer at `:3113` shows new observations while you exercise the agent
5. Action skills still work via MCP (`remember` / `recall`) even if hooks are off

## Status in this repo

Hooks are planned, not shipped yet. This skill documents the Cursor mapping so setup can follow the same shape as the other agentmemory skills.
