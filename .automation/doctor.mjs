import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';
let failed = false;

function runBatch(exe, args) {
  const safeExe = exe.replaceAll("'", "''");
  const command = `& '${safeExe}' ${args.join(' ')}`;
  return spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { encoding: 'utf8' });
}

function run(command, args = []) {
  if (isWindows && command === 'npm') {
    const candidates = [path.join(path.dirname(process.execPath), 'npm.cmd'), 'C:\\Program Files\\nodejs\\npm.cmd'];
    const exe = candidates.find(fs.existsSync);
    if (exe) return runBatch(exe, args);
  }
  if (isWindows && command === 'playwright-cli') {
    const exe = process.env.APPDATA ? path.join(process.env.APPDATA, 'npm', 'playwright-cli.cmd') : null;
    if (exe && fs.existsSync(exe)) return runBatch(exe, args);
  }
  return spawnSync(command, args, { encoding: 'utf8' });
}

const checks = [
  ['git', ['--version'], true], ['gh', ['--version'], true], ['node', ['--version'], true],
  ['npm', ['--version'], false], ['playwright-cli', ['--version'], false]
];
for (const [command, args, required] of checks) {
  const result = run(command, args);
  if (result.status === 0) console.log(`OK   ${command}: ${`${result.stdout || result.stderr}`.trim().split(/\r?\n/)[0]}`);
  else { console.log(`${required ? 'FAIL' : 'WARN'} ${command}: not available`); if (required) failed = true; }
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, '.project/manifest.json'), 'utf8'));
console.log(`INFO schema=${manifest.schemaVersion} mode=${manifest.mode} lifecycle=${manifest.lifecycle} invariant=${manifest.context?.invariant || "unset"}`);

const git = run('git', ['-C', root, 'status', '--short', '--branch']);
if (git.status === 0) console.log(`INFO git:\n${git.stdout.trim()}`);
else { console.log('FAIL git working-tree inspection failed'); failed = true; }

const remote = run('git', ['-C', root, 'remote', 'get-url', 'origin']);
if (remote.status === 0) console.log(`INFO origin=${remote.stdout.trim()}`);
else console.log('WARN no origin remote configured');

const hooks = run('git', ['-C', root, 'config', '--get', 'core.hooksPath']);
if (hooks.status === 0 && hooks.stdout.trim() === '.githooks') console.log('OK   git hooks: .githooks');
else { console.log('FAIL versioned Git hooks inactive; run node .automation/bootstrap.mjs'); failed = true; }

if (manifest.ui?.hasUserInterface && manifest.ui.kind === 'web' && manifest.ui.playwright) {
  const result = run('playwright-cli', ['--version']);
  if (result.status !== 0) { console.log('FAIL Playwright required by manifest but unavailable'); failed = true; }
}

if (failed) process.exit(1);
console.log('Doctor OK');
