#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/subagent-stop.mjs at
// d60652a7058773fa9428fa720eda38942f12f014. Cursor's subagentStop exposes
// summary/status/task rather than last_assistant_message.

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
  const status =
    typeof payload.status === 'string' ? payload.status : undefined;
  const lastMessage = truncateText(
    payload.summary ?? payload.last_assistant_message ?? '',
  );
  const toolInput =
    agentId || [agentType, status, task].filter(Boolean).join(':') || '';

  await postJson(
    '/agentmemory/observe',
    {
      hookType: 'subagent_stop',
      sessionId: resolveSessionId(payload),
      project: resolveProject(cwd),
      cwd,
      timestamp: new Date().toISOString(),
      data: {
        agent_id: agentId,
        agent_type: agentType,
        ...(status ? { status } : {}),
        ...(task ? { task } : {}),
        last_message: lastMessage,
        tool_input: toolInput,
      },
    },
    { config },
  );

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
