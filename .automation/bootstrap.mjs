import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function git(args) {
  return spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
}

const inside = git(['rev-parse', '--is-inside-work-tree']);
if (inside.status !== 0) {
  console.error('Bootstrap requires a Git working tree.');
  process.exit(1);
}

const hook = git(['config', 'core.hooksPath', '.githooks']);
if (hook.status !== 0) {
  console.error(hook.stderr || 'Unable to configure versioned Git hooks.');
  process.exit(1);
}

git(['config', 'push.autoSetupRemote', 'true']);
console.log('Bootstrap OK: versioned Git hooks activated for this clone.');
