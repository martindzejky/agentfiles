import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';

// Project discovery is adapted from AgentMemory's src/hooks/_project.ts at
// d60652a7058773fa9428fa720eda38942f12f014.

export const CAPTURE_LIMIT = 10_000;
export const REQUEST_TIMEOUT_MS = 1_000;
export const CONTEXT_TIMEOUT_MS = 1_500;
export const SESSION_INIT_TIMEOUT_MS = 500;

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

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
      body: JSON.stringify(body),
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
