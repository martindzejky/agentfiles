import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

// Project discovery is adapted from AgentMemory's src/hooks/_project.ts at
// d60652a7058773fa9428fa720eda38942f12f014.

export const CAPTURE_LIMIT = 10_000;
// Sized for remote HTTPS (e.g. Railway) while staying under Cursor's usual
// 3s hook budget.
export const REQUEST_TIMEOUT_MS = 2_500;
export const CONTEXT_TIMEOUT_MS = 2_500;

// Hardcoded for this Cursor-only integration. Multi-agent setups that share
// one AgentMemory server use agentId to tag which client wrote the memory.
export const AGENT_ID = 'cursor';

export function withAgentId(body) {
  return { ...body, agentId: AGENT_ID };
}

// Idempotency key for /agentmemory/observe. Fresh UUID per hook invocation;
// the server dedups only on exact eventId repeats (no content-based dedup).
export function newEventId() {
  return randomUUID();
}

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
    // Cursor subagentStart documents parent_conversation_id when the common
    // conversation_id field is absent.
    nonEmptyString(payload?.parent_conversation_id) ??
    `cursor_${randomUUID()}`
  );
}

export function resolveSubagentId(payload) {
  return (
    nonEmptyString(payload?.subagent_id) ??
    nonEmptyString(payload?.agent_id) ??
    nonEmptyString(payload?.agentName)
  );
}

export function resolveSubagentType(payload) {
  return (
    nonEmptyString(payload?.subagent_type) ??
    nonEmptyString(payload?.agent_type) ??
    nonEmptyString(payload?.agentDisplayName) ??
    nonEmptyString(payload?.agentName)
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
      // Always tag writes as Cursor. Lazy-create paths (observe / summarize)
      // should honor agentId on the server; extra fields stay compatible with
      // older servers that ignore unknown keys.
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

// Strip base64 image blobs from tool output. Upstream Claude post-tool-use
// extracts them into image_data for vision features; Cursor hooks only need
// text that AgentMemory can summarize, so replace blobs with a placeholder.
export function stripImageData(output) {
  if (isBase64Image(output)) return '[image data omitted]';

  if (output && typeof output === 'object' && !Array.isArray(output)) {
    const clean = {};
    for (const [key, value] of Object.entries(output)) {
      clean[key] = isBase64Image(value) ? '[image data omitted]' : value;
    }
    return clean;
  }

  return output;
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

// File-touching tools: upstream Claude names plus Cursor edit/delete tools.
// Shell and MCP are skipped (no reliable path list; MCP names look like MCP:…).
const ENRICH_FILE_TOOLS = new Set([
  'edit',
  'write',
  'create',
  'read',
  'view',
  'glob',
  'grep',
  'strreplace',
  'search_replace',
  'delete',
]);

export function isContextInjectionEnabled() {
  return process.env.AGENTMEMORY_INJECT_CONTEXT === 'true';
}

// Adapted from AgentMemory src/hooks/pre-tool-use.ts file/term extraction,
// with Cursor path key aliases (filePath, target_file).
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
      ? ['path', 'file', 'file_path', 'filePath']
      : [
          'file_path',
          'filePath',
          'path',
          'file',
          'target_file',
          'targetFile',
          'pattern',
        ];
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
  cwd,
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
      project,
      cwd,
      files: query.files,
      ...(query.terms.length > 0 ? { terms: query.terms } : {}),
      toolName,
    },
    { config, timeoutMs: CONTEXT_TIMEOUT_MS },
  );

  return truncateText(result?.context);
}

export function writeCursorOutput(output = {}) {
  process.stdout.write(`${JSON.stringify(output)}\n`);
}
