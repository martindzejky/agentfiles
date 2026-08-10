# agentmemory Cursor hooks reference

This reference covers the Cursor-side AgentMemory adapter in this repo.
Server-side architecture and first-class Cursor / event-stream work live in
[martindzejky/agentmemory](https://github.com/martindzejky/agentmemory);
that fork's README is the canonical roadmap.

## Event map

| Cursor event         | Capture job                                                 |
| -------------------- | ----------------------------------------------------------- |
| `sessionStart`       | Optional open/resume + context; not required to create      |
| `beforeSubmitPrompt` | Store the user prompt                                       |
| `afterAgentResponse` | Store the final assistant response                          |
| `postToolUse`        | Store successful tool calls; optional file-tool enrich      |
| `postToolUseFailure` | Store failed tool calls (skips interrupts; no enrich)       |
| `subagentStart`      | Store Task-tool subagent start as `tool_name: "subagent"`   |
| `subagentStop`       | Store Task-tool subagent summary as `tool_name: "subagent"` |
| `preCompact`         | Fast summarize (no Cursor context reinject)                 |
| `stop`               | Fast summarize only (never ends the conversation)           |

No `sessionEnd` hook is installed. Sessions stay open-ended on the server;
memory formation does not need a client end signal. `stop` / `preCompact` are
the fast path; the server's idle catch-up sweep covers missed hooks. No thought
hooks are installed.

Commit linking is outside this Cursor event map. A git `post-commit` hook that
calls `POST /agentmemory/session/commit` is what feeds `commit-context` and
`commit-history`. This repo does not install that git hook yet.

Capture hooks other than optional `sessionStart` never call `/session/start`;
that route replaces the session record and resets `firstPrompt` and
`observationCount`. `/observe` (and summarize/enrich) create the session when
`sessionId`, `project`, and `cwd` are present. The assistant response rides on
the `post_tool_use` shape (`tool_name: "conversation"`) because AgentMemory
summarizes only `toolName`, `toolInput`, `toolOutput`, and `userPrompt`.
`tool_input` is the cached user prompt from `beforeSubmitPrompt` (Pi-style).

## Install targets

| Scope         | Config                      | Scripts run from |
| ------------- | --------------------------- | ---------------- |
| User (global) | `~/.cursor/hooks.json`      | `~/.cursor/`     |
| Project       | `<repo>/.cursor/hooks.json` | project root     |

Cloud agents only see project hooks. User hooks stay local. Cursor Cloud
supports the usual agent hooks (`beforeSubmitPrompt`, `afterAgentResponse`,
`afterAgentThought`, `preToolUse`, `postToolUse`, `postToolUseFailure`,
`subagentStart`, `subagentStop`, `preCompact`, `stop`, and others) but not
`sessionStart`. Cloud never had `sessionEnd`; this adapter does not wire it
locally either. Cloud hooks can be missed; the server catch-up sweep is what
keeps memory formation moving. This repo wires the events in the table above;
thought hooks are not installed yet.

## Transport

Use REST from hook scripts:

- Local config: gitignored `hooks/agentmemory/.env`, copied from `.env.example`
- Base URL: required `AGENTMEMORY_URL`
- Auth: required `Authorization: Bearer $AGENTMEMORY_SECRET`
- Agent tag: hardcoded `agentId: "cursor"` on every POST body
- HTTP timeout: 2.5s per REST call (under Cursor's usual 3s hook budget)
- Fail open on network errors so a down daemon does not stall Cursor

The hooks load only recognized AgentMemory keys from the local file. Existing
process variables take precedence. MCP-scoped environment variables may not be
inherited by hook processes. Every write that can lazy-create a session sends
`agentId: "cursor"` with `sessionId`, `project`, and `cwd` so observe-first
paths (including Cloud) stamp Cursor without a prior `/session/start`.

## Debug checklist

1. Server live: `curl -fsS "$AGENTMEMORY_URL/agentmemory/livez"`
2. Hook script executable and on a path Cursor can run
3. Cursor restarted (or hooks reloaded) after `hooks.json` edits
4. Viewer at `:3113` shows new observations while you exercise the agent
5. Action skills still work via MCP (`remember` / `recall`) even if hooks are off

## Status in this repo

The user-level hooks are installed from `hooks.json` and
`hooks/agentmemory/`. Implementation details, Cloud limitations, smoke-test
instructions, the pinned upstream audit trail, and the ownership /
compatibility-workaround notes are in `hooks/agentmemory/README.md`.

This adapter remains useful while AgentMemory is still Claude-shaped
(assistant-as-tool observations, prompt caching/pairing, and dedup
workarounds). Session open/close is not client-managed. After
[martindzejky/agentmemory](https://github.com/martindzejky/agentmemory) gains
first-class Cursor / event-stream support, the adapter should shrink to mostly
translating Cursor payloads into the server's native event envelope.
