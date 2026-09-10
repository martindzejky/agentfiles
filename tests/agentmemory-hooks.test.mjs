import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
// Hooks resolve the project from the checkout directory, so the expectation
// has to follow the clone name rather than assume this repository's own.
const PROJECT = basename(ROOT);
const HOOK_DIRECTORY = join(ROOT, 'hooks', 'agentmemory');
const HOOKS = {
  beforeSubmitPrompt: 'before-submit-prompt.mjs',
  afterAgentResponse: 'after-agent-response.mjs',
  postToolUse: 'post-tool-use.mjs',
  postToolUseFailure: 'post-tool-failure.mjs',
  subagentStart: 'subagent-start.mjs',
  subagentStop: 'subagent-stop.mjs',
};

function hookEnvironment(url, extra = {}) {
  const environment = { ...process.env };
  for (const key of Object.keys(environment)) {
    if (key.startsWith('AGENTMEMORY_')) delete environment[key];
  }
  environment.AGENTMEMORY_DISABLE_ENV_FILE = '1';

  if (url) {
    environment.AGENTMEMORY_URL = url;
    environment.AGENTMEMORY_SECRET = 'test-secret';
  }

  const merged = { ...environment, ...extra };
  if (!Object.hasOwn(extra, 'AGENTMEMORY_HOOK_LOG_DIR')) {
    merged.AGENTMEMORY_HOOK_LOG_DIR = join(
      tmpdir(),
      'agentmemory-hook-logs-test',
    );
  } else if (!extra.AGENTMEMORY_HOOK_LOG_DIR) {
    delete merged.AGENTMEMORY_HOOK_LOG_DIR;
  }
  return merged;
}

function runHook(event, payload, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [join(HOOK_DIRECTORY, HOOKS[event])],
      {
        cwd: ROOT,
        env: hookEnvironment(options.url, options.env),
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      resolve({ code, signal, stdout, stderr });
    });

    child.stdin.end(
      options.rawInput === undefined
        ? JSON.stringify(payload)
        : options.rawInput,
    );
  });
}

