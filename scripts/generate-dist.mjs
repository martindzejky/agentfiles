#!/usr/bin/env node

import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONTMATTER_RE = /^---\r?\n(.*?)\r?\n---(?:\r?\n)?(.*)$/s;
const ALWAYS_APPLY_RE = /^alwaysApply\s*:/;
const README_NAMES = new Set(['readme.md']);

function parseArgs(argv) {
  const args = { root: undefined, cursorOut: undefined, codexOut: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') {
      args.root = argv[i + 1];
      i += 1;
    } else if (arg === '--cursor-out') {
      args.cursorOut = argv[i + 1];
      i += 1;
    } else if (arg === '--codex-out') {
      args.codexOut = argv[i + 1];
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function parseRule(text) {
  const match = text.match(FRONTMATTER_RE);
  if (!match) {
    return { frontmatter: null, body: text };
  }
  return { frontmatter: match[1], body: match[2] };
}

function cursorFrontmatter(raw) {
  const lines = [];
  if (raw) {
    for (const line of raw.split(/\r?\n/)) {
      if (!ALWAYS_APPLY_RE.test(line)) {
        lines.push(line);
      }
    }
  }
  lines.push('alwaysApply: true');
  return `---\n${lines.join('\n')}\n---\n`;
}

function renderCursorRule(text) {
  const parsed = parseRule(text);
  let body = parsed.body.replace(/^\n+/, '');
  if (body && !body.endsWith('\n')) {
    body += '\n';
  }
  return cursorFrontmatter(parsed.frontmatter) + (body ? `\n${body}` : '\n');
}

function renderCodexBody(text) {
  return parseRule(text).body.replace(/^\n+/, '').replace(/\n+$/, '');
}

async function listRuleFiles(sourceDir) {
  let entries;
  try {
    entries = await readdir(sourceDir, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new Error(`rules directory not found: ${sourceDir}`);
    }
    throw error;
  }

  return entries
    .filter((item) => item.isFile() && item.name.endsWith('.md'))
    .filter((item) => !README_NAMES.has(item.name.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function generateCursorRules(sourceDir, destDir) {
  const entries = await listRuleFiles(sourceDir);
  await mkdir(destDir, { recursive: true });
  const existing = await readdir(destDir);
  await Promise.all(
    existing
      .filter((name) => name.endsWith('.mdc'))
      .map((name) => unlink(join(destDir, name))),
  );

  const written = [];
  for (const entry of entries) {
    const dest = join(destDir, `${entry.name.slice(0, -3)}.mdc`);
    const text = await readFile(join(sourceDir, entry.name), 'utf8');
    await writeFile(dest, renderCursorRule(text));
    written.push(dest);
  }
  return written;
}

async function generateCodexAgents(sourceDir, destFile) {
  const entries = await listRuleFiles(sourceDir);
  const bodies = [];
  for (const entry of entries) {
    const text = await readFile(join(sourceDir, entry.name), 'utf8');
    const body = renderCodexBody(text);
    if (body) {
      bodies.push(body);
    }
  }

  await mkdir(dirname(destFile), { recursive: true });
  await writeFile(
    destFile,
    bodies.length > 0 ? `${bodies.join('\n\n')}\n` : '',
  );
  return destFile;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const here = dirname(fileURLToPath(import.meta.url));
  const root = resolve(args.root ?? join(here, '..'));
  const rulesDir = join(root, 'rules');
  const cursorOut = resolve(
    args.cursorOut ?? join(root, 'dist', 'cursor', 'rules'),
  );
  const codexOut = resolve(args.codexOut ?? join(root, 'dist', 'codex'));
  const written = await generateCursorRules(rulesDir, cursorOut);
  await mkdir(codexOut, { recursive: true });
  await generateCodexAgents(rulesDir, join(codexOut, 'AGENTS.md'));
  console.log(`Wrote ${written.length} Cursor rule(s) to ${cursorOut}`);
  console.log(`Wrote Codex dist to ${codexOut}`);
}

const invokedDirectly =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (invokedDirectly) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
