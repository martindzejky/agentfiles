import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { runAdapter } from '../core/adapter.mjs';
import { nonEmptyString } from '../core/shared.mjs';

export const AGENT_ID = 'cursor';

export function hookLogDirectory() {
  return join(homedir(), '.cursor', 'hooks-logs');
}

export function resolveSessionId(payload) {
  return (
    nonEmptyString(payload?.session_id) ??
    nonEmptyString(payload?.sessionId) ??
    nonEmptyString(payload?.conversation_id) ??
    nonEmptyString(payload?.parent_conversation_id) ??
    `${AGENT_ID}_${randomUUID()}`
  );
}

export function resolveWorkingDirectory(payload) {
  if (Array.isArray(payload?.workspace_roots)) {
    for (const root of payload.workspace_roots) {
      const workspaceRoot = nonEmptyString(root);
      if (workspaceRoot) return workspaceRoot;
    }
  }

  return nonEmptyString(payload?.cwd) ?? process.cwd();
}

function resolveToolName(payload) {
  return (
    nonEmptyString(payload?.tool_name) ?? nonEmptyString(payload?.toolName)
  );
}

function resolveToolInput(payload) {
  return payload?.tool_input ?? payload?.toolArgs;
}

function resolveToolOutput(payload) {
  if (payload?.tool_response !== undefined) return payload.tool_response;
  if (payload?.tool_output !== undefined) return payload.tool_output;
  const result = payload?.tool_result ?? payload?.toolResult;
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    return result.text_result_for_llm ?? result.textResultForLlm ?? result;
  }
  return result;
}

function resolveSubagentId(payload) {
  return (
    nonEmptyString(payload?.subagent_id) ??
    nonEmptyString(payload?.agent_id) ??
    nonEmptyString(payload?.agentName)
  );
}

function resolveSubagentType(payload) {
  return (
    nonEmptyString(payload?.subagent_type) ??
    nonEmptyString(payload?.agent_type) ??
    nonEmptyString(payload?.agentDisplayName) ??
    nonEmptyString(payload?.agentName)
  );
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
    prompt: payload.prompt ?? payload.userPrompt,
  };
}

export function normalizeAssistantResponse(payload) {
  return {
    ...baseEvent(payload),
    assistantResponse: payload.text,
  };
}

export function normalizePostToolUse(payload) {
  return {
    ...baseEvent(payload),
    toolName: resolveToolName(payload),
    toolInput: resolveToolInput(payload),
    toolOutput: resolveToolOutput(payload),
  };
}

export function normalizePostToolFailure(payload) {
  const failureType =
    typeof payload.failure_type === 'string'
      ? payload.failure_type
      : typeof payload.failureType === 'string'
        ? payload.failureType
        : undefined;

  return {
    ...baseEvent(payload),
    toolName: resolveToolName(payload),
    toolInput: resolveToolInput(payload),
    error: payload.error_message ?? payload.errorMessage ?? payload.error,
    failureType,
    isInterrupt: Boolean(payload.is_interrupt || payload.isInterrupt),
  };
}

export function normalizeSubagentStart(payload) {
  return {
    ...baseEvent(payload),
    subagentId: resolveSubagentId(payload),
    subagentType: resolveSubagentType(payload),
    task: payload.task,
  };
}

export function normalizeSubagentStop(payload) {
  return {
    ...baseEvent(payload),
    subagentId: resolveSubagentId(payload),
    subagentType: resolveSubagentType(payload),
    task: payload.task,
    status: payload.status,
    summary: payload.summary ?? payload.last_assistant_message ?? '',
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
