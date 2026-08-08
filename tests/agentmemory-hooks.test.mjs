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
  sessionStart: 'session-start.mjs',
  beforeSubmitPrompt: 'before-submit-prompt.mjs',
  afterAgentResponse: 'after-agent-response.mjs',
  preCompact: 'pre-compact.mjs',
  stop: 'stop.mjs',
  sessionEnd: 'session-end.mjs',
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

  return { ...environment, ...extra };
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
      const body =
        request.url === '/agentmemory/session/start' && options.context
          ? { context: options.context }
          : { success: status < 400 };
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

test('manifest contains exactly the six selected executable hooks', async () => {
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

test('sessionStart registers and emits only Cursor additional_context JSON', async () => {
  const server = await startMockServer({ context: 'restored memory context' });
  try {
    const result = await runHook(
      'sessionStart',
      {
        session_id: 'session-id',
        conversation_id: 'conversation-id',
        workspace_roots: [ROOT],
      },
      {
        url: server.url,
        env: { AGENTMEMORY_INJECT_CONTEXT: 'true' },
      },
    );

    assert.equal(result.code, 0);
    assert.deepEqual(JSON.parse(result.stdout), {
      additional_context: 'restored memory context',
    });
    assert.notEqual(result.stdout.trim(), 'restored memory context');
    assert.equal(result.stderr, '');
    assert.deepEqual(server.requests, [
      {
        path: '/agentmemory/session/start',
        authorization: 'Bearer test-secret',
        body: {
          sessionId: 'session-id',
          project: PROJECT,
          cwd: ROOT,
          agentId: 'cursor',
        },
      },
    ]);
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
    assert.deepEqual(Object.keys(observe.body.data), ['prompt', 'tool_input']);
    assert.equal(observe.body.data.prompt.length, 10_000);
    assert.equal(observe.body.hookType, 'prompt_submit');
    assert.equal(observe.body.sessionId, 'conversation-id');
    assert.equal(observe.body.project, PROJECT);
    assert.equal(observe.body.cwd, ROOT);
    assert.equal(observe.body.agentId, 'cursor');
    assert.match(observe.body.timestamp, /^\d{4}-\d{2}-\d{2}T/);
    // Prompt text doubles as tool_input so different prompts stay distinct;
    // identical prompts may dedupe within five minutes.
    assert.equal(observe.body.data.tool_input, observe.body.data.prompt);
    assert.equal(result.stdout.includes('prompt-'), false);
  } finally {
    await server.close();
  }
});

test('afterAgentResponse pairs the cached prompt as conversation tool_input', async () => {
  const server = await startMockServer();
  const directory = await mkdtemp(join(tmpdir(), 'agentmemory-prompt-cache-'));
  const cacheFile = join(directory, 'prompt-cache.json');
  const prompt = 'cached user prompt for pairing';
  const response = `response-${'r'.repeat(10_050)}`;
  try {
    assertSuccessfulNoOp(
      await runHook(
        'beforeSubmitPrompt',
        {
          conversation_id: 'conversation-id',
          workspace_roots: [ROOT],
          prompt,
        },
        {
          url: server.url,
          env: { AGENTMEMORY_PROMPT_CACHE_FILE: cacheFile },
        },
      ),
    );

    const result = await runHook(
      'afterAgentResponse',
      {
        conversation_id: 'conversation-id',
        workspace_roots: [ROOT],
        text: response,
        thought: 'private reasoning',
        prompt: 'do not read this undeclared field',
      },
      {
        url: server.url,
        env: { AGENTMEMORY_PROMPT_CACHE_FILE: cacheFile },
      },
    );

    assertSuccessfulNoOp(result);
    assert.equal(server.requests.length, 2);
    const observe = server.requests[1];
    assert.equal(observe.path, '/agentmemory/observe');
    // AgentMemory only summarizes known fields, so the response has to travel
    // as tool_output on a supported hookType rather than a custom one.
    assert.equal(observe.body.hookType, 'post_tool_use');
    assert.deepEqual(Object.keys(observe.body.data), [
      'tool_name',
      'tool_input',
      'tool_output',
    ]);
    assert.equal(observe.body.data.tool_name, 'conversation');
    assert.equal(observe.body.data.tool_input, prompt);
    assert.equal(observe.body.data.tool_output.length, 10_000);
    assert.equal(observe.body.agentId, 'cursor');
    assert.equal(result.stdout.includes('response-'), false);
  } finally {
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('afterAgentResponse uses empty tool_input on prompt cache miss', async () => {
  const server = await startMockServer();
  const directory = await mkdtemp(join(tmpdir(), 'agentmemory-prompt-miss-'));
  const cacheFile = join(directory, 'missing-cache.json');
  try {
    assertSuccessfulNoOp(
      await runHook(
        'afterAgentResponse',
        {
          conversation_id: 'missing-cache-session',
          workspace_roots: [ROOT],
          text: 'response without a cached prompt',
        },
        {
          url: server.url,
          env: { AGENTMEMORY_PROMPT_CACHE_FILE: cacheFile },
        },
      ),
    );
    assert.equal(server.requests[0].body.data.tool_input, '');
  } finally {
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('sessionEnd clears the prompt cache entry', async () => {
  const server = await startMockServer();
  const directory = await mkdtemp(join(tmpdir(), 'agentmemory-prompt-end-'));
  const cacheFile = join(directory, 'prompt-cache.json');
  try {
    assertSuccessfulNoOp(
      await runHook(
        'beforeSubmitPrompt',
        {
          conversation_id: 'ending-session',
          workspace_roots: [ROOT],
          prompt: 'please forget this cache entry',
        },
        {
          url: server.url,
          env: { AGENTMEMORY_PROMPT_CACHE_FILE: cacheFile },
        },
      ),
    );
    assert.equal(
      JSON.parse(await readFile(cacheFile, 'utf8'))['ending-session'].prompt,
      'please forget this cache entry',
    );

    assertSuccessfulNoOp(
      await runHook(
        'sessionEnd',
        { conversation_id: 'ending-session' },
        {
          url: server.url,
          env: { AGENTMEMORY_PROMPT_CACHE_FILE: cacheFile },
        },
      ),
    );

    await assert.rejects(() => access(cacheFile), { code: 'ENOENT' });
  } finally {
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('prompt cache prune drops stale entries and enforces the cap', async () => {
  const { prunePromptCache } = await import(join(HOOK_DIRECTORY, 'shared.mjs'));
  const now = Date.parse('2026-08-08T12:00:00.000Z');
  const pruned = prunePromptCache(
    {
      fresh: {
        prompt: 'keep me',
        updatedAt: '2026-08-08T11:00:00.000Z',
      },
      stale: {
        prompt: 'drop me',
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
      old: {
        prompt: 'also drop for cap',
        updatedAt: '2026-08-07T00:00:00.000Z',
      },
      newer: {
        prompt: 'keep for cap',
        updatedAt: '2026-08-08T10:00:00.000Z',
      },
    },
    { now, ttlMs: 2 * 24 * 60 * 60 * 1000, maxEntries: 2 },
  );

  assert.deepEqual(Object.keys(pruned).sort(), ['fresh', 'newer']);
  assert.equal(pruned.fresh.prompt, 'keep me');
  assert.equal(pruned.newer.prompt, 'keep for cap');
});

test('repeated prompts share tool_input and never reset the session', async () => {
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
    // Same prompt => same tool_input. Upstream may dedupe within five minutes;
    // that is accepted. Different prompts still get different hashes.
    assert.equal(first.body.data.prompt, second.body.data.prompt);
    assert.equal(first.body.data.tool_input, second.body.data.tool_input);
    assert.equal(first.body.data.tool_input, 'continue');
    assert.notEqual(first.body.timestamp, second.body.timestamp);
  } finally {
    await server.close();
  }
});

test('preCompact records metadata, summarizes, and never ends the session', async () => {
  const server = await startMockServer();
  try {
    const result = await runHook(
      'preCompact',
      {
        conversation_id: 'conversation-id',
        workspace_roots: [ROOT],
        trigger: 'auto',
        context_usage_percent: 82,
        context_tokens: 82_000,
        context_window_size: 100_000,
        message_count: 40,
        messages_to_compact: 20,
        is_first_compaction: true,
        text: 'must not be captured',
      },
      { url: server.url },
    );

    assertSuccessfulNoOp(result);
    assert.deepEqual(
      server.requests.map((request) => request.path),
      ['/agentmemory/observe', '/agentmemory/summarize'],
    );
    assert.equal(server.requests[0].body.hookType, 'pre_compact');
    assert.deepEqual(server.requests[0].body.data, {
      trigger: 'auto',
      context_usage_percent: 82,
      context_tokens: 82_000,
      context_window_size: 100_000,
      message_count: 40,
      messages_to_compact: 20,
      is_first_compaction: true,
    });
    assert.equal(server.requests[0].body.agentId, 'cursor');
    assert.deepEqual(server.requests[1].body, {
      sessionId: 'conversation-id',
      agentId: 'cursor',
    });
    assert.equal(
      server.requests.some(
        (request) => request.path === '/agentmemory/session/end',
      ),
      false,
    );
  } finally {
    await server.close();
  }
});

test('stop summarizes without ending the session', async () => {
  const server = await startMockServer();
  try {
    const result = await runHook(
      'stop',
      { conversation_id: 'conversation-id' },
      { url: server.url },
    );

    assertSuccessfulNoOp(result);
    assert.deepEqual(server.requests, [
      {
        path: '/agentmemory/summarize',
        authorization: 'Bearer test-secret',
        body: { sessionId: 'conversation-id', agentId: 'cursor' },
      },
    ]);
  } finally {
    await server.close();
  }
});

test('sessionEnd ends the stable session', async () => {
  const server = await startMockServer();
  try {
    const result = await runHook(
      'sessionEnd',
      {
        session_id: 'session-id',
        conversation_id: 'conversation-id',
      },
      { url: server.url },
    );

    assertSuccessfulNoOp(result);
    assert.deepEqual(server.requests, [
      {
        path: '/agentmemory/session/end',
        authorization: 'Bearer test-secret',
        body: { sessionId: 'session-id', agentId: 'cursor' },
      },
    ]);
  } finally {
    await server.close();
  }
});

test('every hook REST body hardcodes agentId cursor', async () => {
  const server = await startMockServer();
  try {
    const payloads = {
      sessionStart: {
        session_id: 'agent-id-session',
        workspace_roots: [ROOT],
      },
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
      preCompact: {
        conversation_id: 'agent-id-session',
        workspace_roots: [ROOT],
        trigger: 'manual',
      },
      stop: { conversation_id: 'agent-id-session' },
      sessionEnd: { session_id: 'agent-id-session' },
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
      'sessionEnd',
      {
        conversation_id: 'env-file-session',
        workspace_roots: [ROOT],
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
