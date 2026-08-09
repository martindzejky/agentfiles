#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/session-end.mjs at
// d60652a7058773fa9428fa720eda38942f12f014. The optional Claude memory bridge
// behavior is intentionally omitted.

import {
  clearCachedPrompt,
  postJson,
  readConfig,
  readPayload,
  resolveSessionId,
  writeCursorOutput,
} from './shared.mjs';

async function main() {
  const payload = await readPayload();
  if (!payload) return writeCursorOutput();

  const sessionId = resolveSessionId(payload);
  // Always drop the local prompt bridge entry, even when the server is
  // unreachable, so abandoned chats do not linger in the cache file.
  clearCachedPrompt(sessionId);

  const config = readConfig();
  if (!config) return writeCursorOutput();

  await postJson('/agentmemory/session/end', { sessionId }, { config });

  writeCursorOutput();
}

main().catch(() => writeCursorOutput());
