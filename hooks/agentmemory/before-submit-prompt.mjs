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
  writeCachedPrompt,
  writeCursorOutput,
} from './shared.mjs';

async function main() {
  const payload = await readPayload();
  if (!payload) return writeCursorOutput();

  const sessionId = resolveSessionId(payload);
  const cwd = resolveWorkingDirectory(payload);
  const project = resolveProject(cwd);
  const prompt = truncateText(payload.prompt ?? payload.userPrompt);

  // Cache even when the server is unreachable so a later response hook can
  // still pair conversation tool_input once config/network recover.
  if (prompt) writeCachedPrompt(sessionId, prompt);

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
        // tool_input mirrors the prompt so different prompts stay distinct in
        // the five-minute dedup window. Identical prompts may dedupe; that is
        // accepted (same stance as conversation pairing / Pi-style turns).
        // Leaving tool_input unset would make every prompt_submit collide.
        data: { prompt, tool_input: prompt },
      },
      { config },
    );
  }

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