async function startMockServer(options = {}) {
  const requests = [];
  const server = http.createServer((request, response) => {
    let rawBody = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      rawBody += chunk;
    });
    request.on('end', () => {
      requests.push({
        path: request.url,
        authorization: request.headers.authorization,
        body: JSON.parse(rawBody),
      });

      if (options.hang) return;
      if (options.redirect) {
        response.writeHead(307, { Location: options.redirect });
        response.end();
        return;
      }

      const status = options.status ?? 200;
      const body = { success: status < 400 };
      response.writeHead(status, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(body));
    });
  });

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();

  return {
    requests,
    url: `http://127.0.0.1:${address.port}`,
    async close() {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

function assertSuccessfulNoOp(result) {
  assert.equal(result.code, 0);
  assert.equal(result.signal, null);
  assert.deepEqual(JSON.parse(result.stdout), {});
  assert.equal(result.stderr, '');
}

test('manifest contains exactly the selected executable hooks', async () => {
  const manifest = JSON.parse(await readFile(join(ROOT, 'hooks.json'), 'utf8'));

  assert.equal(manifest.version, 1);
  assert.deepEqual(
    Object.keys(manifest.hooks).sort(),
    Object.keys(HOOKS).sort(),
  );

  for (const [event, script] of Object.entries(HOOKS)) {
    assert.equal(manifest.hooks[event].length, 1);
    assert.equal(
      manifest.hooks[event][0].command,
      `./hooks/agentmemory/${script}`,
    );
    assert.equal(manifest.hooks[event][0].failClosed, false);
    assert.equal(manifest.hooks[event][0].type, undefined);
    await access(join(HOOK_DIRECTORY, script), constants.X_OK);
  }
});

test('sessionStart and enrich helpers are not shipped', async () => {
  await assert.rejects(() =>
    access(join(HOOK_DIRECTORY, 'session-start.mjs'), constants.F_OK),
  );
  const shared = await import(join(HOOK_DIRECTORY, 'shared.mjs'));
  assert.equal(shared.isContextInjectionEnabled, undefined);
  assert.equal(shared.fetchEnrichContext, undefined);
  assert.equal(shared.extractEnrichQuery, undefined);
  assert.equal(shared.CONTEXT_TIMEOUT_MS, undefined);
});

test('session id and workspace root fallbacks match Cursor plus plugin payloads', async () => {
  const {
    defaultHookLogDirectory,
    resolveAgentId,
    resolveSessionId,
    resolveWorkingDirectory,
  } = await import(join(HOOK_DIRECTORY, 'shared.mjs'));

  assert.equal(resolveAgentId({ conversation_id: 'cursor-session' }), 'cursor');
  assert.equal(
    resolveAgentId({
      session_id: 'thr_1',
      hook_event_name: 'UserPromptSubmit',
    }),
    'codex',
  );
  assert.equal(
    defaultHookLogDirectory({ hook_event_name: 'Stop' }).endsWith(
      join('.codex', 'hooks-logs'),
    ),
    true,
  );
  assert.equal(
    defaultHookLogDirectory({ conversation_id: 'c' }).endsWith(
      join('.cursor', 'hooks-logs'),
    ),
    true,
  );

  assert.equal(
    resolveSessionId({
      session_id: 'snake-session',
      sessionId: 'camel-session',
      conversation_id: 'conversation-id',
    }),
    'snake-session',
  );
  assert.equal(
    resolveSessionId({
      sessionId: 'camel-session',
      conversation_id: 'conversation-id',
    }),
    'camel-session',
  );
  assert.equal(
    resolveSessionId({ conversation_id: 'conversation-id' }),
    'conversation-id',
  );
  assert.equal(
    resolveSessionId({ parent_conversation_id: 'parent-session' }),
    'parent-session',
  );

  assert.equal(
    resolveWorkingDirectory({
      workspace_roots: ['', '   ', ROOT],
      cwd: '/should-not-win',
    }),
    ROOT,
  );
  assert.equal(
    resolveWorkingDirectory({
      workspace_roots: ['', null],
      cwd: ROOT,
    }),
    ROOT,
  );
});

test('HTTP timeouts fit inside Cursor hook budgets', async () => {
  const { REQUEST_TIMEOUT_MS } = await import(
    join(HOOK_DIRECTORY, 'shared.mjs')
  );
  const manifest = JSON.parse(await readFile(join(ROOT, 'hooks.json'), 'utf8'));

  assert.equal(REQUEST_TIMEOUT_MS, 2_500);
  assert.ok(
    REQUEST_TIMEOUT_MS < manifest.hooks.beforeSubmitPrompt[0].timeout * 1000,
  );
  assert.ok(REQUEST_TIMEOUT_MS < manifest.hooks.postToolUse[0].timeout * 1000);
});

test('beforeSubmitPrompt accepts camelCase sessionId and skips blank workspace roots', async () => {
  const server = await startMockServer();
  try {
    const result = await runHook(
      'beforeSubmitPrompt',
      {
        sessionId: 'camel-session',
        workspace_roots: ['', ROOT],
        cwd: '/should-not-win',
        prompt: 'plugin-shaped payload',
      },
      { url: server.url },
    );

    assertSuccessfulNoOp(result);
    assert.equal(server.requests.length, 1);
    assert.equal(server.requests[0].body.sessionId, 'camel-session');
    assert.equal(server.requests[0].body.cwd, ROOT);
    assert.equal(server.requests[0].body.project, PROJECT);
  } finally {
    await server.close();
  }
});

test('beforeSubmitPrompt records only the prompt and never resets the session', async () => {
  const server = await startMockServer();
  const prompt = `prompt-${'p'.repeat(10_050)}`;
  try {
    const result = await runHook(
      'beforeSubmitPrompt',
      {
        conversation_id: 'conversation-id',
        workspace_roots: [ROOT],
        prompt,
        text: 'do not capture this response',
        thought: 'do not capture this thought',
        tool_input: { command: 'do not capture this tool' },
      },
      { url: server.url },
    );

    assertSuccessfulNoOp(result);
    // /session/start overwrites the whole session record upstream, so the
    // prompt hook must never call it. observe creates the session instead.
    assert.deepEqual(
      server.requests.map((request) => request.path),
      ['/agentmemory/observe'],
    );
    const [observe] = server.requests;
    assert.deepEqual(Object.keys(observe.body.data), ['prompt']);
    assert.equal(observe.body.data.prompt.length, 10_000);
    assert.equal(observe.body.hookType, 'prompt_submit');
    assert.equal(observe.body.sessionId, 'conversation-id');
    assert.equal(observe.body.project, PROJECT);
    assert.equal(observe.body.cwd, ROOT);
    assert.equal(observe.body.agentId, 'cursor');
    assert.match(observe.body.timestamp, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(typeof observe.body.eventId, 'string');
    assert.ok(observe.body.eventId.length > 0);
    assert.equal(observe.body.data.tool_input, undefined);
    assert.equal(result.stdout.includes('prompt-'), false);
  } finally {
    await server.close();
  }
});

test('afterAgentResponse posts assistant_response with assistantResponse', async () => {
  const server = await startMockServer();
  const response = `response-${'r'.repeat(10_050)}`;
  try {
    const result = await runHook(
      'afterAgentResponse',
      {
        conversation_id: 'response-session',
        workspace_roots: [ROOT],
        text: response,
        thought: 'private reasoning',
        prompt: 'do not read this undeclared field',
      },
      { url: server.url },
    );

    assertSuccessfulNoOp(result);
    assert.equal(server.requests.length, 1);
    const [observe] = server.requests;
    assert.equal(observe.path, '/agentmemory/observe');
    assert.equal(observe.body.hookType, 'assistant_response');
    assert.deepEqual(Object.keys(observe.body.data), ['assistantResponse']);
    assert.equal(observe.body.data.assistantResponse.length, 10_000);
    assert.equal(observe.body.sessionId, 'response-session');
    assert.equal(observe.body.project, PROJECT);
    assert.equal(observe.body.cwd, ROOT);
    assert.equal(observe.body.agentId, 'cursor');
    assert.equal(typeof observe.body.eventId, 'string');
    assert.ok(observe.body.eventId.length > 0);
    assert.equal(observe.body.data.tool_name, undefined);
    assert.equal(observe.body.data.tool_input, undefined);
    assert.equal(observe.body.data.tool_output, undefined);
    assert.equal(result.stdout.includes('response-'), false);
  } finally {
    await server.close();
  }
});

test('repeated prompts keep distinct eventIds and never reset the session', async () => {
  const server = await startMockServer();
  try {
    for (const prompt of ['continue', 'continue']) {
      const result = await runHook(
        'beforeSubmitPrompt',
        {
          conversation_id: 'conversation-id',
          workspace_roots: [ROOT],
          prompt,
        },
        { url: server.url },
      );
      assertSuccessfulNoOp(result);
    }

    assert.deepEqual(
      server.requests.map((request) => request.path),
      ['/agentmemory/observe', '/agentmemory/observe'],
    );
    const [first, second] = server.requests;
    // Same prompt content is fine; ingest idempotency keys on eventId only.
    assert.equal(first.body.data.prompt, second.body.data.prompt);
    assert.equal(first.body.data.prompt, 'continue');
    assert.deepEqual(Object.keys(first.body.data), ['prompt']);
    assert.deepEqual(Object.keys(second.body.data), ['prompt']);
    assert.notEqual(first.body.timestamp, second.body.timestamp);
    assert.equal(typeof first.body.eventId, 'string');
    assert.equal(typeof second.body.eventId, 'string');
    assert.ok(first.body.eventId.length > 0);
    assert.ok(second.body.eventId.length > 0);
    assert.notEqual(first.body.eventId, second.body.eventId);
  } finally {
    await server.close();
  }
});

test('postToolUse strips base64 image blobs from tool_output', async () => {
  const server = await startMockServer();
  const png =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  try {
    assertSuccessfulNoOp(
      await runHook(
        'postToolUse',
        {
          conversation_id: 'image-session',
          workspace_roots: [ROOT],
          tool_name: 'Read',
          tool_input: { path: 'shot.png' },
          tool_output: { screenshot: png, note: 'ok' },
        },
        { url: server.url },
      ),
    );

    const [observe] = server.requests;
    assert.equal(
      observe.body.data.tool_output.screenshot,
      '[image data omitted]',
    );
    assert.equal(observe.body.data.tool_output.note, 'ok');
    assert.equal(observe.body.data.image_data, undefined);
  } finally {
    await server.close();
  }
});

test('postToolUse strips base64 image blobs nested in arrays and sub-objects', async () => {
  const server = await startMockServer();
  const jpeg = '/9j/4AAQSkZJRgABAQAAAQABAAD';
  try {
    assertSuccessfulNoOp(
      await runHook(
        'postToolUse',
        {
          conversation_id: 'nested-image-session',
          workspace_roots: [ROOT],
          tool_name: 'Browser',
          tool_input: { action: 'screenshot' },
          tool_output: {
            content: [{ type: 'image', data: jpeg }],
            result: { thumbnail: jpeg, label: 'keep me' },
          },
        },
        { url: server.url },
      ),
    );

    const [observe] = server.requests;
    const output = observe.body.data.tool_output;
    assert.equal(output.content[0].data, '[image data omitted]');
    assert.equal(output.content[0].type, 'image');
    assert.equal(output.result.thumbnail, '[image data omitted]');
    assert.equal(output.result.label, 'keep me');
  } finally {
    await server.close();
  }
});

test('postToolUse records truncated tool observations', async () => {
  const server = await startMockServer();
  const huge = 'x'.repeat(10_050);
  try {
    assertSuccessfulNoOp(
      await runHook(
        'postToolUse',
        {
          conversation_id: 'tool-session',
          workspace_roots: [ROOT],
          tool_name: 'Shell',
          tool_input: { command: 'npm test', working_directory: ROOT },
          tool_output: huge,
        },
        { url: server.url },
      ),
    );

    assert.equal(server.requests.length, 1);
    const [observe] = server.requests;
    assert.equal(observe.path, '/agentmemory/observe');
    assert.equal(observe.body.hookType, 'post_tool_use');
    assert.equal(observe.body.agentId, 'cursor');
    assert.equal(observe.body.sessionId, 'tool-session');
    assert.equal(observe.body.project, PROJECT);
    assert.equal(observe.body.cwd, ROOT);
    assert.equal(observe.body.data.tool_name, 'Shell');
    assert.deepEqual(observe.body.data.tool_input, {
      command: 'npm test',
      working_directory: ROOT,
    });
    assert.equal(typeof observe.body.data.tool_output, 'string');
    assert.ok(observe.body.data.tool_output.endsWith('[...truncated]'));
    assert.equal(
      observe.body.data.tool_output.length,
      10_000 + '\n[...truncated]'.length,
    );
    assert.equal(typeof observe.body.eventId, 'string');
    assert.ok(observe.body.eventId.length > 0);
  } finally {
    await server.close();
  }
});

test('postToolUse never enriches or injects context', async () => {
  const server = await startMockServer();
  try {
    assertSuccessfulNoOp(
      await runHook(
        'postToolUse',
        {
          conversation_id: 'capture-only-session',
          workspace_roots: [ROOT],
          tool_name: 'Read',
          tool_input: { path: 'hooks/agentmemory/shared.mjs' },
          tool_output: 'ok',
        },
        {
          url: server.url,
          env: { AGENTMEMORY_INJECT_CONTEXT: 'true' },
        },
      ),
    );
    assertSuccessfulNoOp(
      await runHook(
        'postToolUse',
        {
          conversation_id: 'capture-only-session',
          workspace_roots: [ROOT],
          tool_name: 'StrReplace',
          tool_input: { filePath: 'README.md' },
          tool_output: 'ok',
        },
        {
          url: server.url,
          env: { AGENTMEMORY_INJECT_CONTEXT: 'true' },
        },
      ),
    );
    assertSuccessfulNoOp(
      await runHook(
        'postToolUse',
        {
          conversation_id: 'capture-only-session',
          workspace_roots: [ROOT],
          tool_name: 'Shell',
          tool_input: { command: 'ls' },
          tool_output: 'ok',
        },
        { url: server.url },
      ),
    );

    assert.equal(server.requests.length, 3);
    for (const request of server.requests) {
      assert.equal(request.path, '/agentmemory/observe');
      assert.equal(request.body.hookType, 'post_tool_use');
    }
    assert.equal(server.requests[0].body.data.tool_name, 'Read');
    assert.equal(server.requests[1].body.data.tool_name, 'StrReplace');
    assert.equal(server.requests[2].body.data.tool_name, 'Shell');
  } finally {
    await server.close();
  }
});

test('postToolUseFailure records errors and skips interrupts', async () => {
  const server = await startMockServer();
  try {
    assertSuccessfulNoOp(
      await runHook(
        'postToolUseFailure',
        {
          conversation_id: 'tool-fail-session',
          workspace_roots: [ROOT],
          tool_name: 'Shell',
          tool_input: { command: 'npm test' },
          error_message: 'Command timed out after 30s',
          failure_type: 'timeout',
        },
        { url: server.url },
      ),
    );

    assert.equal(server.requests.length, 1);
    assert.equal(server.requests[0].body.hookType, 'post_tool_failure');
    assert.equal(server.requests[0].body.data.tool_name, 'Shell');
    assert.equal(
      server.requests[0].body.data.error,
      'Command timed out after 30s',
    );
    assert.equal(server.requests[0].body.data.failure_type, 'timeout');
    assert.equal(server.requests[0].body.agentId, 'cursor');
    assert.equal(typeof server.requests[0].body.eventId, 'string');
    assert.ok(server.requests[0].body.eventId.length > 0);

    assertSuccessfulNoOp(
      await runHook(
        'postToolUseFailure',
        {
          conversation_id: 'tool-fail-session',
          workspace_roots: [ROOT],
          tool_name: 'Shell',
          tool_input: { command: 'npm test' },
          error_message: 'interrupted',
          is_interrupt: true,
        },
        { url: server.url },
      ),
    );
    assert.equal(server.requests.length, 1);
  } finally {
    await server.close();
  }
});

test('subagentStart posts native subagent_start data keys', async () => {
  const server = await startMockServer();
  try {
    assertSuccessfulNoOp(
      await runHook(
        'subagentStart',
        {
          parent_conversation_id: 'parent-session',
          workspace_roots: [ROOT],
          subagent_id: 'abc-123',
          subagent_type: 'explore',
          task: 'Explore the authentication flow',
        },
        { url: server.url },
      ),
    );

    assert.equal(server.requests.length, 1);
    const [observe] = server.requests;
    assert.equal(observe.path, '/agentmemory/observe');
    assert.equal(observe.body.hookType, 'subagent_start');
    assert.equal(observe.body.sessionId, 'parent-session');
    assert.equal(observe.body.agentId, 'cursor');
    assert.equal(observe.body.project, PROJECT);
    assert.deepEqual(observe.body.data, {
      subagent_id: 'abc-123',
      subagent_type: 'explore',
      task: 'Explore the authentication flow',
    });
    assert.equal(observe.body.data.tool_name, undefined);
    assert.equal(typeof observe.body.eventId, 'string');
    assert.ok(observe.body.eventId.length > 0);
  } finally {
    await server.close();
  }
});

test('subagentStart omits blank task', async () => {
  const server = await startMockServer();
  try {
    assertSuccessfulNoOp(
      await runHook(
        'subagentStart',
        {
          conversation_id: 'parent-session',
          workspace_roots: [ROOT],
          subagent_type: 'explore',
          task: '',
        },
        { url: server.url },
      ),
    );

    assert.equal(server.requests.length, 1);
    assert.equal(server.requests[0].body.hookType, 'subagent_start');
    assert.deepEqual(server.requests[0].body.data, {
      subagent_type: 'explore',
    });
  } finally {
    await server.close();
  }
});

test('subagent start and stop use distinct native hookTypes', async () => {
  const server = await startMockServer();
  try {
    assertSuccessfulNoOp(
      await runHook(
        'subagentStart',
        {
          conversation_id: 'parent-session',
          workspace_roots: [ROOT],
          subagent_id: 'same-id',
          subagent_type: 'explore',
          task: 'look around',
        },
        { url: server.url },
      ),
    );
    assertSuccessfulNoOp(
      await runHook(
        'subagentStop',
        {
          conversation_id: 'parent-session',
          workspace_roots: [ROOT],
          subagent_id: 'same-id',
          subagent_type: 'explore',
          status: 'completed',
          summary: 'found it',
        },
        { url: server.url },
      ),
    );

    assert.equal(server.requests.length, 2);
    assert.equal(server.requests[0].body.hookType, 'subagent_start');
    assert.equal(server.requests[1].body.hookType, 'subagent_stop');
    assert.deepEqual(server.requests[0].body.data, {
      subagent_id: 'same-id',
      subagent_type: 'explore',
      task: 'look around',
    });
    assert.deepEqual(server.requests[1].body.data, {
      subagent_id: 'same-id',
      subagent_type: 'explore',
      status: 'completed',
      summary: 'found it',
    });
    assert.notEqual(
      server.requests[0].body.hookType,
      server.requests[1].body.hookType,
    );
  } finally {
    await server.close();
  }
});

test('subagentStop posts native subagent_stop data keys', async () => {
  const server = await startMockServer();
  try {
    assertSuccessfulNoOp(
      await runHook(
        'subagentStop',
        {
          conversation_id: 'parent-session',
          workspace_roots: [ROOT],
          subagent_type: 'generalPurpose',
          status: 'completed',
          task: 'Explore the authentication flow',
          summary: 'Auth lives in src/auth.ts',
        },
        { url: server.url },
      ),
    );

    assert.equal(server.requests.length, 1);
    const [observe] = server.requests;
    assert.equal(observe.body.hookType, 'subagent_stop');
    assert.equal(observe.body.sessionId, 'parent-session');
    assert.deepEqual(observe.body.data, {
      subagent_type: 'generalPurpose',
      task: 'Explore the authentication flow',
      status: 'completed',
      summary: 'Auth lives in src/auth.ts',
    });
    assert.equal(observe.body.data.tool_name, undefined);
    assert.equal(observe.body.agentId, 'cursor');
    assert.equal(typeof observe.body.eventId, 'string');
    assert.ok(observe.body.eventId.length > 0);
  } finally {
    await server.close();
  }
});

test('subagentStop falls back to last_assistant_message for summary', async () => {
  const server = await startMockServer();
  try {
    assertSuccessfulNoOp(
      await runHook(
        'subagentStop',
        {
          conversation_id: 'parent-session',
          workspace_roots: [ROOT],
          subagent_id: 'fallback-id',
          subagent_type: 'explore',
          last_assistant_message: 'legacy summary field',
        },
        { url: server.url },
      ),
    );

    assert.deepEqual(server.requests[0].body.data, {
      subagent_id: 'fallback-id',
      subagent_type: 'explore',
      summary: 'legacy summary field',
    });
  } finally {
    await server.close();
  }
});

test('every observe POST sends a unique non-empty top-level eventId', async () => {
  const server = await startMockServer();
  const sessionId = 'event-id-session';
  try {
    const payloads = {
      beforeSubmitPrompt: {
        conversation_id: sessionId,
        workspace_roots: [ROOT],
        prompt: 'event id prompt',
      },
      afterAgentResponse: {
        conversation_id: sessionId,
        workspace_roots: [ROOT],
        text: 'event id response',
      },
      postToolUse: {
        conversation_id: sessionId,
        workspace_roots: [ROOT],
        tool_name: 'Read',
        tool_input: { path: 'README.md' },
        tool_output: 'ok',
      },
      postToolUseFailure: {
        conversation_id: sessionId,
        workspace_roots: [ROOT],
        tool_name: 'Shell',
        tool_input: { command: 'false' },
        error_message: 'exit 1',
        failure_type: 'error',
      },
      subagentStart: {
        conversation_id: sessionId,
        workspace_roots: [ROOT],
        subagent_id: 'sub-1',
        subagent_type: 'explore',
        task: 'look around',
      },
      subagentStop: {
        conversation_id: sessionId,
        workspace_roots: [ROOT],
        subagent_type: 'explore',
        status: 'completed',
        summary: 'done',
      },
    };

    for (const [event, payload] of Object.entries(payloads)) {
      assertSuccessfulNoOp(await runHook(event, payload, { url: server.url }));
    }

    // Second beforeSubmitPrompt proves two invocations get different ids.
    assertSuccessfulNoOp(
      await runHook(
        'beforeSubmitPrompt',
        {
          conversation_id: sessionId,
          workspace_roots: [ROOT],
          prompt: 'event id prompt again',
        },
        { url: server.url },
      ),
    );

    const observes = server.requests.filter(
      (request) => request.path === '/agentmemory/observe',
    );
    assert.equal(observes.length, Object.keys(payloads).length + 1);
    assert.equal(server.requests.length, observes.length);

    assert.deepEqual(
      observes.map((request) => request.body.hookType),
      [
        'prompt_submit',
        'assistant_response',
        'post_tool_use',
        'post_tool_failure',
        'subagent_start',
        'subagent_stop',
        'prompt_submit',
      ],
    );
    assert.equal(observes[0].body.data.prompt, 'event id prompt');
    assert.equal(observes[1].body.data.assistantResponse, 'event id response');
    assert.equal(observes[2].body.data.tool_name, 'Read');
    assert.equal(observes[3].body.data.tool_name, 'Shell');
    assert.deepEqual(observes[4].body.data, {
      subagent_id: 'sub-1',
      subagent_type: 'explore',
      task: 'look around',
    });
    assert.deepEqual(observes[5].body.data, {
      subagent_type: 'explore',
      status: 'completed',
      summary: 'done',
    });
    assert.equal(observes[6].body.data.prompt, 'event id prompt again');

    const eventIds = observes.map((request) => request.body.eventId);
    for (const request of observes) {
      assert.equal(typeof request.body.eventId, 'string');
      assert.ok(request.body.eventId.length > 0);
      assert.equal(request.body.data?.eventId, undefined);
    }
    assert.equal(new Set(eventIds).size, eventIds.length);
  } finally {
    await server.close();
  }
});

test('every hook REST body hardcodes agentId cursor', async () => {
  const server = await startMockServer();
  try {
    const payloads = {
      beforeSubmitPrompt: {
        conversation_id: 'agent-id-session',
        workspace_roots: [ROOT],
        prompt: 'tag me',
      },
      afterAgentResponse: {
        conversation_id: 'agent-id-session',
        workspace_roots: [ROOT],
        text: 'tagged response',
      },
      postToolUse: {
        conversation_id: 'agent-id-session',
        workspace_roots: [ROOT],
        tool_name: 'Read',
        tool_input: { path: 'README.md' },
        tool_output: 'ok',
      },
      postToolUseFailure: {
        conversation_id: 'agent-id-session',
        workspace_roots: [ROOT],
        tool_name: 'Shell',
        tool_input: { command: 'false' },
        error_message: 'exit 1',
        failure_type: 'error',
      },
      subagentStart: {
        conversation_id: 'agent-id-session',
        workspace_roots: [ROOT],
        subagent_id: 'sub-1',
        subagent_type: 'explore',
        task: 'look around',
      },
      subagentStop: {
        conversation_id: 'agent-id-session',
        workspace_roots: [ROOT],
        subagent_type: 'explore',
        status: 'completed',
        summary: 'done',
      },
    };

    for (const [event, payload] of Object.entries(payloads)) {
      assertSuccessfulNoOp(await runHook(event, payload, { url: server.url }));
    }

    assert.ok(server.requests.length >= Object.keys(payloads).length);
    for (const request of server.requests) {
      assert.equal(request.body.agentId, 'cursor');
    }
  } finally {
    await server.close();
  }
});

test('Codex lifecycle payloads tag agentId codex', async () => {
  const server = await startMockServer();
  try {
    assertSuccessfulNoOp(
      await runHook(
        'beforeSubmitPrompt',
        {
          session_id: 'thr_codex',
          cwd: ROOT,
          hook_event_name: 'UserPromptSubmit',
          prompt: 'codex prompt',
        },
        { url: server.url },
      ),
    );
    assertSuccessfulNoOp(
      await runHook(
        'afterAgentResponse',
        {
          session_id: 'thr_codex',
          cwd: ROOT,
          hook_event_name: 'Stop',
          last_assistant_message: 'codex reply',
        },
        { url: server.url },
      ),
    );
    assertSuccessfulNoOp(
      await runHook(
        'postToolUse',
        {
          session_id: 'thr_codex',
          cwd: ROOT,
          hook_event_name: 'PostToolUse',
          tool_name: 'Bash',
          tool_input: { command: 'ls' },
          tool_response: 'ok',
        },
        { url: server.url },
      ),
    );
    assertSuccessfulNoOp(
      await runHook(
        'subagentStart',
        {
          session_id: 'thr_codex',
          cwd: ROOT,
          hook_event_name: 'SubagentStart',
          agent_id: 'agent-1',
          agent_type: 'explore',
        },
        { url: server.url },
      ),
    );
    assertSuccessfulNoOp(
      await runHook(
        'subagentStop',
        {
          session_id: 'thr_codex',
          cwd: ROOT,
          hook_event_name: 'SubagentStop',
          agent_id: 'agent-1',
          agent_type: 'explore',
          last_assistant_message: 'subagent done',
        },
        { url: server.url },
      ),
    );

    assert.equal(server.requests.length, 5);
    for (const request of server.requests) {
      assert.equal(request.body.agentId, 'codex');
      assert.equal(request.body.sessionId, 'thr_codex');
    }
    assert.equal(server.requests[0].body.data.prompt, 'codex prompt');
    assert.equal(server.requests[1].body.data.assistantResponse, 'codex reply');
    assert.equal(server.requests[2].body.data.tool_name, 'Bash');
    assert.equal(server.requests[2].body.data.tool_output, 'ok');
    assert.deepEqual(server.requests[3].body.data, {
      subagent_id: 'agent-1',
      subagent_type: 'explore',
    });
    assert.deepEqual(server.requests[4].body.data, {
      subagent_id: 'agent-1',
      subagent_type: 'explore',
      summary: 'subagent done',
    });
  } finally {
    await server.close();
  }
});

test('observe sends sessionId project cwd agentId', async () => {
  const server = await startMockServer();
  try {
    assertSuccessfulNoOp(
      await runHook(
        'beforeSubmitPrompt',
        {
          conversation_id: 'identity-session',
          workspace_roots: [ROOT],
          prompt: 'identity prompt',
        },
        { url: server.url },
      ),
    );
    assertSuccessfulNoOp(
      await runHook(
        'postToolUse',
        {
          conversation_id: 'identity-session',
          workspace_roots: [ROOT],
          tool_name: 'Read',
          tool_input: { path: 'hooks/agentmemory/shared.mjs' },
          tool_output: 'ok',
        },
        { url: server.url },
      ),
    );

    assert.equal(server.requests.length, 2);
    for (const request of server.requests) {
      assert.equal(request.path, '/agentmemory/observe');
      assert.equal(request.body.sessionId, 'identity-session');
      assert.equal(request.body.project, PROJECT);
      assert.equal(request.body.cwd, ROOT);
      assert.equal(request.body.agentId, 'cursor');
    }
  } finally {
    await server.close();
  }
});

test('hooks load local env files without overriding inherited values', async () => {
  const server = await startMockServer();
  const directory = await mkdtemp(join(tmpdir(), 'agentmemory-hooks-'));
  const envFile = join(directory, '.env');

  try {
    await writeFile(
      envFile,
      [
        `AGENTMEMORY_URL=${server.url}`,
        'AGENTMEMORY_SECRET=env-file-secret',
        'AGENTMEMORY_PROJECT_NAME=env-file-project',
      ].join('\n'),
      { mode: 0o600 },
    );

    const fromFile = await runHook(
      'beforeSubmitPrompt',
      {
        conversation_id: 'env-file-session',
        workspace_roots: [ROOT],
        prompt: 'load env from file',
      },
      {
        env: {
          AGENTMEMORY_DISABLE_ENV_FILE: '0',
          AGENTMEMORY_ENV_FILE: envFile,
        },
      },
    );
    assertSuccessfulNoOp(fromFile);
    assert.equal(server.requests[0].authorization, 'Bearer env-file-secret');

    const inherited = await runHook(
      'beforeSubmitPrompt',
      {
        conversation_id: 'inherited-env-session',
        workspace_roots: [ROOT],
        prompt: 'inherited values win',
      },
      {
        url: server.url,
        env: {
          AGENTMEMORY_DISABLE_ENV_FILE: '0',
          AGENTMEMORY_ENV_FILE: envFile,
          AGENTMEMORY_PROJECT_NAME: 'inherited-project',
        },
      },
    );
    assertSuccessfulNoOp(inherited);
    const inheritedRequests = server.requests.slice(1);
    assert.equal(inheritedRequests.length, 1);
    for (const request of inheritedRequests) {
      assert.equal(request.authorization, 'Bearer test-secret');
      assert.equal(request.body.project, 'inherited-project');
    }
  } finally {
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('every hook appends the received payload to a per-session jsonl log', async () => {
  const logDir = await mkdtemp(join(tmpdir(), 'agentmemory-hook-logs-'));
  const sessionId = 'log-session';
  const payloads = {
    beforeSubmitPrompt: {
      conversation_id: sessionId,
      prompt: 'logged prompt',
    },
    afterAgentResponse: {
      conversation_id: sessionId,
      text: 'logged response',
    },
    postToolUse: {
      conversation_id: sessionId,
      tool_name: 'Read',
      tool_input: { path: 'README.md' },
      tool_output: 'ok',
    },
    postToolUseFailure: {
      conversation_id: sessionId,
      tool_name: 'Shell',
      tool_input: { command: 'false' },
      error_message: 'exit 1',
    },
    subagentStart: {
      conversation_id: sessionId,
      subagent_id: 'sub-1',
      subagent_type: 'explore',
      task: 'look around',
    },
    subagentStop: {
      conversation_id: sessionId,
      subagent_type: 'explore',
      status: 'completed',
      summary: 'done',
    },
  };

  try {
    for (const [event, payload] of Object.entries(payloads)) {
      assertSuccessfulNoOp(
        await runHook(event, payload, {
          env: { AGENTMEMORY_HOOK_LOG_DIR: logDir },
        }),
      );
    }

    const lines = (await readFile(join(logDir, `${sessionId}.jsonl`), 'utf8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    assert.equal(lines.length, Object.keys(payloads).length);
    assert.deepEqual(
      lines.map((line) => line.hook),
      Object.keys(payloads),
    );
    for (const [index, event] of Object.keys(payloads).entries()) {
      assert.match(lines[index].ts, /^\d{4}-\d{2}-\d{2}T/);
      assert.deepEqual(lines[index].payload, payloads[event]);
    }

    assertSuccessfulNoOp(
      await runHook('beforeSubmitPrompt', null, {
        rawInput: '{invalid json',
        env: { AGENTMEMORY_HOOK_LOG_DIR: logDir },
      }),
    );
    const unknown = (await readFile(join(logDir, 'unknown.jsonl'), 'utf8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    assert.equal(unknown.length, 1);
    assert.equal(unknown[0].hook, 'beforeSubmitPrompt');
    assert.equal(unknown[0].payload, null);

    assertSuccessfulNoOp(
      await runHook(
        'afterAgentResponse',
        { conversation_id: 'other-session', text: 'hi' },
        { env: { AGENTMEMORY_HOOK_LOG_DIR: logDir } },
      ),
    );
    await access(join(logDir, 'other-session.jsonl'), constants.F_OK);
  } finally {
    await rm(logDir, { recursive: true, force: true });
  }
});

test('hook logging fails open when the log directory is unusable', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'agentmemory-hook-logs-'));
  const blocked = join(directory, 'not-a-dir');
  await writeFile(blocked, 'file');
  try {
    assertSuccessfulNoOp(
      await runHook(
        'beforeSubmitPrompt',
        { conversation_id: 'blocked-log', prompt: 'still works' },
        { env: { AGENTMEMORY_HOOK_LOG_DIR: blocked } },
      ),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('hooks load AGENTMEMORY_HOOK_LOG_DIR from the local env file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'agentmemory-hooks-'));
  const logDir = join(directory, 'from-env-file');
  const envFile = join(directory, '.env');

  try {
    await writeFile(envFile, `AGENTMEMORY_HOOK_LOG_DIR=${logDir}\n`, {
      mode: 0o600,
    });
    assertSuccessfulNoOp(
      await runHook(
        'beforeSubmitPrompt',
        { conversation_id: 'env-log-dir', prompt: 'from file' },
        {
          env: {
            AGENTMEMORY_DISABLE_ENV_FILE: '0',
            AGENTMEMORY_ENV_FILE: envFile,
            AGENTMEMORY_HOOK_LOG_DIR: null,
          },
        },
      ),
    );
    const [line] = (await readFile(join(logDir, 'env-log-dir.jsonl'), 'utf8'))
      .trim()
      .split('\n')
      .map((entry) => JSON.parse(entry));
    assert.equal(line.hook, 'beforeSubmitPrompt');
    assert.equal(line.payload.prompt, 'from file');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('hook logs strip images and cap oversized payloads', async () => {
  const logDir = await mkdtemp(join(tmpdir(), 'agentmemory-hook-logs-'));
  const png =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  try {
    assertSuccessfulNoOp(
      await runHook(
        'postToolUse',
        {
          conversation_id: 'cap-session',
          tool_name: 'Read',
          tool_input: { path: 'shot.png' },
          tool_output: { screenshot: png, note: 'ok' },
        },
        { env: { AGENTMEMORY_HOOK_LOG_DIR: logDir } },
      ),
    );
    const [imageLine] = (
      await readFile(join(logDir, 'cap-session.jsonl'), 'utf8')
    )
      .trim()
      .split('\n')
      .map((entry) => JSON.parse(entry));
    assert.equal(
      imageLine.payload.tool_output.screenshot,
      '[image data omitted]',
    );
    assert.equal(imageLine.payload.tool_output.note, 'ok');

    assertSuccessfulNoOp(
      await runHook(
        'postToolUse',
        {
          conversation_id: 'huge-session',
          tool_name: 'Read',
          tool_input: { path: 'big.txt' },
          tool_output: 'x'.repeat(20_000),
        },
        { env: { AGENTMEMORY_HOOK_LOG_DIR: logDir } },
      ),
    );
    const [hugeLine] = (
      await readFile(join(logDir, 'huge-session.jsonl'), 'utf8')
    )
      .trim()
      .split('\n')
      .map((entry) => JSON.parse(entry));
    assert.equal(typeof hugeLine.payload, 'string');
    assert.ok(hugeLine.payload.endsWith('...[truncated]'));
    assert.ok(hugeLine.payload.length < 20_000);
  } finally {
    await rm(logDir, { recursive: true, force: true });
  }
});

test('all hooks fail open for missing configuration and invalid JSON', async () => {
  for (const event of Object.keys(HOOKS)) {
    assertSuccessfulNoOp(
      await runHook(event, { conversation_id: 'missing-config' }),
    );
    assertSuccessfulNoOp(
      await runHook(event, null, { rawInput: '{invalid json' }),
    );
  }
});

test('all hooks fail open on HTTP errors without leaking content', async () => {
  const server = await startMockServer({ status: 401 });
  try {
    const results = await Promise.all(
      Object.keys(HOOKS).map((event) =>
        runHook(
          event,
          {
            conversation_id: 'secret-session',
            workspace_roots: [ROOT],
            prompt: 'secret prompt content',
            text: 'secret response content',
          },
          { url: server.url },
        ),
      ),
    );

    for (const result of results) {
      assertSuccessfulNoOp(result);
      assert.equal(result.stdout.includes('secret'), false);
      assert.equal(result.stderr.includes('secret'), false);
      assert.equal(result.stdout.includes('test-secret'), false);
      assert.equal(result.stderr.includes('test-secret'), false);
    }
  } finally {
    await server.close();
  }
});

test('all hooks fail open when requests time out', async () => {
  const server = await startMockServer({ hang: true });
  try {
    const results = await Promise.all(
      Object.keys(HOOKS).map((event) =>
        runHook(
          event,
          {
            conversation_id: 'timeout-session',
            workspace_roots: [ROOT],
            prompt: 'timeout prompt',
            text: 'timeout response',
          },
          { url: server.url },
        ),
      ),
    );

    for (const result of results) assertSuccessfulNoOp(result);
  } finally {
    await server.close();
  }
});

test('hooks reject redirects without forwarding captured content', async () => {
  const target = await startMockServer();
  const redirect = await startMockServer({
    redirect: `${target.url}/redirected`,
  });
  try {
    const result = await runHook(
      'afterAgentResponse',
      {
        conversation_id: 'redirect-session',
        workspace_roots: [ROOT],
        text: 'must not follow the redirect',
      },
      { url: redirect.url },
    );

    assertSuccessfulNoOp(result);
    assert.equal(redirect.requests.length, 1);
    assert.equal(target.requests.length, 0);
  } finally {
    await redirect.close();
    await target.close();
  }
});

test('configuration requires a secret and restricts plain HTTP', async () => {
  const original = { ...process.env };
  process.env.AGENTMEMORY_DISABLE_ENV_FILE = '1';
  const { readConfig } = await import(join(HOOK_DIRECTORY, 'shared.mjs'));

  try {
    process.env.AGENTMEMORY_URL = 'http://127.0.0.1:3111';
    delete process.env.AGENTMEMORY_SECRET;
    assert.equal(readConfig(), null);

    process.env.AGENTMEMORY_SECRET = 'test-secret';
    delete process.env.AGENTMEMORY_REQUIRE_HTTPS;
    assert.equal(readConfig().baseUrl, 'http://127.0.0.1:3111');

    process.env.AGENTMEMORY_REQUIRE_HTTPS = '1';
    assert.equal(readConfig(), null);

    delete process.env.AGENTMEMORY_REQUIRE_HTTPS;
    process.env.AGENTMEMORY_URL = 'http://memory.example.test';
    assert.equal(readConfig(), null);

    process.env.AGENTMEMORY_URL = 'https://memory.example.test';
    assert.equal(readConfig().baseUrl, 'https://memory.example.test');

    process.env.AGENTMEMORY_URL = 'https://user:password@memory.example.test';
    assert.equal(readConfig(), null);
  } finally {
    for (const key of Object.keys(process.env)) {
      if (!(key in original)) delete process.env[key];
    }
    Object.assign(process.env, original);
  }
});
