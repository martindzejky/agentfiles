#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/subagent-start.mjs at
// d60652a7058773fa9428fa720eda38942f12f014. Field names follow Cursor's
// subagentStart payload (subagent_id / subagent_type / task).
//
// The martindzejky agentmemory fork (Pass E) lifts those keys on hookType
// subagent_start for compression, so this adapter sends the native shape
// instead of remapping onto a fake post_tool_use subagent tool.

import {
  newEventId,
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
  const subagentId = resolveSubagentId(payload);
  const subagentType = resolveSubagentType(payload);
  const task = truncateText(payload.task);
  const data = {};
  if (subagentId) data.subagent_id = subagentId;
  if (subagentType) data.subagent_type = subagentType;
  if (task) data.task = task;

  await postJson(
    '/agentmemory/observe',
    {
      hookType: 'subagent_start',
      sessionId: resolveSessionId(payload),
      project: resolveProject(cwd),
      cwd,
      timestamp: new Date().toISOString(),
      eventId: newEventId(),
      data,
    },
    { config },
  );

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
