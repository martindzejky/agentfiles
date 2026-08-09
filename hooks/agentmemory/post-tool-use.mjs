#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/post-tool-use.mjs at
// d60652a7058773fa9428fa720eda38942f12f014.

import {
  extractImageData,
  postJson,
  readConfig,
  readPayload,
  resolveProject,
  resolveSessionId,
  resolveToolInput,
  resolveToolName,
  resolveToolOutput,
  resolveWorkingDirectory,
  truncateValue,
  writeCursorOutput,
} from './shared.mjs';

async function main() {
  const payload = await readPayload();
  const config = readConfig();
  if (!payload || !config) return writeCursorOutput();

  const toolName = resolveToolName(payload);
  if (!toolName) return writeCursorOutput();

  const cwd = resolveWorkingDirectory(payload);
  const { imageData, cleanOutput } = extractImageData(
    resolveToolOutput(payload),
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
        tool_name: toolName,
        tool_input: truncateValue(resolveToolInput(payload)),
        tool_output: truncateValue(cleanOutput),
        ...(imageData ? { image_data: imageData } : {}),
      },
    },
    { config },
  );

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
