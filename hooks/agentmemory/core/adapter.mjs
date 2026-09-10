import {
  appendHookLog,
  readConfig,
  readPayload,
  writeHookOutput,
} from './shared.mjs';

// Shared fail-open loop. Adapters supply identity, log location, and a
// vendor-to-neutral normalizer. Capture functions live in captures.mjs.
export async function runAdapter({
  hookName,
  logDirectory,
  agentId,
  normalize,
  capture,
}) {
  try {
    const raw = await readPayload();
    appendHookLog(hookName, raw, { logDirectory });
    if (!raw) return writeHookOutput();

    const config = readConfig();
    if (!config) return writeHookOutput();

    await capture(normalize(raw), { agentId, config });
    writeHookOutput();
  } catch {
    writeHookOutput();
  }
}
