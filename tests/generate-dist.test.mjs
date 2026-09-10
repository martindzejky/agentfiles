import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SCRIPT = join(ROOT, 'scripts', 'generate-dist.mjs');

function runGenerate(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
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
    child.once('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

test('generate-dist writes always-on Cursor mdc from markdown rules', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agentfiles-dist-'));
  const rulesDir = join(root, 'rules');
  const cursorOut = join(root, 'dist', 'cursor', 'rules');

  try {
    await mkdir(rulesDir);
    await writeFile(
      join(rulesDir, 'personality.md'),
      '# Personality\n\nKeep replies concise.\n',
    );
    await writeFile(
      join(rulesDir, 'local-env.md'),
      [
        '---',
        'description: Local development, human in the loop',
        'metadata:',
        '  environments: local',
        'alwaysApply: false',
        '---',
        '',
        'Prefer collaboration over autonomy.',
        '',
      ].join('\n'),
    );
    await writeFile(join(rulesDir, 'README.md'), 'Not a rule.\n');
    await mkdir(cursorOut, { recursive: true });
    await writeFile(join(cursorOut, 'stale.mdc'), 'stale\n');

    const result = await runGenerate([
      '--root',
      root,
      '--cursor-out',
      cursorOut,
    ]);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /Wrote Codex dist/);

    const personality = await readFile(
      join(cursorOut, 'personality.mdc'),
      'utf8',
    );
    assert.equal(
      personality,
      [
        '---',
        'alwaysApply: true',
        '---',
        '',
        '# Personality',
        '',
        'Keep replies concise.',
        '',
      ].join('\n'),
    );

    const localEnv = await readFile(join(cursorOut, 'local-env.mdc'), 'utf8');
    assert.match(localEnv, /^---\n/);
    assert.match(
      localEnv,
      /\ndescription: Local development, human in the loop\n/,
    );
    assert.match(localEnv, /\nmetadata:\n {2}environments: local\n/);
    assert.match(localEnv, /\nalwaysApply: true\n---\n/);
    assert.doesNotMatch(localEnv, /alwaysApply: false/);
    assert.match(localEnv, /Prefer collaboration over autonomy\./);

    await assert.rejects(readFile(join(cursorOut, 'README.mdc')), {
      code: 'ENOENT',
    });
    await assert.rejects(readFile(join(cursorOut, 'stale.mdc')), {
      code: 'ENOENT',
    });

    const agents = await readFile(
      join(root, 'dist', 'codex', 'AGENTS.md'),
      'utf8',
    );
    assert.equal(
      agents,
      [
        'Prefer collaboration over autonomy.',
        '',
        '# Personality',
        '',
        'Keep replies concise.',
        '',
      ].join('\n'),
    );
    assert.doesNotMatch(agents, /^---\n/);
    assert.doesNotMatch(agents, /alwaysApply/);
    assert.doesNotMatch(agents, /Not a rule/);

    const hooks = JSON.parse(
      await readFile(join(root, 'dist', 'codex', 'hooks.json'), 'utf8'),
    );
    assert.equal(hooks.hooks.UserPromptSubmit[0].hooks[0].type, 'command');
    assert.equal(
      hooks.hooks.UserPromptSubmit[0].hooks[0].command,
      join(root, 'hooks', 'agentmemory', 'codex', 'user-prompt-submit.mjs'),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('repo rules generate Cursor mdc with env metadata copied', async () => {
  const cursorOut = await mkdtemp(join(tmpdir(), 'agentfiles-repo-dist-'));
  const codexOut = await mkdtemp(join(tmpdir(), 'agentfiles-repo-codex-'));
  try {
    const result = await runGenerate([
      '--cursor-out',
      cursorOut,
      '--codex-out',
      codexOut,
    ]);
    assert.equal(result.code, 0, result.stderr);

    const localEnv = await readFile(join(cursorOut, 'local-env.mdc'), 'utf8');
    assert.match(localEnv, /\nmetadata:\n {2}environments: local\n/);
    assert.match(localEnv, /\nalwaysApply: true\n---\n/);

    const cloudEnv = await readFile(join(cursorOut, 'cloud-env.mdc'), 'utf8');
    assert.match(cloudEnv, /\nmetadata:\n {2}environments: cloud\n/);

    const personality = await readFile(
      join(cursorOut, 'personality.mdc'),
      'utf8',
    );
    assert.match(personality, /\nalwaysApply: true\n---\n/);
    assert.match(personality, /Keep replies concise\./);

    const agents = await readFile(join(codexOut, 'AGENTS.md'), 'utf8');
    assert.doesNotMatch(agents, /^---\n/);
    assert.doesNotMatch(agents, /^description:/m);
    assert.doesNotMatch(agents, /^metadata:/m);
    assert.match(agents, /Keep replies concise\./);
    assert.match(agents, /Prefer collaboration over autonomy\./);
    assert.match(
      agents,
      /Don't wait for the user\. Be proactive and autonomous\./,
    );
    assert.match(agents, /https:\/\/github.com\/martindzejky\/agentfiles/);
    assert.doesNotMatch(
      agents,
      /Always apply when creating, editing, or reviewing/,
    );
    assert.ok(Buffer.byteLength(agents, 'utf8') < 32 * 1024);

    const hooks = JSON.parse(
      await readFile(join(codexOut, 'hooks.json'), 'utf8'),
    );
    assert.deepEqual(Object.keys(hooks.hooks), [
      'UserPromptSubmit',
      'Stop',
      'PostToolUse',
      'SubagentStart',
      'SubagentStop',
    ]);
    assert.equal(hooks.hooks.SessionStart, undefined);
    assert.equal(
      hooks.hooks.Stop[0].hooks[0].command,
      join(ROOT, 'hooks', 'agentmemory', 'codex', 'stop.mjs'),
    );
    assert.equal(hooks.hooks.PostToolUse[0].hooks[0].timeout, 3);
    assert.equal(hooks.hooks.PostToolUseFailure, undefined);
  } finally {
    await rm(cursorOut, { recursive: true, force: true });
    await rm(codexOut, { recursive: true, force: true });
  }
});

test('generate-dist writes Codex AGENTS.md in filename order', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agentfiles-codex-'));
  const rulesDir = join(root, 'rules');
  const cursorOut = join(root, 'dist', 'cursor', 'rules');
  const codexOut = join(root, 'out');

  try {
    await mkdir(rulesDir);
    await writeFile(join(rulesDir, 'zeta.md'), '# Zeta\n\nLast body.\n');
    await writeFile(
      join(rulesDir, 'alpha.md'),
      [
        '---',
        'description: First',
        '---',
        '',
        '# Alpha',
        '',
        'First body.',
        '',
      ].join('\n'),
    );

    const result = await runGenerate([
      '--root',
      root,
      '--cursor-out',
      cursorOut,
      '--codex-out',
      codexOut,
    ]);
    assert.equal(result.code, 0, result.stderr);

    assert.equal(
      await readFile(join(codexOut, 'AGENTS.md'), 'utf8'),
      ['# Alpha', '', 'First body.', '', '# Zeta', '', 'Last body.', ''].join(
        '\n',
      ),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
