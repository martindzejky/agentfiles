import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const RULES = 'Personal rules only.\n';
const START = '<!-- agentfiles: start -->';
const END = '<!-- agentfiles: end -->';

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'agentfiles-install-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const root = join(directory, 'checkout');
  const home = join(directory, 'home');
  await mkdir(root);
  await mkdir(home);
  await cp(join(ROOT, 'install'), join(root, 'install'));
  await cp(join(ROOT, 'scripts'), join(root, 'scripts'), { recursive: true });
  await writeFile(join(root, 'package.json'), '{"type":"module"}\n');
  await mkdir(join(root, 'dist'));
  await writeFile(join(root, 'dist', 'AGENTS.md'), RULES);
  await mkdir(join(root, 'rules'));
  await writeFile(join(root, 'rules', 'one.md'), 'Unbuilt source changes.\n');
  await mkdir(join(root, 'skills', 'example'), { recursive: true });
  await writeFile(
    join(root, 'skills', 'example', 'SKILL.md'),
    '---\nname: example\ndescription: Example native skill.\n---\nSkill body.\n',
  );
  const { CODEX_HOME: inheritedCodexHome, ...environment } = process.env;
  return {
    root,
    home,
    rulesFile: join(home, '.codex', 'AGENTS.md'),
    skillsDir: join(home, '.agents', 'skills'),
    run(args = [], extraEnvironment = {}) {
      return new Promise((resolve, reject) => {
        const child = spawn(
          process.execPath,
          [join(root, 'install'), ...args],
          {
            cwd: directory,
            env: { ...environment, HOME: home, ...extraEnvironment },
            stdio: ['ignore', 'pipe', 'pipe'],
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
        child.once('close', (code) => resolve({ code, stdout, stderr }));
      });
    },
  };
}

async function absent(path) {
  await assert.rejects(lstat(path), { code: 'ENOENT' });
}

function succeeded(result) {
  assert.equal(result.code, 0, result.stderr || result.stdout);
}

test('install help works without a build and invalid arguments change nothing', async (t) => {
  const f = await fixture(t);
  await rm(join(f.root, 'dist'), { recursive: true });
  const help = await f.run(['--help']);
  succeeded(help);
  assert.match(help.stdout, /--rules/);
  assert.match(help.stdout, /--skills/);
  assert.match(help.stdout, /--dry-run/);
  for (const args of [
    ['--unknown'],
    ['--rules'],
    ['--rules', 'overwrite'],
    ['--skills', 'overwrite'],
    ['--rules', 'merge'],
    ['--rules', 'manual', '--rules-file', '/unused/AGENTS.md'],
    ['--skills', 'skip', '--skills-dir', '/unused/skills'],
    ['--check', '--dry-run'],
  ]) {
    const result = await f.run(args);
    assert.notEqual(result.code, 0, JSON.stringify(args));
    assert.ok(result.stderr.trim(), JSON.stringify(args));
  }
  await absent(join(f.home, '.codex'));
  await absent(join(f.home, '.agents'));
});

test('install requires the existing build and never regenerates it', async (t) => {
  const f = await fixture(t);
  await rm(join(f.root, 'dist', 'AGENTS.md'));
  const missing = await f.run();
  assert.notEqual(missing.code, 0);
  assert.match(missing.stderr, /build/);
  await absent(join(f.home, '.codex'));
  await writeFile(join(f.root, 'dist', 'AGENTS.md'), RULES);
  succeeded(await f.run());
  assert.equal(await readFile(f.rulesFile, 'utf8'), RULES);
  assert.equal(
    await readFile(join(f.root, 'dist', 'AGENTS.md'), 'utf8'),
    RULES,
  );
});

test('local installation links rules and individual native skills and repeats safely', async (t) => {
  const f = await fixture(t);
  await mkdir(f.skillsDir, { recursive: true });
  await mkdir(join(f.skillsDir, 'platform-skill'));
  await writeFile(
    join(f.skillsDir, 'platform-skill', 'SKILL.md'),
    'Platform.\n',
  );
  succeeded(await f.run());
  assert.equal(await readlink(f.rulesFile), join(f.root, 'dist', 'AGENTS.md'));
  assert.equal(
    await readlink(join(f.skillsDir, 'example')),
    join(f.root, 'skills', 'example'),
  );
  assert.equal((await lstat(f.skillsDir)).isDirectory(), true);
  assert.equal(
    await readFile(join(f.skillsDir, 'platform-skill', 'SKILL.md'), 'utf8'),
    'Platform.\n',
  );
  succeeded(await f.run());
  await writeFile(join(f.root, 'dist', 'AGENTS.md'), 'Rebuilt rules.\n');
  assert.equal(await readFile(f.rulesFile, 'utf8'), 'Rebuilt rules.\n');
  await absent(join(f.home, '.cursor'));
});

test('existing whole skills link belonging to this checkout remains usable', async (t) => {
  const f = await fixture(t);
  await mkdir(dirname(f.skillsDir), { recursive: true });
  await symlink(join(f.root, 'skills'), f.skillsDir, 'dir');
  succeeded(await f.run());
  assert.equal(await readlink(f.skillsDir), join(f.root, 'skills'));
  assert.match(
    await readFile(join(f.skillsDir, 'example', 'SKILL.md'), 'utf8'),
    /Skill body/,
  );
  succeeded(await f.run(['--check']));
});

test('legacy rules links migrate even when their old build artifact is missing', async (t) => {
  for (const oldArtifactExists of [true, false]) {
    const f = await fixture(t);
    const legacy = join(f.root, 'dist', 'codex', 'AGENTS.md');
    await mkdir(dirname(legacy));
    if (oldArtifactExists) await writeFile(legacy, 'Old generated rules.\n');
    await mkdir(dirname(f.rulesFile), { recursive: true });
    await symlink(legacy, f.rulesFile);
    succeeded(await f.run());
    assert.equal(
      await readlink(f.rulesFile),
      join(f.root, 'dist', 'AGENTS.md'),
    );
    assert.equal(await readFile(f.rulesFile, 'utf8'), RULES);
    succeeded(await f.run(['--check']));
    if (oldArtifactExists) {
      assert.equal(await readFile(legacy, 'utf8'), 'Old generated rules.\n');
    } else {
      await absent(legacy);
    }
  }
});

test('rule and skill destinations respect runtime defaults and explicit paths', async (t) => {
  const f = await fixture(t);
  const codexHome = join(f.home, 'runtime-codex');
  succeeded(await f.run(['--skills', 'skip'], { CODEX_HOME: codexHome }));
  assert.equal(await readFile(join(codexHome, 'AGENTS.md'), 'utf8'), RULES);
  await absent(join(f.home, '.codex'));
  await absent(join(f.home, '.agents'));

  const rulesFile = join(f.home, 'custom', 'instructions.md');
  const skillsDir = join(f.home, 'project', '.agents', 'skills');
  succeeded(
    await f.run(['--rules-file', rulesFile, '--skills-dir', skillsDir]),
  );
  assert.equal(await readFile(rulesFile, 'utf8'), RULES);
  assert.equal(
    await readlink(join(skillsDir, 'example')),
    join(f.root, 'skills', 'example'),
  );
});

test('dry run and check do not create destinations and check detects pending work', async (t) => {
  const f = await fixture(t);
  succeeded(await f.run(['--dry-run']));
  assert.notEqual((await f.run(['--check'])).code, 0);
  await absent(join(f.home, '.codex'));
  await absent(join(f.home, '.agents'));
  succeeded(await f.run());
  succeeded(await f.run(['--check']));
  await rm(join(f.skillsDir, 'example'));
  assert.notEqual((await f.run(['--check'])).code, 0);
  await absent(join(f.skillsDir, 'example'));
});

test('foreign rules and skill collisions are preserved before any installation writes', async (t) => {
  const f = await fixture(t);
  await mkdir(dirname(f.rulesFile), { recursive: true });
  await writeFile(f.rulesFile, 'Managed global instructions.\n');
  assert.notEqual((await f.run()).code, 0);
  assert.equal(
    await readFile(f.rulesFile, 'utf8'),
    'Managed global instructions.\n',
  );
  await absent(join(f.home, '.agents'));

  await rm(f.rulesFile);
  await mkdir(join(f.skillsDir, 'example'), { recursive: true });
  await writeFile(join(f.skillsDir, 'example', 'SKILL.md'), 'Managed skill.\n');
  assert.notEqual((await f.run()).code, 0);
  await absent(f.rulesFile);
  assert.equal(
    await readFile(join(f.skillsDir, 'example', 'SKILL.md'), 'utf8'),
    'Managed skill.\n',
  );
});

test('a blocked skills parent fails before creating a rules destination', async (t) => {
  const f = await fixture(t);
  const blocked = join(f.home, '.agents');
  await writeFile(blocked, 'Managed parent file.\n');
  const result = await f.run();
  assert.notEqual(result.code, 0);
  assert.equal(await readFile(blocked, 'utf8'), 'Managed parent file.\n');
  await absent(join(f.home, '.codex'));
});

test('foreign symlinks are never replaced or followed for installation', async (t) => {
  const f = await fixture(t);
  const foreignRules = join(f.home, 'managed.md');
  await writeFile(foreignRules, 'Keep managed rules.\n');
  await mkdir(dirname(f.rulesFile), { recursive: true });
  await symlink(foreignRules, f.rulesFile);
  assert.notEqual((await f.run()).code, 0);
  assert.equal(await readlink(f.rulesFile), foreignRules);
  assert.equal(await readFile(foreignRules, 'utf8'), 'Keep managed rules.\n');
  await absent(join(f.home, '.agents'));
});

test('a foreign skills-directory symlink is preserved without installing rules', async (t) => {
  const f = await fixture(t);
  const foreign = join(f.home, 'platform-skills');
  await mkdir(foreign);
  await mkdir(dirname(f.skillsDir), { recursive: true });
  await symlink(foreign, f.skillsDir, 'dir');
  assert.notEqual((await f.run()).code, 0);
  assert.equal(await readlink(f.skillsDir), foreign);
  await absent(join(foreign, 'example'));
  await absent(f.rulesFile);
});

test('merge preserves surrounding bytes, removes the old catalog, and refreshes idempotently', async (t) => {
  const f = await fixture(t);
  const target = join(f.home, 'workspace', 'AGENTS.md');
  await mkdir(dirname(target));
  const before = '# Workspace\r\nKeep this exactly.  \r\n';
  const after = '\n\n# Other guidance\nKeep this too.\n';
  await writeFile(
    target,
    `${before}${START}\nOld rules.\n## Filesystem skills\nold|catalog|/old/SKILL.md\n${END}${after}`,
  );
  const args = ['--rules', 'merge', '--rules-file', target, '--skills', 'skip'];
  succeeded(await f.run(args));
  const first = await readFile(target, 'utf8');
  assert.ok(first.startsWith(before));
  assert.ok(first.endsWith(after));
  assert.ok(first.includes(RULES));
  assert.doesNotMatch(first, /Old rules|Filesystem skills|SKILL\.md|catalog/);
  succeeded(await f.run(args));
  assert.equal(await readFile(target, 'utf8'), first);
  succeeded(await f.run([...args, '--check']));
  await writeFile(join(f.root, 'dist', 'AGENTS.md'), 'New build.\n');
  assert.notEqual((await f.run([...args, '--check'])).code, 0);
  assert.equal(await readFile(target, 'utf8'), first);
  succeeded(await f.run(args));
  assert.match(await readFile(target, 'utf8'), /New build/);
  await absent(join(f.home, '.codex'));
  await absent(join(f.home, '.agents'));
});

test('merge creates an explicit target but refuses symlinks and malformed regions', async (t) => {
  const f = await fixture(t);
  const target = join(f.home, 'workspace', 'AGENTS.md');
  const args = ['--rules', 'merge', '--rules-file', target, '--skills', 'skip'];
  succeeded(await f.run(args));
  assert.ok((await readFile(target, 'utf8')).includes(RULES));
  for (const text of [
    `${START}\nMissing end.\n`,
    `${END}\n${START}`,
    `${START}${END}${START}${END}`,
  ]) {
    await writeFile(target, text);
    assert.notEqual((await f.run(args)).code, 0);
    assert.equal(await readFile(target, 'utf8'), text);
  }
  await rm(target);
  const foreign = join(f.home, 'foreign.md');
  await writeFile(foreign, 'Unrelated.\n');
  await symlink(foreign, target);
  assert.notEqual((await f.run(args)).code, 0);
  assert.equal(await readFile(foreign, 'utf8'), 'Unrelated.\n');
});

test('merge dry run leaves the destination and skills untouched', async (t) => {
  const f = await fixture(t);
  const target = join(f.home, 'workspace', 'AGENTS.md');
  const original = '# Keep these bytes.  \r\n';
  await mkdir(dirname(target));
  await writeFile(target, original);
  succeeded(
    await f.run(['--rules', 'merge', '--rules-file', target, '--dry-run']),
  );
  assert.equal(await readFile(target, 'utf8'), original);
  await absent(join(f.home, '.agents'));
  await absent(join(f.home, '.codex'));
});

test('merge refuses to overwrite its build artifact through direct or aliased paths', async (t) => {
  const f = await fixture(t);
  const source = join(f.root, 'dist', 'AGENTS.md');
  const alias = join(f.home, 'built-rules');
  await symlink(join(f.root, 'dist'), alias, 'dir');
  for (const target of [source, join(alias, 'AGENTS.md')]) {
    const result = await f.run([
      '--rules',
      'merge',
      '--rules-file',
      target,
      '--skills',
      'skip',
    ]);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /build or source files/);
    assert.equal(await readFile(source, 'utf8'), RULES);
  }
  await absent(join(f.home, '.agents'));
});

