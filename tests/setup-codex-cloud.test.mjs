import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  readFile,
  glob,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { setupCodexCloud } from '../scripts/setup-codex-cloud.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'agentfiles-cloud-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'rules'));
  await mkdir(join(root, 'skills', 'example'), { recursive: true });
  await mkdir(join(root, 'skills', 'empty'));
  await mkdir(join(root, 'workspace'));
  await writeFile(join(root, 'rules', 'one.md'), 'Keep rules intact.\n');
  await writeFile(
    join(root, 'skills', 'example', 'SKILL.md'),
    '---\nname: example\ndescription: Use for examples.\n---\nPrivate skill body.\n',
  );
  return {
    root,
    workspace: join(root, 'workspace'),
    target: join(root, 'workspace', 'AGENTS.md'),
  };
}

test('cloud setup preserves surrounding instructions and refreshes without duplicates', async (t) => {
  const { root, workspace, target } = await fixture(t);
  const original = '# Workspace\n\nKeep this text exactly.  \n';
  await writeFile(target, original);
  await setupCodexCloud(root, workspace);
  const first = await readFile(target, 'utf8');
  assert.ok(first.startsWith(original));
  assert.match(first, /example: Use for examples/);
  assert.ok(first.includes(join(root, 'skills', 'example', 'SKILL.md')));
  assert.doesNotMatch(first, /Private skill body/);
  await setupCodexCloud(root, workspace);
  assert.equal(await readFile(target, 'utf8'), first);

  const suffix = '\n# More workspace guidance\nKeep this too.\n';
  await writeFile(target, first + suffix);
  await writeFile(join(root, 'rules', 'one.md'), 'Updated rules.\n');
  await mkdir(join(root, 'skills', 'new-skill'));
  await writeFile(
    join(root, 'skills', 'new-skill', 'SKILL.md'),
    '---\nname: new-skill\ndescription: A new skill.\n---\n',
  );
  await setupCodexCloud(root, workspace);
  const updated = await readFile(target, 'utf8');
  assert.ok(updated.startsWith(original));
  assert.ok(updated.endsWith(suffix));
  assert.match(updated, /Updated rules/);
  assert.match(updated, /new-skill: A new skill/);
  assert.doesNotMatch(updated, /Keep rules intact/);
  assert.equal(updated.split('<!-- agentfiles: start -->').length, 2);
});

test('cloud setup rejects unsafe targets and malformed regions without writing', async (t) => {
  const { root, workspace, target } = await fixture(t);
  const other = join(root, 'other.md');
  await writeFile(other, 'Unrelated instructions.');
  await symlink(other, target);
  await assert.rejects(setupCodexCloud(root, workspace), /symlink/);
  assert.equal(await readFile(other, 'utf8'), 'Unrelated instructions.');
  await rm(target);

  for (const contents of [
    '<!-- agentfiles: start -->\nIncomplete',
    '<!-- agentfiles: end -->\n<!-- agentfiles: start -->',
    '<!-- agentfiles: start --><!-- agentfiles: end --><!-- agentfiles: start --><!-- agentfiles: end -->',
  ]) {
    await writeFile(target, contents);
    await assert.rejects(setupCodexCloud(root, workspace), /Ambiguous/);
    assert.equal(await readFile(target, 'utf8'), contents);
  }
});

test('cloud setup measures UTF-8 bytes and leaves existing instructions on budget failure', async (t) => {
  const { root, workspace, target } = await fixture(t);
  await writeFile(target, 'Žluťoučký kôň 🐎\n');
  const { bytes } = await setupCodexCloud(root, workspace);
  const content = await readFile(target, 'utf8');
  assert.equal(bytes, Buffer.byteLength(content));
  assert.ok(bytes > content.length);
  await setupCodexCloud(root, workspace, bytes);
  await assert.rejects(
    setupCodexCloud(root, workspace, bytes - 1),
    /exceeding/,
  );
  assert.equal(await readFile(target, 'utf8'), content);
});

test('current rules and every repository skill fit the default cloud budget', async (t) => {
  const { workspace, target } = await fixture(t);
  const { bytes } = await setupCodexCloud(ROOT, workspace);
  const content = await readFile(target, 'utf8');
  for await (const path of glob('*/SKILL.md', { cwd: join(ROOT, 'skills') })) {
    assert.ok(content.includes(join(ROOT, 'skills', path)));
  }
  assert.ok(bytes <= 32768);
  assert.match(content, /Keep replies concise/);
});
