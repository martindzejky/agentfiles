#!/usr/bin/env node

import { glob, lstat, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCodexAgents } from './generate-dist.mjs';

const START = '<!-- agentfiles: start -->';
const END = '<!-- agentfiles: end -->';

async function skillCatalog(root) {
  const skillsDir = join(root, 'skills');
  const paths = await Array.fromAsync(glob('*/SKILL.md', { cwd: skillsDir }));
  const lines = [];
  for (const relativePath of paths.sort()) {
    const path = join(skillsDir, relativePath);
    const text = await readFile(path, 'utf8');
    const frontmatter = text.match(/^---\r?\n(.*?)\r?\n---/s)?.[1];
    // Repository skills use single-line, unquoted names and descriptions.
    const name = frontmatter?.match(/^name: (.+)$/m)?.[1].trim();
    const description = frontmatter?.match(/^description: (.+)$/m)?.[1].trim();
    if (
      !name ||
      !description ||
      [name, description].some((value) => /^[>|'"\[]/.test(value))
    ) {
      throw new Error(`Expected single-line name and description in ${path}`);
    }
    const short =
      description.length > 120
        ? `${description.slice(0, 117).replace(/\s+\S*$/, '')}...`
        : description;
    lines.push(`- ${name}: ${short} Read \`${path}\`.`);
  }
  return [
    '## Filesystem skills',
    '',
    'Use relevant skills below. Read the referenced SKILL.md before applying a skill, and resolve its relative paths from its directory. This catalog provides filesystem access, not native plugin registration.',
    '',
    ...lines,
  ].join('\n');
}

export async function setupCodexCloud(root, workspace, maxBytes = 32768) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new Error('The instruction byte budget must be a positive integer');
  }
  root = resolve(root);
  const target = join(resolve(workspace), 'AGENTS.md');
  let exists = false;
  let existing = '';
  try {
    const stat = await lstat(target);
    if (!stat.isFile()) {
      throw new Error(
        `Refusing to replace a symlink or non-regular file: ${target}`,
      );
    }
    exists = true;
    existing = await readFile(target, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const rules = await renderCodexAgents(join(root, 'rules'));
  const catalog = await skillCatalog(root);
  const block = `${START}\n${rules}\n${catalog}\n${END}`;
  const start = existing.indexOf(START);
  const end = existing.indexOf(END);
  let output;
  if (start === -1 && end === -1) {
    output = `${existing}${existing ? '\n\n' : ''}${block}\n`;
  } else {
    if (
      start === -1 ||
      end < start ||
      existing.indexOf(START, start + START.length) !== -1 ||
      existing.indexOf(END, end + END.length) !== -1
    ) {
      throw new Error(
        `Ambiguous agentfiles markers in ${target}; review manually`,
      );
    }
    output =
      existing.slice(0, start) + block + existing.slice(end + END.length);
  }
  const bytes = Buffer.byteLength(output, 'utf8');
  if (bytes > maxBytes) {
    throw new Error(
      `${target} needs ${bytes} bytes, exceeding the ${maxBytes}-byte budget; no changes written`,
    );
  }
  await writeFile(target, output, { flag: exists ? 'w' : 'wx' });
  return { target, bytes };
}

const invokedDirectly =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (invokedDirectly) {
  const [workspace, maxBytes, ...extra] = process.argv.slice(2);
  if (!workspace || extra.length) {
    console.error(
      'Usage: node scripts/setup-codex-cloud.mjs <task-root> [available-bytes]',
    );
    process.exitCode = 1;
  } else {
    const root = dirname(dirname(fileURLToPath(import.meta.url)));
    setupCodexCloud(
      root,
      workspace,
      maxBytes === undefined ? undefined : Number(maxBytes),
    )
      .then(({ target, bytes }) =>
        console.log(
          `Wrote ${target}: ${bytes} bytes. Verify injection in a fresh hosted session.`,
        ),
      )
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
  }
}
