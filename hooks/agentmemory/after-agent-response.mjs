#!/usr/bin/env node

// Cursor-specific companion to AgentMemory's prompt-submit.mjs, based on the
// same upstream revision: d60652a7058773fa9428fa720eda38942f12f014.
//
// Cursor has no upstream equivalent for this event. AgentMemory only reads
// toolName, toolInput, toolOutput and userPrompt off an observation, so a
// custom hookType carrying data.response is stored but never summarised. The
// response is therefore mapped onto the supported post_tool_use shape, matching
// Hermes / OpenClaw / Pi: tool_input is the user prompt, tool_output is the
// assistant reply. The prompt comes from a local cache written by
// beforeSubmitPrompt because Cursor's afterAgentResponse payload only
// documents `text`.

import {
  postJson,
  readCachedPrompt,
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
        hookType: 'post_tool_use',
        sessionId,
        project: resolveProject(cwd),
        cwd,
        timestamp: new Date().toISOString(),
        data: {
          tool_name: 'conversation',
          // Empty on cache miss. Identical prompts within five minutes may be
          // deduplicated upstream; that rare drop is accepted.
          tool_input: readCachedPrompt(sessionId),
          tool_output: response,
        },
      },
      { config },
    );
  }

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
