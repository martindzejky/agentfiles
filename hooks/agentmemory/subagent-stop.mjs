#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/subagent-stop.mjs at
// d60652a7058773fa9428fa720eda38942f12f014. Cursor's subagentStop exposes
// summary/status/task rather than last_assistant_message.
//
// The martindzejky agentmemory fork (Pass E) lifts subagent_id, subagent_type,
// task, status, and summary on hookType subagent_stop for compression, so
// this adapter sends that native shape instead of remapping onto a fake
// post_tool_use subagent tool.

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
  const status =
    typeof payload.status === 'string' ? payload.status.trim() : '';
  const summary = truncateText(
    payload.summary ?? payload.last_assistant_message ?? '',
  );
  const data = {};
  if (subagentId) data.subagent_id = subagentId;
  if (subagentType) data.subagent_type = subagentType;
  if (task) data.task = task;
  if (status) data.status = status;
  if (summary) data.summary = summary;

  await postJson(
    '/agentmemory/observe',
    {
      hookType: 'subagent_stop',
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
