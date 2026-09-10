import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { runAdapter } from '../core/adapter.mjs';
import { nonEmptyString } from '../core/shared.mjs';

export const AGENT_ID = 'codex';

export function hookLogDirectory() {
  return join(homedir(), '.codex', 'hooks-logs');
}

export function resolveSessionId(payload) {
  return nonEmptyString(payload?.session_id) ?? `${AGENT_ID}_${randomUUID()}`;
}

export function resolveWorkingDirectory(payload) {
  return nonEmptyString(payload?.cwd) ?? process.cwd();
}

function baseEvent(payload) {
  return {
    sessionId: resolveSessionId(payload),
    cwd: resolveWorkingDirectory(payload),
  };
}

export function normalizePromptSubmit(payload) {
  return {
    ...baseEvent(payload),
    prompt: payload.prompt,
  };
}

export function normalizeAssistantResponse(payload) {
  return {
    ...baseEvent(payload),
    assistantResponse: payload.last_assistant_message,
  };
}

export function normalizePostToolUse(payload) {
  return {
    ...baseEvent(payload),
    toolName: nonEmptyString(payload?.tool_name),
    toolInput: payload.tool_input,
    toolOutput: payload.tool_response,
  };
}

export function normalizeSubagentStart(payload) {
  return {
    ...baseEvent(payload),
    subagentId: nonEmptyString(payload?.agent_id),
    subagentType: nonEmptyString(payload?.agent_type),
    task: payload.task,
  };
}

export function normalizeSubagentStop(payload) {
  return {
    ...baseEvent(payload),
    subagentId: nonEmptyString(payload?.agent_id),
    subagentType: nonEmptyString(payload?.agent_type),
    task: payload.task,
    status: payload.status,
    summary: payload.last_assistant_message ?? '',
  };
}

export function run(hookName, normalize, capture) {
  return runAdapter({
    hookName,
    logDirectory: hookLogDirectory(),
    agentId: AGENT_ID,
    normalize,
    capture,
  });
}