test('merge refuses source rules and skill files without altering them', async (t) => {
  const f = await fixture(t);
  for (const target of [
    join(f.root, 'rules', 'one.md'),
    join(f.root, 'skills', 'example', 'SKILL.md'),
  ]) {
    const original = await readFile(target, 'utf8');
    const result = await f.run([
      '--rules',
      'merge',
      '--rules-file',
      target,
      '--skills',
      'skip',
    ]);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /build or source files/);
    assert.equal(await readFile(target, 'utf8'), original);
  }
});

test('aliased rules and skills destinations cannot overlap', async (t) => {
  const f = await fixture(t);
  const destination = join(f.home, 'destination');
  const alias = join(f.home, 'alias');
  await mkdir(destination);
  await symlink(destination, alias, 'dir');
  const result = await f.run([
    '--rules',
    'merge',
    '--rules-file',
    join(alias, 'example'),
    '--skills-dir',
    destination,
  ]);
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /destinations overlap/);
  await absent(join(destination, 'example'));
  await absent(join(f.home, '.codex'));
});

test('empty overrides permit installation and nonempty overrides also block merge', async (t) => {
  const f = await fixture(t);
  const override = join(dirname(f.rulesFile), 'AGENTS.override.md');
  await mkdir(dirname(f.rulesFile), { recursive: true });
  await writeFile(override, ' \n\t');
  succeeded(await f.run());
  assert.equal(await readFile(f.rulesFile, 'utf8'), RULES);
  assert.equal(await readFile(override, 'utf8'), ' \n\t');

  const target = join(f.home, 'workspace', 'AGENTS.md');
  const workspaceOverride = join(dirname(target), 'AGENTS.override.md');
  const existing = 'Workspace rules.\n';
  await mkdir(dirname(target));
  await writeFile(target, existing);
  await writeFile(workspaceOverride, 'Managed workspace override.\n');
  const result = await f.run([
    '--rules',
    'merge',
    '--rules-file',
    target,
    '--skills',
    'skip',
  ]);
  assert.notEqual(result.code, 0);
  assert.equal(await readFile(target, 'utf8'), existing);
  assert.equal(
    await readFile(workspaceOverride, 'utf8'),
    'Managed workspace override.\n',
  );
});

