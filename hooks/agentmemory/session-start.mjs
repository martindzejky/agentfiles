#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/session-start.mjs at
// d60652a7058773fa9428fa720eda38942f12f014.

import {
  CONTEXT_TIMEOUT_MS,
  postJson,
  readConfig,
  readPayload,
  resolveProject,
  resolveSessionId,
  resolveWorkingDirectory,
  truncateText,
  writeCursorOutput,
} from './shared.mjs';

async function main() {
  const payload = await readPayload();
  const config = readConfig();
  if (!payload || !config) return writeCursorOutput();

  const cwd = resolveWorkingDirectory(payload);
  const result = await postJson(
    '/agentmemory/session/start',
    {
      sessionId: resolveSessionId(payload),
      project: resolveProject(cwd),
      cwd,
    },
    {
      config,
      timeoutMs:
        process.env.AGENTMEMORY_INJECT_CONTEXT === 'true'
          ? CONTEXT_TIMEOUT_MS
          : undefined,
    },
  );

  const context =
    process.env.AGENTMEMORY_INJECT_CONTEXT === 'true'
      ? truncateText(result?.context)
      : '';

  writeCursorOutput(context ? { additional_context: context } : {});
}

main().catch(() => writeCursorOutput());
