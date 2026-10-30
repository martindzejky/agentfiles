import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const FRONTMATTER_RE = /^---\r?\n.*?\r?\n---(?:\r?\n)?(.*)$/s;

export async function renderRules(sourceDir) {
  let entries;
  try {
    entries = await readdir(sourceDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Rules directory not found: ${sourceDir}`);
    }
    throw error;
  }

  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .filter((entry) => entry.name.toLowerCase() !== 'readme.md')
    .sort((a, b) => a.name.localeCompare(b.name));
  const bodies = [];
  for (const file of files) {
    const text = await readFile(join(sourceDir, file.name), 'utf8');
    const body = (text.match(FRONTMATTER_RE)?.[1] ?? text)
      .replace(/^\n+/, '')
      .replace(/\n+$/, '');
    if (body) bodies.push(body);
  }
  return bodies.length ? `${bodies.join('\n\n')}\n` : '';
}

export async function buildRules(
  root,
  output = join(root, 'dist', 'AGENTS.md'),
) {
  const rules = await renderRules(join(root, 'rules'));
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, rules);
  return { output, bytes: Buffer.byteLength(rules, 'utf8') };
}

export async function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      output: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    console.log(`Usage: ./build [--output PATH]

Concatenate rules/*.md into one rules-only AGENTS.md. Skill files are unchanged.
No installation, network access, or dependencies beyond Node.js 24 are needed.

Options:
  --output PATH  Export rules elsewhere; ./install still uses dist/AGENTS.md.
                 Relative to the current directory when not absolute.
                 Default: ${join(ROOT, 'dist', 'AGENTS.md')}
  -h, --help     Show this help.

Run ./install after the first build. Rebuild after updating rules; existing
symlinks use the refreshed file. Merged rules require another install.`);
    return;
  }
  if (values.output === '')
    throw new Error('--output requires a non-empty path');
  const result = await buildRules(
    ROOT,
    values.output === undefined ? undefined : resolve(values.output),
  );
  console.log(`Built ${result.output}: ${result.bytes} bytes of rules.`);
}
