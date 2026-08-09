#!/usr/bin/env node

// Adapted from AgentMemory plugin/scripts/post-tool-use.mjs at
// d60652a7058773fa9428fa720eda38942f12f014.
// Opt-in enrich is adapted from plugin/scripts/pre-tool-use.mjs: Cursor has no
// preToolUse additional_context, so enrichment returns here after the tool.

import {
  fetchEnrichContext,
  postJson,
  readConfig,
  readPayload,
  resolveProject,
  resolveSessionId,
  resolveToolInput,
  resolveToolName,
  resolveToolOutput,
  resolveWorkingDirectory,
  stripImageData,
  truncateValue,
  writeCursorOutput,
} from './shared.mjs';

async function main() {
  const payload = await readPayload();
  const config = readConfig();
  if (!payload || !config) return writeCursorOutput();

  const toolName = resolveToolName(payload);
  if (!toolName) return writeCursorOutput();

  const cwd = resolveWorkingDirectory(payload);
  const sessionId = resolveSessionId(payload);
  const project = resolveProject(cwd);
  const toolInput = resolveToolInput(payload);
  // Drop base64 image blobs: they bloat storage and add no useful recall text.
  const cleanOutput = stripImageData(resolveToolOutput(payload));

  const [, context] = await Promise.all([
    postJson(
      '/agentmemory/observe',
      {
        hookType: 'post_tool_use',
        sessionId,
        project,
        cwd,
        timestamp: new Date().toISOString(),
        data: {
          tool_name: toolName,
          tool_input: truncateValue(toolInput),
          tool_output: truncateValue(cleanOutput),
        },
      },
      { config },
    ),
    fetchEnrichContext({
      config,
      sessionId,
      project,
      toolName,
      toolInput,
    }),
  ]);

  writeCursorOutput(context ? { additional_context: context } : {});
}

main().catch(() => writeCursorOutput());
