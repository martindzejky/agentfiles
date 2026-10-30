import { randomUUID } from 'node:crypto';
import {
  chmod,
  lstat,
  mkdir,
  readFile,
  readdir,
  readlink,
  realpath,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const START = '<!-- agentfiles: start -->';
const END = '<!-- agentfiles: end -->';
const HELP = `Usage: ./install [options]

Install rules from ./build and native skills. Never builds or downloads.
Requires Node.js 24 or newer. Relative paths resolve from your current directory.

Options:
  --rules link|merge|manual|skip  Rules delivery (default: link)
    link    Link dist/AGENTS.md; refuse unrelated files and links.
    merge   Update only the agentfiles region in an explicit --rules-file.
    manual  Print instructions for the provider's agent-instructions setting.
    skip    Leave rules untouched; no rules build is required.
  --rules-file PATH        Destination for link or merge (merge requires it).
                           Link default: $CODEX_HOME/AGENTS.md, otherwise
                           $HOME/.codex/AGENTS.md.
  --skills link|skip       Native skills delivery (default: link).
                           Link each skill separately; preserve unrelated skills.
                           Skip when skills are already supplied by the platform.
  --skills-dir PATH        Native discovery directory (default: $HOME/.agents/skills).
  --dry-run               Validate and print planned changes without writing.
  --check                 Check filesystem installation without writing;
                           exit 1 for pending changes or conflicts. Cannot verify
                           provider settings or instructions loaded in a session.
  -h, --help              Show this help.

Examples:
  ./build && ./install
  ./install --rules merge --rules-file /workspace/AGENTS.md --skills skip
  ./install --rules manual --skills-dir /path/to/repo/.agents/skills
  ./install --rules manual --skills skip
  ./install --rules skip

Choose destinations using the runtime user's environment and platform guidance.
Only target files and directories you are permitted to manage. Writability does
not establish ownership. For managed locations, choose another target or skip
skills and use manual rules delivery. No force/overwrite mode is provided.

Merge copies rules only. Rerun it after building updated rules. Links follow
rebuilds; rerun installation for newly added skills. Existing links from the old
installer to this checkout are supported. Removed skills are not cleaned up.
No skill catalog is embedded in instructions. Point --skills-dir at a supported
native discovery location, not an arbitrary storage folder.

The installer reports rule bytes but does not change Codex's instruction budget.
Check the effective project_doc_max_bytes and the full instruction chain when
choosing a merge target. Nothing is truncated. AGENTS.override.md conflicts are
refused. Start a fresh session to verify rules and native skills independently.
`;

async function inspect(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function pointsTo(path, source) {
  const target = resolve(dirname(path), await readlink(path));
  if (target === source) return true;
  try {
    return (await realpath(path)) === (await realpath(source));
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function checkParents(path) {
  let parent = dirname(path);
  while (parent !== dirname(parent)) {
    const stat = await inspect(parent);
    if (stat) {
      const resolved = await realpath(parent);
      if (!(await lstat(resolved)).isDirectory()) {
        throw new Error(`Parent is not a directory: ${parent}`);
      }
    }
    parent = dirname(parent);
  }
}

async function canonicalLocation(path) {
  let parent = dirname(path);
  const parts = [basename(path)];
  while (true) {
    try {
      return join(await realpath(parent), ...parts);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      parts.unshift(basename(parent));
      parent = dirname(parent);
    }
  }
}

async function checkDestinations(operations, source) {
  if (!operations.length) return;
  const locations = await Promise.all(
    operations.map((operation) => canonicalLocation(operation.target)),
  );
  const builtRules = await canonicalLocation(source);
  const sources = await Promise.all(
    ['rules', 'skills'].map((name) => canonicalLocation(join(ROOT, name))),
  );
  for (const [index, location] of locations.entries()) {
    if (
      location === builtRules ||
      sources.some(
        (directory) =>
          location === directory || location.startsWith(`${directory}${sep}`),
      )
    ) {
      throw new Error(
        `Refusing to install over build or source files: ${operations[index].target}. Choose a destination outside the sources.`,
      );
    }
    if (
      locations.some(
        (other, otherIndex) =>
          otherIndex !== index &&
          (other === location || other.startsWith(`${location}${sep}`)),
      )
    ) {
      throw new Error(
        `Installation destinations overlap at ${operations[index].target}. Choose separate rules and skills destinations.`,
      );
    }
  }
}

async function planLink(source, target, legacySource) {
  await checkParents(target);
  const stat = await inspect(target);
  if (!stat) return { kind: 'link', source, target };
  if (stat.isSymbolicLink()) {
    if (await pointsTo(target, source)) return null;
    if (legacySource && (await pointsTo(target, legacySource))) {
      return {
        kind: 'relink',
        source,
        target,
        previous: await readlink(target),
      };
    }
  }
  throw new Error(
    `Conflict at ${target}. Preserve the existing content; choose another destination, --rules merge/manual, or --skills skip.`,
  );
}

function mergeRules(existing, rules, target) {
  const block = `${START}\n${rules.trimEnd()}\n${END}`;
  const start = existing.indexOf(START);
  const end = existing.indexOf(END);
  if (start === -1 && end === -1) {
    return `${existing}${existing ? '\n\n' : ''}${block}\n`;
  }
  if (
    start === -1 ||
    end < start ||
    existing.indexOf(START, start + START.length) !== -1 ||
    existing.indexOf(END, end + END.length) !== -1
  ) {
    throw new Error(
      `Ambiguous agentfiles markers in ${target}; review manually.`,
    );
  }
  return existing.slice(0, start) + block + existing.slice(end + END.length);
}

async function planMerge(target, rules) {
  await checkParents(target);
  const stat = await inspect(target);
  if (stat && !stat.isFile()) {
    throw new Error(
      `Refusing to merge into a symlink or non-regular file: ${target}`,
    );
  }
  const previous = stat ? await readFile(target, 'utf8') : null;
  const content = mergeRules(previous ?? '', rules, target);
  return content === previous
    ? null
    : { kind: 'merge', target, previous, content, mode: stat?.mode };
}

async function checkOverride(target) {
  if (basename(target) === 'AGENTS.override.md') {
    throw new Error(
      'Do not install an AGENTS.override.md that can hide existing instructions. Choose AGENTS.md or manual delivery.',
    );
  }
  if (basename(target) !== 'AGENTS.md') return;
  const override = join(dirname(target), 'AGENTS.override.md');
  if ((await inspect(override)) && (await readFile(override, 'utf8')).trim()) {
    throw new Error(
      `${override} takes precedence over ${target}. Preserve it and choose another discovery route or --rules manual.`,
    );
  }
}

async function planSkills(source, destination) {
  const entries = await readdir(source, { withFileTypes: true });
  const skills = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (
      entry.isDirectory() &&
      (await inspect(join(source, entry.name, 'SKILL.md')))?.isFile()
    ) {
      skills.push(entry.name);
    }
  }
  const stat = await inspect(destination);
  if (stat?.isSymbolicLink() && (await pointsTo(destination, source))) {
    return { operations: [], count: skills.length };
  }
  if (stat && !stat.isDirectory()) {
    throw new Error(
      `Skills destination is not a regular directory: ${destination}. Preserve it; choose --skills-dir or --skills skip.`,
    );
  }
  const operations = [];
  for (const skill of skills) {
    const operation = await planLink(
      join(source, skill),
      join(destination, skill),
    );
    if (operation) operations.push(operation);
  }
  return { operations, count: skills.length };
}

async function applyMerge(operation) {
  const { target, content, previous, mode } = operation;
  if (previous === null) {
    await writeFile(target, content, { flag: 'wx' });
    return;
  }
  const temporary = join(dirname(target), `.agentfiles-${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, content, { flag: 'wx' });
    await chmod(temporary, mode & 0o777);
    if (
      !(await inspect(target))?.isFile() ||
      (await readFile(target, 'utf8')) !== previous
    ) {
      throw new Error(
        `Instructions changed during installation: ${target}. Review and retry.`,
      );
    }
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function apply(operation) {
  await mkdir(dirname(operation.target), { recursive: true });
  if (operation.kind === 'merge') {
    await applyMerge(operation);
    return;
  }
  if (operation.kind === 'relink') {
    if ((await readlink(operation.target)) !== operation.previous) {
      throw new Error(
        `Link changed during installation: ${operation.target}. Review and retry.`,
      );
    }
    await unlink(operation.target);
  }
  await symlink(operation.source, operation.target);
}

export async function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      rules: { type: 'string', default: 'link' },
      'rules-file': { type: 'string' },
      skills: { type: 'string', default: 'link' },
      'skills-dir': { type: 'string' },
      'dry-run': { type: 'boolean' },
      check: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    console.log(HELP);
    return;
  }
  if (!['link', 'merge', 'manual', 'skip'].includes(values.rules)) {
    throw new Error('--rules must be link, merge, manual, or skip.');
  }
  if (!['link', 'skip'].includes(values.skills)) {
    throw new Error('--skills must be link or skip.');
  }
  if (values.rules === 'merge' && !values['rules-file']) {
    throw new Error(
      '--rules merge requires an explicit --rules-file in a location you are permitted to manage.',
    );
  }
  if (['manual', 'skip'].includes(values.rules) && values['rules-file']) {
    throw new Error(
      '--rules-file can only be used with --rules link or merge.',
    );
  }
  if (values.skills === 'skip' && values['skills-dir']) {
    throw new Error('--skills-dir cannot be used with --skills skip.');
  }
  if (values.check && values['dry-run']) {
    throw new Error('Choose --check or --dry-run, not both.');
  }
  for (const option of ['rules-file', 'skills-dir']) {
    if (values[option] !== undefined && !values[option].trim()) {
      throw new Error(`--${option} requires a nonempty path.`);
    }
  }

  const source = join(ROOT, 'dist', 'AGENTS.md');
  let rules = null;
  if (values.rules !== 'skip') {
    if (!(await inspect(source))?.isFile()) {
      throw new Error(`Missing rules build: ${source}. Run ./build first.`);
    }
    rules = await readFile(source, 'utf8');
  }
  const home = homedir();
  const target = resolve(
    values['rules-file'] ??
      join(process.env.CODEX_HOME || join(home, '.codex'), 'AGENTS.md'),
  );
  const skillsDir = resolve(
    values['skills-dir'] ?? join(home, '.agents', 'skills'),
  );
  const operations = [];
  if (['link', 'merge'].includes(values.rules)) {
    await checkOverride(target);
    const operation =
      values.rules === 'merge'
        ? await planMerge(target, rules)
        : await planLink(
            source,
            target,
            join(ROOT, 'dist', 'codex', 'AGENTS.md'),
          );
    if (operation) operations.push(operation);
  }
  let count = 0;
  if (values.skills === 'link') {
    const skills = await planSkills(join(ROOT, 'skills'), skillsDir);
    operations.push(...skills.operations);
    count = skills.count;
  }
  await checkDestinations(operations, source);

  console.log(
    values.rules === 'skip'
      ? 'Rules: skipped; existing instructions left unchanged.'
      : `Rules: ${values.rules}, ${Buffer.byteLength(rules, 'utf8')} bytes, source ${source}`,
  );
  if (['link', 'merge'].includes(values.rules))
    console.log(`Rules destination: ${target}`);
  console.log(
    values.skills === 'skip'
      ? 'Skills: skipped; native discovery must be supplied by the environment.'
      : `Skills: ${count} native skills at ${skillsDir}`,
  );
  for (const operation of operations) {
    console.log(
      `${values.check || values['dry-run'] ? 'Pending' : 'Install'} ${operation.kind}: ${operation.target}${operation.source ? ` -> ${operation.source}` : ''}`,
    );
  }
  if (!values.check && !values['dry-run']) {
    for (const operation of operations) await apply(operation);
  }
  if (values.rules === 'manual') {
    console.log(
      `Set this in the provider's agent-instructions setting:\nAt the start of every session, read the global rules at ${JSON.stringify(source)} and follow them alongside the platform instructions.`,
    );
    console.log(
      'Provider settings require manual setup and cannot be verified by this command.',
    );
  }
  if (values.check) {
    console.log(
      operations.length
        ? 'Filesystem installation needs changes.'
        : 'Filesystem installation is current.',
    );
    if (operations.length) process.exitCode = 1;
  } else if (values['dry-run']) {
    console.log('Dry run complete; no files changed.');
  } else {
    console.log(
      'Files configured. Verify rules and native skills in a fresh agent session.',
    );
  }
}
