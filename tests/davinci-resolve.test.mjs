import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

test('Resolve helpers validate plans, preserve targets, and inspect synthetic media offline', () => {
  const result = spawnSync(
    'python3',
    ['-B', join(ROOT, 'tests', 'davinci-resolve_test.py')],
    { cwd: ROOT, encoding: 'utf8', timeout: 120_000 },
  );
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
