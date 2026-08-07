#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/stop.mjs at
// d60652a7058773fa9428fa720eda38942f12f014.
//
// Upstream also calls /session/end. Cursor can fire stop after a turn while
// the conversation remains active, so ending the session here is deliberately
// omitted. sessionEnd is the only hook that closes a local Cursor session.

import {
  postJson,
  readConfig,
  readPayload,
  resolveSessionId,
  writeCursorOutput,
} from './shared.mjs';

async function main() {
  const payload = await readPayload();
  const config = readConfig();
  if (!payload || !config) return writeCursorOutput();

  await postJson(
    '/agentmemory/summarize',
    { sessionId: resolveSessionId(payload) },
    { config },
  );

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
