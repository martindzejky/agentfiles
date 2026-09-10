import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

// Project discovery is adapted from AgentMemory's src/hooks/_project.ts at
// d60652a7058773fa9428fa720eda38942f12f014.

export const CAPTURE_LIMIT = 10_000;
// Sized for remote HTTPS (e.g. Railway) while staying under Cursor's usual
// 3s hook budget.
export const REQUEST_TIMEOUT_MS = 2_500;

const LOCAL_ENV_KEYS = [
  'AGENTMEMORY_URL',
  'AGENTMEMORY_SECRET',
  'AGENTMEMORY_REQUIRE_HTTPS',
  'AGENTMEMORY_PROJECT_NAME',
  'AGENTMEMORY_HOOK_LOG_DIR',
];

export function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function loadLocalEnv() {
  if (process.env.AGENTMEMORY_DISABLE_ENV_FILE === '1') return;

  const envFile =
    nonEmptyString(process.env.AGENTMEMORY_ENV_FILE) ??
    fileURLToPath(new URL('../.env', import.meta.url));

  try {
    const values = parseEnv(readFileSync(envFile, 'utf8'));
    for (const key of LOCAL_ENV_KEYS) {
      if (process.env[key] === undefined && typeof values[key] === 'string') {
        process.env[key] = values[key];
      }
    }
  } catch {
    // Missing or invalid local configuration must not break the hook.
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

function resolveLogSessionId(payload) {
  const sessionId =
    nonEmptyString(payload?.session_id) ??
    nonEmptyString(payload?.sessionId) ??
    nonEmptyString(payload?.conversation_id) ??
    nonEmptyString(payload?.parent_conversation_id) ??
    'unknown';
  return sessionId.replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 200) || 'unknown';
}

function resolveLogDirectory(logDirectory) {
  return nonEmptyString(process.env.AGENTMEMORY_HOOK_LOG_DIR) ?? logDirectory;
}

// Local debug log only. Never uploaded; never printed to stdout/stderr.
export function appendHookLog(hook, payload, { logDirectory }) {
  try {
    const directory = resolveLogDirectory(logDirectory);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      hook,
      payload: payload == null ? null : truncateValue(stripImageData(payload)),
    });
    appendFileSync(
      join(directory, `${resolveLogSessionId(payload)}.jsonl`),
      `${line}\n`,
      { mode: 0o600 },
    );
  } catch {
    // Logging must not break the hook.
  }
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

export function newEventId() {
  return randomUUID();
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
      body: JSON.stringify({ ...body, agentId: options.agentId }),
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

export async function postObserve({ hookType, sessionId, cwd, data }, ctx) {
  return postJson(
    '/agentmemory/observe',
    {
      hookType,
      sessionId,
      project: resolveProject(cwd),
      cwd,
      timestamp: new Date().toISOString(),
      eventId: newEventId(),
      data,
    },
    ctx,
  );
}

export function truncateText(value) {
  return typeof value === 'string' ? value.slice(0, CAPTURE_LIMIT) : '';
}

// Truncate tool payloads for observe. Strings are sliced; objects are
// JSON-stringified when they exceed the capture limit.
export function truncateValue(value, max = CAPTURE_LIMIT) {
  if (typeof value === 'string') {
    return value.length > max
      ? `${value.slice(0, max)}\n[...truncated]`
      : value;
  }
  if (value && typeof value === 'object') {
    try {
      const serialized = JSON.stringify(value);
      if (serialized.length > max)
        return `${serialized.slice(0, max)}...[truncated]`;
      return value;
    } catch {
      return String(value).slice(0, max);
    }
  }
  return value;
}

// data: URLs cover every format; the bare prefixes are PNG, JPEG, GIF, WEBP.
const BASE64_IMAGE_PREFIXES = [
  'data:image/',
  'iVBORw0KGgo',
  '/9j/',
  'R0lGOD',
  'UklGR',
];

function isBase64Image(value) {
  return (
    typeof value === 'string' &&
    BASE64_IMAGE_PREFIXES.some((prefix) => value.startsWith(prefix))
  );
}

// Vision is unsupported; replace base64 image blobs at every depth.
export function stripImageData(value) {
  if (isBase64Image(value)) return '[image data omitted]';
  if (Array.isArray(value)) return value.map(stripImageData);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        stripImageData(nested),
      ]),
    );
  }
  return value;
}

export function writeHookOutput(output = {}) {
  process.stdout.write(`${JSON.stringify(output)}\n`);
}
