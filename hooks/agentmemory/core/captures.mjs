import {
  postObserve,
  stripImageData,
  truncateText,
  truncateValue,
} from './shared.mjs';

export async function capturePromptSubmit(event, ctx) {
  const prompt = truncateText(event.prompt);
  if (!prompt) return;

  // No /session/start here. That endpoint overwrites the whole session record,
  // clearing firstPrompt and observationCount on every prompt. Sending project
  // and cwd is enough: observe creates the session when the record is missing.
  await postObserve(
    {
      hookType: 'prompt_submit',
      sessionId: event.sessionId,
      cwd: event.cwd,
      data: { prompt },
    },
    ctx,
  );
}

export async function captureAssistantResponse(event, ctx) {
  const assistantResponse = truncateText(event.assistantResponse);
  if (!assistantResponse) return;

  await postObserve(
    {
      hookType: 'assistant_response',
      sessionId: event.sessionId,
      cwd: event.cwd,
      data: { assistantResponse },
    },
    ctx,
  );
}

export async function capturePostToolUse(event, ctx) {
  if (!event.toolName) return;

  await postObserve(
    {
      hookType: 'post_tool_use',
      sessionId: event.sessionId,
      cwd: event.cwd,
      data: {
        tool_name: event.toolName,
        tool_input: truncateValue(event.toolInput),
        tool_output: truncateValue(stripImageData(event.toolOutput)),
      },
    },
    ctx,
  );
}

export async function capturePostToolFailure(event, ctx) {
  if (event.isInterrupt || !event.toolName) return;

  const error =
    typeof event.error === 'string'
      ? truncateText(event.error)
      : truncateValue(event.error ?? '');

  await postObserve(
    {
      hookType: 'post_tool_failure',
      sessionId: event.sessionId,
      cwd: event.cwd,
      data: {
        tool_name: event.toolName,
        tool_input: truncateValue(event.toolInput),
        error,
        ...(event.failureType ? { failure_type: event.failureType } : {}),
      },
    },
    ctx,
  );
}

function subagentData(event) {
  const data = {};
  if (event.subagentId) data.subagent_id = event.subagentId;
  if (event.subagentType) data.subagent_type = event.subagentType;
  if (event.task) data.task = event.task;
  if (event.status) data.status = event.status;
  if (event.summary) data.summary = event.summary;
  return data;
}

export async function captureSubagentStart(event, ctx) {
  await postObserve(
    {
      hookType: 'subagent_start',
      sessionId: event.sessionId,
      cwd: event.cwd,
      data: subagentData({
        subagentId: event.subagentId,
        subagentType: event.subagentType,
        task: truncateText(event.task),
      }),
    },
    ctx,
  );
}

export async function captureSubagentStop(event, ctx) {
  const status = typeof event.status === 'string' ? event.status.trim() : '';

  await postObserve(
    {
      hookType: 'subagent_stop',
      sessionId: event.sessionId,
      cwd: event.cwd,
      data: subagentData({
        subagentId: event.subagentId,
        subagentType: event.subagentType,
        task: truncateText(event.task),
        status,
        summary: truncateText(event.summary),
      }),
    },
    ctx,
  );
}
