---
name: agentmemory-agents
description: How agentmemory wires into Cursor via MCP. Use when installing or repairing the agentmemory MCP connection in Cursor, or when tools are missing after a config change.
user-invocable: false
---

Cursor talks to agentmemory over MCP only. REST still runs underneath (default `http://localhost:3111`), and the MCP bridge exposes the `memory_*` tools.

## Quick start

```bash
agentmemory connect cursor
```

Then restart Cursor or reload MCP so it picks up the server. Confirm the agent lists agentmemory's tools (the full set, not a tiny stub).

## Workflow

1. Run `agentmemory connect cursor` (or add the MCP server in Cursor settings by hand).
2. Restart Cursor / reload MCP.
3. Verify: Cursor should show the full tool set with the server live. A tiny subset (around 7 tools) usually means the MCP bridge could not reach the memory server.

## Notes

- The action skills (remember, recall, and the rest) live in this repo under `skills/`. `connect` makes tools available. Skills teach the agent when to use them.
- Windows: use WSL2. Native Windows can run the server, but `connect` is not supported there.

## See also

- agentmemory-mcp-tools, agentmemory-rest-api, agentmemory-config.
- agentmemory-hooks for automatic capture via Cursor hooks.

## Reference

Cursor-specific wiring notes live in REFERENCE.md.
