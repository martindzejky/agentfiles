#!/usr/bin/env node

// Conceptually adapted from AgentMemory plugin/scripts/pre-compact.mjs at
// d60652a7058773fa9428fa720eda38942f12f014. Cursor's preCompact event is
// observational, so this script checkpoints instead of writing context.

import {
  postJson,
  readConfig,
  readPayload,
  resolveProject,
  resolveSessionId,
  resolveWorkingDirectory,
  writeCursorOutput,
} from './shared.mjs';

function number(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

async function main() {
  const payload = await readPayload();
  const config = readConfig();
  if (!payload || !config) return writeCursorOutput();

  const sessionId = resolveSessionId(payload);
  const cwd = resolveWorkingDirectory(payload);
  const project = resolveProject(cwd);
  const trigger =
    payload.trigger === 'auto' || payload.trigger === 'manual'
      ? payload.trigger
      : undefined;

  await postJson(
    '/agentmemory/observe',
    {
      hookType: 'pre_compact',
      sessionId,
      project,
      cwd,
      timestamp: new Date().toISOString(),
      data: {
        trigger,
        context_usage_percent: number(payload.context_usage_percent),
        context_tokens: number(payload.context_tokens),
        context_window_size: number(payload.context_window_size),
        message_count: number(payload.message_count),
        messages_to_compact: number(payload.messages_to_compact),
        is_first_compaction:
          typeof payload.is_first_compaction === 'boolean'
            ? payload.is_first_compaction
            : undefined,
      },
    },
    { config },
  );

  await postJson(
    '/agentmemory/summarize',
    { sessionId },
    { config },
  );

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
