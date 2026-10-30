import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import {
  copyFile,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildRules, renderRules } from '../scripts/build.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'agentfiles-build-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'rules'));
  return root;
}

function runBuild(script, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd,
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
    child.once('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('build combines rule bodies in filename order without metadata or README', async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, 'rules', 'zeta.md'), '\n# Zeta\n\nLast body.\n\n');
  await writeFile(
    join(root, 'rules', 'alpha.md'),
    '---\r\ndescription: First\r\nmetadata:\r\n  environments: cloud\r\n---\r\n\n# Alpha\n\nFirst body.\n',
  );
  await writeFile(join(root, 'rules', 'empty.md'), '---\nname: empty\n---\n\n');
  await writeFile(join(root, 'rules', 'README.md'), 'Not a rule.\n');
  await writeFile(join(root, 'rules', 'notes.txt'), 'Not markdown.\n');
  await mkdir(join(root, 'rules', 'nested.md'));

  const { output, bytes } = await buildRules(root);
  const result = await readFile(output, 'utf8');
  assert.equal(result, '# Alpha\n\nFirst body.\n\n# Zeta\n\nLast body.\n');
  assert.equal(bytes, Buffer.byteLength(result));
  assert.deepEqual(await readdir(join(root, 'dist')), ['AGENTS.md']);
});

test('skill additions never change rule output or its byte budget', async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, 'rules', 'one.md'), 'Žluťoučký kôň 🐎\n');
  const first = await buildRules(root);
  const before = await readFile(first.output);
  await mkdir(join(root, 'skills', 'large'), { recursive: true });
  await writeFile(
    join(root, 'skills', 'large', 'SKILL.md'),
    'Skill body.\n'.repeat(50000),
  );
  const second = await buildRules(root);
  assert.deepEqual(await readFile(second.output), before);
  assert.equal(second.bytes, first.bytes);
});

test('CLI uses its checkout from another directory and supports an explicit output', async (t) => {
  const root = await fixture(t);
  await mkdir(join(root, 'scripts'));
  await writeFile(join(root, 'package.json'), '{"type":"module"}\n');
  await copyFile(join(ROOT, 'build'), join(root, 'build'));
  await copyFile(
    join(ROOT, 'scripts', 'build.mjs'),
    join(root, 'scripts', 'build.mjs'),
  );
  await writeFile(join(root, 'rules', 'one.md'), 'Own checkout rules.\n');
  const cwd = await fixture(t);
  await writeFile(join(cwd, 'rules', 'other.md'), 'Wrong checkout.\n');

  const first = await runBuild(join(root, 'build'), [], cwd);
  assert.equal(first.code, 0, first.stderr);
  assert.equal(
    await readFile(join(root, 'dist', 'AGENTS.md'), 'utf8'),
    'Own checkout rules.\n',
  );
  const second = await runBuild(
    join(root, 'build'),
    ['--output', 'custom/AGENTS.md'],
    cwd,
  );
  assert.equal(second.code, 0, second.stderr);
  assert.equal(
    await readFile(join(cwd, 'custom', 'AGENTS.md'), 'utf8'),
    'Own checkout rules.\n',
  );
});

test('CLI help and invalid arguments do not build files', async (t) => {
  const root = await fixture(t);
  await mkdir(join(root, 'scripts'));
  await writeFile(join(root, 'package.json'), '{"type":"module"}\n');
  await copyFile(join(ROOT, 'build'), join(root, 'build'));
  await copyFile(
    join(ROOT, 'scripts', 'build.mjs'),
    join(root, 'scripts', 'build.mjs'),
  );
  const script = join(root, 'build');
  const help = await runBuild(script, ['--help'], root);
  assert.equal(help.code, 0, help.stderr);
  assert.match(help.stdout, /Usage: \.\/build/);
  assert.match(help.stdout, /--output PATH/);
  for (const args of [
    ['--unknown'],
    ['--output'],
    ['--output', ''],
    ['extra'],
  ]) {
    const result = await runBuild(script, args, root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /Build failed:/);
    assert.match(result.stderr, /\.\/build --help/);
  }
  await assert.rejects(readFile(join(root, 'dist', 'AGENTS.md')), {
    code: 'ENOENT',
  });
});

test('missing source directory has an actionable error without creating output', async (t) => {
  const root = await fixture(t);
  await rm(join(root, 'rules'), { recursive: true });
  await assert.rejects(buildRules(root), /Rules directory not found:/);
  await assert.rejects(readFile(join(root, 'dist', 'AGENTS.md')), {
    code: 'ENOENT',
  });
});

test('repository rules fit the default instruction budget independently of skills', async () => {
  const rules = await renderRules(join(ROOT, 'rules'));
  assert.match(rules, /Keep replies concise/);
  assert.match(rules, /Prefer collaboration over autonomy/);
  assert.doesNotMatch(rules, /^description:|^metadata:|^alwaysApply:/m);
  assert.ok(Buffer.byteLength(rules, 'utf8') <= 32768);
});
