#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/prompt-submit.mjs at
// d60652a7058773fa9428fa720eda38942f12f014.

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

  const sessionId = resolveSessionId(payload);
  const cwd = resolveWorkingDirectory(payload);
  const project = resolveProject(cwd);
  const prompt = truncateText(payload.prompt ?? payload.userPrompt);

  // No /session/start here. That endpoint overwrites the whole session record,
  // clearing firstPrompt and observationCount on every prompt. Sending project
  // and cwd is enough: observe creates the session when the record is missing,
  // which also covers Cursor Cloud, where sessionStart never runs.
  if (prompt) {
    const timestamp = new Date().toISOString();
    await postJson(
      '/agentmemory/observe',
      {
        hookType: 'prompt_submit',
        sessionId,
        project,
        cwd,
        timestamp,
        // tool_input is not tool data. AgentMemory deduplicates on
        // sessionId + tool_name + tool_input, so leaving it unset makes the
        // hash identical for every prompt in a session and silently drops
        // each one sent inside the five minute window. The timestamp keeps
        // each real prompt distinct.
        data: { prompt, tool_input: timestamp },
      },
      { config },
    );
  }

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
