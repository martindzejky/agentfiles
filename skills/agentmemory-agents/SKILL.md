---
name: agentmemory-agents
description: How agentmemory wires into coding agents via MCP. Use when installing or repairing the agentmemory MCP connection in Cursor or Codex, or when tools are missing after a config change.
user-invocable: false
---

Coding agents talk to agentmemory over MCP. REST still runs underneath (default `http://localhost:3111`), and the MCP bridge exposes the `memory_*` tools.

## Quick start

**Cursor:**

```bash
agentmemory connect cursor
```

Then restart Cursor or reload MCP.

**Codex:** add the agentmemory MCP server in `~/.codex/config.toml` (or project `.codex/config.toml`), then restart Codex.

Confirm the agent lists agentmemory's tools (the full set, not a tiny stub). A tiny subset (around 7 tools) usually means the MCP bridge could not reach the memory server.

## Workflow

1. **Cursor:** run `agentmemory connect cursor` (or add the MCP server in Cursor settings by hand), then restart / reload MCP.
2. **Codex:** configure the MCP server in `config.toml`, then restart Codex.
3. Verify the full tool set is live in whichever agent you use.

## Notes

- The action skills (remember, recall, and the rest) live in this repo under `skills/`. `connect` makes tools available. Skills teach the agent when to use them.
- Hooks capture observations only. Agents query memory with MCP; hooks do not inject context.
- Windows: use WSL2. Native Windows can run the server, but `connect` is not supported there.

## See also

- agentmemory-mcp-tools, agentmemory-rest-api, agentmemory-config.
- agentmemory-hooks for automatic capture via Cursor and Codex hooks.

## Reference

Agent-specific wiring notes live in REFERENCE.md.
