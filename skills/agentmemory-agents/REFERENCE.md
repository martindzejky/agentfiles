# agentmemory Cursor wiring

Cursor uses MCP only. The memory bridge still runs at `:3111` underneath.

## Connect

```bash
agentmemory connect cursor
```

This merges the agentmemory MCP server into Cursor's MCP config and keeps any existing servers.

## Manual check

1. Open Cursor MCP settings and confirm an `agentmemory` (or equivalent) server entry exists.
2. Restart Cursor or reload MCP after any port or auth change. Config is read on startup.
3. Confirm tools appear. If only a small stub set shows, the bridge cannot reach the server at `AGENTMEMORY_URL` (default `http://localhost:3111`).

## Related

- Ports and secrets: agentmemory-config
- Tool index: agentmemory-mcp-tools
- HTTP fallback: agentmemory-rest-api
