#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/post-tool-use.mjs at
// d60652a7058773fa9428fa720eda38942f12f014.
// Capture only: posts /observe and never injects additional_context.

import {
  newEventId,
  postJson,
  readConfig,
  readHookPayload,
  resolveProject,
  resolveSessionId,
  resolveToolInput,
  resolveToolName,
  resolveToolOutput,
  resolveWorkingDirectory,
  stripImageData,
  truncateValue,
  writeCursorOutput,
} from './shared.mjs';

async function main() {
  const payload = await readHookPayload('postToolUse');
  const config = readConfig();
  if (!payload || !config) return writeCursorOutput();

  const toolName = resolveToolName(payload);
  if (!toolName) return writeCursorOutput();

  const cwd = resolveWorkingDirectory(payload);
  const sessionId = resolveSessionId(payload);
  const project = resolveProject(cwd);
  const toolInput = resolveToolInput(payload);
  const cleanOutput = stripImageData(resolveToolOutput(payload));

  await postJson(
    '/agentmemory/observe',
    {
      hookType: 'post_tool_use',
      sessionId,
      project,
      cwd,
      timestamp: new Date().toISOString(),
      eventId: newEventId(),
      data: {
        tool_name: toolName,
        tool_input: truncateValue(toolInput),
        tool_output: truncateValue(cleanOutput),
      },
    },
    { config, payload },
  );

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
