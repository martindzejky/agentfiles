#!/usr/bin/env node

// Cursor-specific companion to AgentMemory's prompt-submit.mjs, based on the
// same upstream revision: d60652a7058773fa9428fa720eda38942f12f014.
//
// Cursor has no upstream equivalent for this event. AgentMemory only reads
// toolName, toolInput, toolOutput and userPrompt off an observation, so a
// custom hookType carrying data.response is stored but never summarised. The
// response is therefore mapped onto the supported post_tool_use shape.

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
    const timestamp = new Date().toISOString();
    await postJson(
      '/agentmemory/observe',
      {
        hookType: 'post_tool_use',
        sessionId: resolveSessionId(payload),
        project: resolveProject(cwd),
        cwd,
        timestamp,
        data: {
          tool_name: 'conversation',
          tool_input: timestamp,
          tool_output: response,
        },
      },
      { config },
    );
  }

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
