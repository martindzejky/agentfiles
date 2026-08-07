#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/session-end.mjs at
// d60652a7058773fa9428fa720eda38942f12f014. The optional Claude memory bridge
// behavior is intentionally omitted.

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
    '/agentmemory/session/end',
    { sessionId: resolveSessionId(payload) },
    { config },
  );

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
