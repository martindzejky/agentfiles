#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/prompt-submit.mjs at
// d60652a7058773fa9428fa720eda38942f12f014.

import {
  newEventId,
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
  if (!payload) return writeCursorOutput();

  const sessionId = resolveSessionId(payload);
  const cwd = resolveWorkingDirectory(payload);
  const project = resolveProject(cwd);
  const prompt = truncateText(payload.prompt ?? payload.userPrompt);

  const config = readConfig();
  if (!config) return writeCursorOutput();

  // No /session/start here. That endpoint overwrites the whole session record,
  // clearing firstPrompt and observationCount on every prompt. Sending project
  // and cwd is enough: observe creates the session when the record is missing,
  // which also covers Cursor Cloud, where sessionStart never runs.
  if (prompt) {
    await postJson(
      '/agentmemory/observe',
      {
        hookType: 'prompt_submit',
        sessionId,
        project,
        cwd,
        timestamp: new Date().toISOString(),
        eventId: newEventId(),
        data: { prompt },
      },
      { config },
    );
  }

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
