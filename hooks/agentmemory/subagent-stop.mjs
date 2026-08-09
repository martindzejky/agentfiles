#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/subagent-stop.mjs at
// d60652a7058773fa9428fa720eda38942f12f014. Cursor's subagentStop exposes
// summary/status/task rather than last_assistant_message.
//
// Mapped onto post_tool_use with tool_name "subagent" so the summary lands in
// tool_output and AgentMemory can compress it (custom subagent_* hookTypes are
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
  const status =
    typeof payload.status === 'string' ? payload.status : undefined;
  const summary = truncateText(
    payload.summary ?? payload.last_assistant_message ?? '',
  );
  // Always prefix stop: so start/stop do not share one five-minute dedup hash
  // when both carry the same subagent_id.
  const toolInput = [
    'stop',
    agentId || agentType || status || task || 'subagent',
  ].join(':');
  const toolOutput =
    summary ||
    truncateText(
      ['finished', agentType, status, task].filter(Boolean).join(': '),
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
