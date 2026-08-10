#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/stop.mjs at
// d60652a7058773fa9428fa720eda38942f12f014.
//
// Upstream also calls /session/end. Cursor has no reliable session end, and
// stop can fire after a turn while the conversation remains active, so this
// hook only summarizes. Sessions stay open-ended.
//
// project + cwd travel with summarize so a lazy-create server path can stamp
// them if the session record is still missing (same shape as observe).

import {
  postJson,
  readConfig,
  readPayload,
  resolveProject,
  resolveSessionId,
  resolveWorkingDirectory,
  writeCursorOutput,
} from './shared.mjs';

async function main() {
  const payload = await readPayload();
  const config = readConfig();
  if (!payload || !config) return writeCursorOutput();

  const cwd = resolveWorkingDirectory(payload);
  await postJson(
    '/agentmemory/summarize',
    {
      sessionId: resolveSessionId(payload),
      project: resolveProject(cwd),
      cwd,
    },
    { config },
  );

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
