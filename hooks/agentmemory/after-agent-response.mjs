#!/usr/bin/env node

// Cursor-specific companion to AgentMemory's prompt-submit.mjs, based on the
// same upstream revision: d60652a7058773fa9428fa720eda38942f12f014.
//
// Cursor has no upstream equivalent for this event. The martindzejky
// agentmemory fork (Pass E) lifts data.assistantResponse for hookType
// assistant_response into compression, so this adapter sends that native
// shape instead of remapping onto a fake post_tool_use conversation tool.

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
  const config = readConfig();
  if (!payload || !config) return writeCursorOutput();

  const response = truncateText(payload.text);
  if (response) {
    const sessionId = resolveSessionId(payload);
    const cwd = resolveWorkingDirectory(payload);
    await postJson(
      '/agentmemory/observe',
      {
        hookType: 'assistant_response',
        sessionId,
        project: resolveProject(cwd),
        cwd,
        timestamp: new Date().toISOString(),
        eventId: newEventId(),
        data: {
          assistantResponse: response,
        },
      },
      { config },
    );
  }

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
