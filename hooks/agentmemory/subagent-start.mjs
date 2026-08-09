#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/subagent-start.mjs at
// d60652a7058773fa9428fa720eda38942f12f014. Field names follow Cursor's
// subagentStart payload (subagent_id / subagent_type / task).

import {
  postJson,
  readConfig,
  readPayload,
  resolveProject,
  resolveSessionId,
  resolveSubagentId,
  resolveSubagentType,
  resolveWorkingDirectory,
  truncateText,
  writeCursorOutput,
} from './shared.mjs';

async function main() {
  const payload = await readPayload();
  const config = readConfig();
  if (!payload || !config) return writeCursorOutput();

  const cwd = resolveWorkingDirectory(payload);
  const agentId = resolveSubagentId(payload);
  const agentType = resolveSubagentType(payload);
  const task = truncateText(payload.task);
  // Dedup is sessionId + tool_name + tool_input. Without tool_input, every
  // subagent_start in a session collapses for five minutes. Prefer || over ??
  // so an empty truncated task does not block agent_type.
  const toolInput = agentId || task || agentType || '';

  await postJson(
    '/agentmemory/observe',
    {
      hookType: 'subagent_start',
      sessionId: resolveSessionId(payload),
      project: resolveProject(cwd),
      cwd,
      timestamp: new Date().toISOString(),
      data: {
        agent_id: agentId,
        agent_type: agentType,
        ...(task ? { task } : {}),
        tool_input: toolInput,
      },
    },
    { config },
  );

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
