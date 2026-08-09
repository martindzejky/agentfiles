#!/usr/bin/env node

// Conceptually adapted from AgentMemory plugin/scripts/pre-compact.mjs at
// d60652a7058773fa9428fa720eda38942f12f014.
//
// Upstream Claude Code PreCompact fetches /context and writes it to stdout so
// Claude can reinject memory into the compacted transcript. Cursor's preCompact
// is observational only (no useful reinject path), so that half is omitted.
// Keep a summarize checkpoint while the session still has pre-compact context;
// stop also summarizes later.

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
