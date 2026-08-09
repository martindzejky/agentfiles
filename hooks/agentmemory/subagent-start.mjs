#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/subagent-start.mjs at
// d60652a7058773fa9428fa720eda38942f12f014. Field names follow Cursor's
// subagentStart payload (subagent_id / subagent_type / task).
//
// Mapped onto post_tool_use with tool_name "subagent" so AgentMemory's
// summarizer lifts tool_input / tool_output (custom subagent_* hookTypes are
// stored but never summarised).

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
  // Dedup is sessionId + tool_name + tool_input. Always prefix start: so this
  // does not collide with subagentStop within five minutes when both use the
  // same subagent_id. Prefer id for concurrency; fall back past empty task.
  const toolInput = ['start', agentId || agentType || task || 'subagent'].join(
    ':',
  );
  const toolOutput = truncateText(
    ['started', agentType, task].filter(Boolean).join(': '),
  );

  await postJson(
    '/agentmemory/observe',
    {
      hookType: 'post_tool_use',
      sessionId: resolveSessionId(payload),
      project: resolveProject(cwd),
      cwd,
      timestamp: new Date().toISOString(),
      data: {
        tool_name: 'subagent',
        tool_input: toolInput,
        tool_output: toolOutput,
      },
    },
    { config },
  );

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
