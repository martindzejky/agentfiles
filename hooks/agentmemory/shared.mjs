import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  chmodSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
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
// afterAgentResponse can send it as conversation tool_input. One JSON file
// per session avoids read-modify-write races when multiple local agents run
// in parallel. Growth is bounded by per-session overwrite, TTL prune, a hard
// cap, and sessionEnd deletion.
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

function isBase64Image(value) {
  return (
    typeof value === 'string' &&
    (value.startsWith('data:image/') ||
      value.startsWith('iVBORw0KGgo') ||
      value.startsWith('/9j/'))
  );
}

// Adapted from AgentMemory plugin/scripts/post-tool-use.mjs image handling.
export function extractImageData(output) {
  if (isBase64Image(output)) {
    return { imageData: output, cleanOutput: '[image data extracted]' };
  }

  if (output && typeof output === 'object' && !Array.isArray(output)) {
    let imageData;
    const clean = {};
    for (const [key, value] of Object.entries(output)) {
      if (!imageData && isBase64Image(value)) {
        imageData = value;
        clean[key] = '[image data extracted]';
      } else {
        clean[key] = value;
      }
    }
    return { imageData, cleanOutput: clean };
  }

  return { imageData: undefined, cleanOutput: output };
}

export function resolveToolName(payload) {
  return (
    nonEmptyString(payload?.tool_name) ?? nonEmptyString(payload?.toolName)
  );
}

export function resolveToolInput(payload) {
  return payload?.tool_input ?? payload?.toolArgs;
}

export function resolveToolOutput(payload) {
  if (payload?.tool_response !== undefined) return payload.tool_response;
  if (payload?.tool_output !== undefined) return payload.tool_output;
  const result = payload?.tool_result ?? payload?.toolResult;
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    return result.text_result_for_llm ?? result.textResultForLlm ?? result;
  }
  return result;
}

// File-touching tools only, matching AgentMemory pre-tool-use.ts. Shell and
// MCP tools are skipped (no reliable path list; MCP names look like MCP:…).
const ENRICH_FILE_TOOLS = new Set([
  'edit',
  'write',
  'create',
  'read',
  'view',
  'glob',
  'grep',
]);

export function isContextInjectionEnabled() {
  return process.env.AGENTMEMORY_INJECT_CONTEXT === 'true';
}

// Adapted from AgentMemory src/hooks/pre-tool-use.ts file/term extraction.
export function extractEnrichQuery(toolName, toolInput) {
  const name = nonEmptyString(toolName);
  if (!name) return null;
  if (name.startsWith('MCP:') || name.toLowerCase().startsWith('mcp:')) {
    return null;
  }

  const normalized = name.toLowerCase();
  if (!ENRICH_FILE_TOOLS.has(normalized)) return null;

  const input =
    toolInput && typeof toolInput === 'object' && !Array.isArray(toolInput)
      ? toolInput
      : {};
  const files = [];
  const fileKeys =
    normalized === 'grep'
      ? ['path', 'file']
      : ['file_path', 'path', 'file', 'pattern'];
  for (const key of fileKeys) {
    const value = input[key];
    if (typeof value === 'string' && value.length > 0) files.push(value);
  }
  if (files.length === 0) return null;

  const terms = [];
  if (normalized === 'grep' || normalized === 'glob') {
    const pattern = input.pattern;
    if (typeof pattern === 'string' && pattern.length > 0) terms.push(pattern);
  }

  return { files, terms };
}

// Cursor-native port of upstream PreToolUse enrich: POST /agentmemory/enrich
// and return text for postToolUse additional_context. Opt-in only (#143).
export async function fetchEnrichContext({
  config,
  sessionId,
  project,
  toolName,
  toolInput,
}) {
  if (!isContextInjectionEnabled() || !config) return '';

  const query = extractEnrichQuery(toolName, toolInput);
  if (!query) return '';

  const result = await postJson(
    '/agentmemory/enrich',
    {
      sessionId,
      files: query.files,
      ...(query.terms.length > 0 ? { terms: query.terms } : {}),
      toolName,
      project,
    },
    { config, timeoutMs: CONTEXT_TIMEOUT_MS },
  );

  return truncateText(result?.context);
}

export function writeCursorOutput(output = {}) {
  process.stdout.write(`${JSON.stringify(output)}\n`);
}

export function promptCacheDir() {
  return fileURLToPath(new URL('.prompt-cache', import.meta.url));
}

// Encode so odd session ids cannot escape the cache directory via `/` or `..`.
export function promptCacheEntryPath(dir, sessionId) {
  return join(dir, `${encodeURIComponent(sessionId)}.json`);
}

function readPromptCacheEntry(path) {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const prompt = nonEmptyString(parsed.prompt);
    const updatedAt = Date.parse(parsed.updatedAt);
    if (!prompt || !Number.isFinite(updatedAt)) return null;
    return { prompt, updatedAt: new Date(updatedAt).toISOString() };
  } catch {
    return null;
  }
}

function writeAtomicJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(value)}\n`, { mode: 0o600 });
  try {
    chmodSync(tempPath, 0o600);
  } catch {
    // Best effort on platforms that ignore mode in writeFileSync.
  }
  renameSync(tempPath, path);
}

function listPromptCacheEntries(dir) {
  try {
    return readdirSync(dir).flatMap((name) => {
      if (!name.endsWith('.json') || name.includes('.tmp')) return [];
      const path = join(dir, name);
      const entry = readPromptCacheEntry(path);
      if (!entry) return [];
      return [{ path, ...entry }];
    });
  } catch {
    return [];
  }
}

export function prunePromptCacheDir(
  dir,
  {
    now = Date.now(),
    ttlMs = PROMPT_CACHE_TTL_MS,
    maxEntries = PROMPT_CACHE_MAX_ENTRIES,
  } = {},
) {
  const cutoff = now - ttlMs;
  const kept = [];

  for (const entry of listPromptCacheEntries(dir)) {
    if (Date.parse(entry.updatedAt) < cutoff) {
      try {
        unlinkSync(entry.path);
      } catch {
        // Parallel prune or clear may have already removed it.
      }
      continue;
    }
    kept.push(entry);
  }

  if (kept.length <= maxEntries) return kept.length;

  kept.sort(
    (left, right) => Date.parse(left.updatedAt) - Date.parse(right.updatedAt),
  );
  for (const entry of kept.slice(0, kept.length - maxEntries)) {
    try {
      unlinkSync(entry.path);
    } catch {
      // Parallel prune or clear may have already removed it.
    }
  }
  return Math.min(kept.length, maxEntries);
}

export function writeCachedPrompt(sessionId, prompt, dir = promptCacheDir()) {
  const id = nonEmptyString(sessionId);
  const text = truncateText(prompt);
  if (!id || !text) return;

  try {
    writeAtomicJson(promptCacheEntryPath(dir, id), {
      prompt: text,
      updatedAt: new Date().toISOString(),
    });
    prunePromptCacheDir(dir);
  } catch {
    // Cache failures must never block Cursor.
  }
}

export function readCachedPrompt(sessionId, dir = promptCacheDir()) {
  const id = nonEmptyString(sessionId);
  if (!id) return '';

  try {
    const entry = readPromptCacheEntry(promptCacheEntryPath(dir, id));
    return truncateText(entry?.prompt);
  } catch {
    return '';
  }
}

export function clearCachedPrompt(sessionId, dir = promptCacheDir()) {
  const id = nonEmptyString(sessionId);
  if (!id) return;

  try {
    unlinkSync(promptCacheEntryPath(dir, id));
  } catch {
    // Cache failures must never block Cursor.
  }
}
