#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/post-tool-failure.mjs at
// d60652a7058773fa9428fa720eda38942f12f014.

import {
  postJson,
  readConfig,
  readPayload,
  resolveProject,
  resolveSessionId,
  resolveToolInput,
  resolveToolName,
  resolveWorkingDirectory,
  truncateText,
  truncateValue,
  writeCursorOutput,
} from './shared.mjs';

async function main() {
  const payload = await readPayload();
  const config = readConfig();
  if (!payload || !config) return writeCursorOutput();

  // User cancels are noise for memory; upstream skips them too.
  if (payload.is_interrupt || payload.isInterrupt) return writeCursorOutput();

  const toolName = resolveToolName(payload);
  if (!toolName) return writeCursorOutput();

  const cwd = resolveWorkingDirectory(payload);
  const error =
    payload.error_message ?? payload.errorMessage ?? payload.error ?? undefined;
  const failureType =
    typeof payload.failure_type === 'string'
      ? payload.failure_type
      : typeof payload.failureType === 'string'
        ? payload.failureType
        : undefined;

  await postJson(
    '/agentmemory/observe',
    {
      hookType: 'post_tool_failure',
      sessionId: resolveSessionId(payload),
      project: resolveProject(cwd),
      cwd,
      timestamp: new Date().toISOString(),
      data: {
        tool_name: toolName,
        tool_input: truncateValue(resolveToolInput(payload)),
        // observe maps post_tool_failure toolOutput from data.error.
        error:
          typeof error === 'string'
            ? truncateText(error)
            : truncateValue(error ?? ''),
        ...(failureType ? { failure_type: failureType } : {}),
      },
    },
    { config },
  );

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
