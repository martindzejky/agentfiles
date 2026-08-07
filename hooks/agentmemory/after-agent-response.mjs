#!/usr/bin/env node

// Cursor-specific companion to AgentMemory's prompt-submit.mjs, based on the
// same upstream revision: d60652a7058773fa9428fa720eda38942f12f014.

import {
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

  const response = truncateText(payload.text);
  if (response) {
    const cwd = resolveWorkingDirectory(payload);
    await postJson(
      '/agentmemory/observe',
      {
        hookType: 'agent_response',
        sessionId: resolveSessionId(payload),
        project: resolveProject(cwd),
        cwd,
        timestamp: new Date().toISOString(),
        data: { response },
      },
      { config },
    );
  }

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
