# AgentMemory hooks for Cursor

This is a local-first, dependency-free Cursor adaptation of AgentMemory's hook
scripts. Dotbot links `hooks.json` and this directory into `~/.cursor`.

## Installed hooks

- `sessionStart` opens or resumes the AgentMemory session and, when
  `AGENTMEMORY_INJECT_CONTEXT=true`, returns server context through Cursor's
  documented `additional_context` field.
- `beforeSubmitPrompt` repeats session initialization as a safe lifecycle
  fallback, then records only the truncated user prompt.
- `afterAgentResponse` records only the truncated final assistant response.
  It does not record reasoning or tool activity.
- `preCompact` records documented compaction metadata, then asks AgentMemory to
  summarize the session. It cannot alter Cursor's compaction.
- `stop` asks AgentMemory to summarize, but deliberately does not end the
  session because Cursor may continue the same conversation after a stopped
  turn.
- `sessionEnd` marks the AgentMemory session complete.

Every hook fails open and returns Cursor JSON. Requests have short timeouts.
Prompt, response, authorization, and full Cursor payloads are never logged.
Prompt and response captures are capped at 10,000 characters.

## Runtime configuration

The Cursor hook process must inherit:

- `AGENTMEMORY_URL`
- `AGENTMEMORY_SECRET`

Optional settings:

- `AGENTMEMORY_REQUIRE_HTTPS=1` rejects all non-HTTPS URLs. Without it, plain
  HTTP is accepted only for loopback development hosts.
- `AGENTMEMORY_INJECT_CONTEXT=true` opts the local `sessionStart` hook into
  context injection.
- `AGENTMEMORY_PROJECT_NAME` overrides Git-based project discovery.

No secure environment-injection mechanism exists in this repository, so these
values must be supplied to the Cursor application process through the user's
secure local setup. Environment variables inside an MCP server block are scoped
to that MCP subprocess and may not be inherited by Cursor hook processes. Do
not add secrets to this repository or to `hooks.json`.

Do not enable AgentMemory's plugin-scoped Cursor hooks at the same time as
these user-level hooks. Cursor can run both scopes and record every event
twice. The scripts use documented `workspace_roots` first; verify the project
name in the viewer if Cursor supplies no workspace root and the process falls
back to its working directory.

After running `./install`, a local smoke test can be sent without printing the
secret:

```sh
test -n "$AGENTMEMORY_URL" && test -n "$AGENTMEMORY_SECRET"
printf '%s\n' \
  '{"conversation_id":"cursor-hook-smoke","workspace_roots":["'"$PWD"'"],"prompt":"AgentMemory hook smoke test"}' |
  "$HOME/.cursor/hooks/agentmemory/before-submit-prompt.mjs"
```

Successful no-op output is `{}`. Confirm the `cursor-hook-smoke` session and
prompt observation in the configured AgentMemory viewer (the local default is
`http://localhost:3113`).

## Cursor Cloud Agents

Cursor currently supports these four hooks in Cloud Agents:

- `beforeSubmitPrompt`
- `afterAgentResponse`
- `preCompact`
- `stop`

Cursor currently does not provide `sessionStart` or `sessionEnd` in Cloud
Agents. `beforeSubmitPrompt` therefore performs the sole repeated
session-initialization fallback. Cloud sessions may remain active; observations
and stop summaries are still retained.

Cloud Agents load project-level `.cursor/hooks.json`, not this user-level
`~/.cursor/hooks.json`. A project that opts into Cloud capture must add its own
manifest and make these scripts available there. This repository does not
install hooks into unrelated projects.

## Upstream audit trail

Adapted from AgentMemory commit
[`d60652a7058773fa9428fa720eda38942f12f014`](https://github.com/rohitg00/agentmemory/commit/d60652a7058773fa9428fa720eda38942f12f014):

- [`plugin/scripts/session-start.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/session-start.mjs)
- [`plugin/scripts/prompt-submit.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/prompt-submit.mjs)
- [`plugin/scripts/pre-compact.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/pre-compact.mjs)
- [`plugin/scripts/stop.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/stop.mjs)
- [`plugin/scripts/session-end.mjs`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/plugin/scripts/session-end.mjs)
- [`src/hooks/_project.ts`](https://github.com/rohitg00/agentmemory/blob/d60652a7058773fa9428fa720eda38942f12f014/src/hooks/_project.ts)

Intentional differences:

- The manifest uses Cursor's camelCase events and command schema.
- Cursor's stable `conversation_id` is used when `session_id` is absent.
- Scripts use Cursor's `workspace_roots` and emit protocol-safe JSON.
- `preCompact` checkpoints instead of printing context.
- `stop` never calls `/session/end`.
- `afterAgentResponse` is Cursor-specific; upstream has no direct equivalent.
- Claude memory bridge, Notification, TaskCompleted, tool, thought, file, shell,
  MCP, and subagent hooks are omitted.

Open upstream
[PR #1112](https://github.com/rohitg00/agentmemory/pull/1112) was reviewed for
Cursor-specific operational gotchas, including duplicate plugin/user hooks and
workspace attribution. No code was copied from that unmerged implementation.

Cursor schema and Cloud support are based on
[Cursor's hook documentation](https://cursor.com/docs/hooks) and
[Cloud Agent hook support](https://cursor.com/docs/hooks#cloud-agent-support).
