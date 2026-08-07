#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/prompt-submit.mjs at
// d60652a7058773fa9428fa720eda38942f12f014.

import {
  SESSION_INIT_TIMEOUT_MS,
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

  const sessionId = resolveSessionId(payload);
  const cwd = resolveWorkingDirectory(payload);
  const project = resolveProject(cwd);
  const prompt = truncateText(payload.prompt ?? payload.userPrompt);

  // Cursor Cloud does not run sessionStart. Keep this fallback short, but
  // finish it before observing so session metadata cannot race prompt capture.
  await postJson(
    '/agentmemory/session/start',
    { sessionId, project, cwd },
    { config, timeoutMs: SESSION_INIT_TIMEOUT_MS },
  );

  if (prompt) {
    await postJson(
      '/agentmemory/observe',
      {
        hookType: 'prompt_submit',
        sessionId,
        project,
        cwd,
        timestamp: new Date().toISOString(),
        data: { prompt },
      },
      { config },
    );
  }

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
