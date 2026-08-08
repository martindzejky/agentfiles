import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  chmodSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

// Project discovery is adapted from AgentMemory's src/hooks/_project.ts at
// d60652a7058773fa9428fa720eda38942f12f014.

export const CAPTURE_LIMIT = 10_000;
export const REQUEST_TIMEOUT_MS = 1_000;
export const CONTEXT_TIMEOUT_MS = 1_500;

// Hardcoded for this Cursor-only integration. Multi-agent setups that share
// one AgentMemory server use agentId to tag which client wrote the memory.
export const AGENT_ID = 'cursor';

export function withAgentId(body) {
  return { ...body, agentId: AGENT_ID };
}

// Pi-style bridge: beforeSubmitPrompt stores the user prompt so
// afterAgentResponse can send it as conversation tool_input. Growth is
// bounded by per-session overwrite, TTL prune, a hard cap, and sessionEnd
// deletion.
export const PROMPT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const PROMPT_CACHE_MAX_ENTRIES = 200;

const LOCAL_ENV_KEYS = [
  'AGENTMEMORY_URL',
  'AGENTMEMORY_SECRET',
  'AGENTMEMORY_REQUIRE_HTTPS',
  'AGENTMEMORY_INJECT_CONTEXT',
  'AGENTMEMORY_PROJECT_NAME',
];

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function loadLocalEnv() {
  if (process.env.AGENTMEMORY_DISABLE_ENV_FILE === '1') return;

  const envFile =
    nonEmptyString(process.env.AGENTMEMORY_ENV_FILE) ??
    fileURLToPath(new URL('.env', import.meta.url));

  try {
    const values = parseEnv(readFileSync(envFile, 'utf8'));
    for (const key of LOCAL_ENV_KEYS) {
      if (process.env[key] === undefined && typeof values[key] === 'string') {
        process.env[key] = values[key];
      }
    }
  } catch {
    // Missing or invalid local configuration must not break Cursor.
  }
}

loadLocalEnv();

export async function readPayload() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  try {
    const payload = JSON.parse(input);
    return payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload
      : null;
  } catch {
    return null;
  }
}

export function resolveSessionId(payload) {
  return (
    nonEmptyString(payload?.session_id) ??
    nonEmptyString(payload?.conversation_id) ??
    `cursor_${randomUUID()}`
  );
}

export function resolveWorkingDirectory(payload) {
  const workspaceRoot = Array.isArray(payload?.workspace_roots)
    ? nonEmptyString(payload.workspace_roots[0])
    : undefined;

  return workspaceRoot ?? nonEmptyString(payload?.cwd) ?? process.cwd();
}

export function resolveProject(cwd) {
  const explicit = nonEmptyString(process.env.AGENTMEMORY_PROJECT_NAME);
  if (explicit) return explicit;

  try {
    const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 500,
    });
    const root = nonEmptyString(result.stdout);
    if (result.status === 0 && root) return basename(root);
  } catch {
    // Fall through to the working-directory basename.
  }

  return basename(cwd) || 'unknown-project';
}

function isLoopback(hostname) {
  const host = hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '::1' ||
    host === '[::1]' ||
    /^127(?:\.\d{1,3}){3}$/.test(host)
  );
}

export function readConfig() {
  const rawUrl = nonEmptyString(process.env.AGENTMEMORY_URL);
  const secret = nonEmptyString(process.env.AGENTMEMORY_SECRET);
  if (!rawUrl || !secret) return null;

  try {
    const url = new URL(rawUrl);
    if (url.username || url.password) return null;
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (
      url.protocol === 'http:' &&
      (process.env.AGENTMEMORY_REQUIRE_HTTPS === '1' ||
        !isLoopback(url.hostname))
    ) {
      return null;
    }

    url.hash = '';
    url.search = '';
    return {
      baseUrl: url.href.replace(/\/$/, ''),
      secret,
    };
  } catch {
    return null;
  }
}

export async function postJson(path, body, options = {}) {
  const config = options.config ?? readConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.secret}`,
        'Content-Type': 'application/json',
      },
      // Always tag writes as Cursor. /session/start stamps the session;
      // other endpoints may ignore unknown fields today but stay tagged
      // for forward compatibility.
      body: JSON.stringify(withAgentId(body)),
      redirect: 'error',
      signal: AbortSignal.timeout(options.timeoutMs ?? REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return null;
  }
}

export function truncateText(value) {
  return typeof value === 'string' ? value.slice(0, CAPTURE_LIMIT) : '';
}

export function writeCursorOutput(output = {}) {
  process.stdout.write(`${JSON.stringify(output)}\n`);
}

function promptCachePath() {
  return (
    nonEmptyString(process.env.AGENTMEMORY_PROMPT_CACHE_FILE) ??
    fileURLToPath(new URL('.prompt-cache.json', import.meta.url))
  );
}

function readPromptCacheFile(path) {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function writePromptCacheFile(path, cache) {
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(cache)}\n`, { mode: 0o600 });
  try {
    chmodSync(tempPath, 0o600);
  } catch {
    // Best effort on platforms that ignore mode in writeFileSync.
  }
  renameSync(tempPath, path);
}

export function prunePromptCache(
  cache,
  {
    now = Date.now(),
    ttlMs = PROMPT_CACHE_TTL_MS,
    maxEntries = PROMPT_CACHE_MAX_ENTRIES,
  } = {},
) {
  const cutoff = now - ttlMs;
  const kept = {};

  for (const [sessionId, entry] of Object.entries(cache)) {
    if (!entry || typeof entry !== 'object') continue;
    const prompt = nonEmptyString(entry.prompt);
    const updatedAt = Date.parse(entry.updatedAt);
    if (!prompt || !Number.isFinite(updatedAt) || updatedAt < cutoff) continue;
    kept[sessionId] = { prompt, updatedAt: new Date(updatedAt).toISOString() };
  }

  const sessions = Object.keys(kept);
  if (sessions.length <= maxEntries) return kept;

  sessions.sort(
    (left, right) =>
      Date.parse(kept[left].updatedAt) - Date.parse(kept[right].updatedAt),
  );
  for (const sessionId of sessions.slice(0, sessions.length - maxEntries)) {
    delete kept[sessionId];
  }
  return kept;
}

export function writeCachedPrompt(sessionId, prompt) {
  const id = nonEmptyString(sessionId);
  const text = truncateText(prompt);
  if (!id || !text) return;

  try {
    const path = promptCachePath();
    const cache = prunePromptCache(readPromptCacheFile(path));
    cache[id] = { prompt: text, updatedAt: new Date().toISOString() };
    writePromptCacheFile(path, prunePromptCache(cache));
  } catch {
    // Cache failures must never block Cursor.
  }
}

export function readCachedPrompt(sessionId) {
  const id = nonEmptyString(sessionId);
  if (!id) return '';

  try {
    const entry = readPromptCacheFile(promptCachePath())[id];
    return truncateText(entry?.prompt);
  } catch {
    return '';
  }
}

export function clearCachedPrompt(sessionId) {
  const id = nonEmptyString(sessionId);
  if (!id) return;

  try {
    const path = promptCachePath();
    const cache = prunePromptCache(readPromptCacheFile(path));
    if (!(id in cache)) return;
    delete cache[id];
    if (Object.keys(cache).length === 0) {
      try {
        unlinkSync(path);
      } catch {
        writePromptCacheFile(path, {});
      }
      return;
    }
    writePromptCacheFile(path, cache);
  } catch {
    // Cache failures must never block Cursor.
  }
}