test('a nonempty discovery override prevents a misleading rule installation', async (t) => {
  const f = await fixture(t);
  await mkdir(dirname(f.rulesFile), { recursive: true });
  await writeFile(
    join(dirname(f.rulesFile), 'AGENTS.override.md'),
    'Managed override.\n',
  );
  assert.notEqual((await f.run()).code, 0);
  await absent(f.rulesFile);
  await absent(join(f.home, '.agents'));
});

test('manual rules delivery leaves managed home files intact and prints a settings pointer', async (t) => {
  const f = await fixture(t);
  await mkdir(dirname(f.rulesFile), { recursive: true });
  await writeFile(f.rulesFile, 'Managed rules.\n');
  const result = await f.run(['--rules', 'manual', '--skills', 'skip']);
  succeeded(result);
  assert.ok(result.stdout.includes(join(f.root, 'dist', 'AGENTS.md')));
  assert.match(result.stdout, /read/i);
  assert.equal(await readFile(f.rulesFile, 'utf8'), 'Managed rules.\n');
  await absent(join(f.home, '.agents'));
  assert.equal(
    await readFile(join(f.root, 'dist', 'AGENTS.md'), 'utf8'),
    RULES,
  );
});

test('manual rules delivery can still install native skills without touching managed rules', async (t) => {
  const f = await fixture(t);
  await mkdir(dirname(f.rulesFile), { recursive: true });
  await writeFile(f.rulesFile, 'Managed rules.\n');
  succeeded(await f.run(['--rules', 'manual']));
  assert.equal(await readFile(f.rulesFile, 'utf8'), 'Managed rules.\n');
  assert.equal(
    await readlink(join(f.skillsDir, 'example')),
    join(f.root, 'skills', 'example'),
  );
});
