import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root } from './contract.mjs';

function run(dir, script = 'validate.mjs', args = []) {
  return spawnSync(process.execPath, [path.join(dir, '.automation', script), ...args], { cwd: dir, encoding: 'utf8' });
}

function copyCase(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `newProject-${name}-`));
  fs.cpSync(root, dir, {
    recursive: true,
    filter: (source) => !['.git', 'node_modules', '.tmp'].includes(path.basename(source))
  });
  return dir;
}

function expectFailure(name, mutate, expected, script = 'validate.mjs', args = []) {
  const dir = copyCase(name);
  try {
    mutate(dir);
    const result = run(dir, script, args);
    const output = `${result.stdout}\n${result.stderr}`;
    if (result.status === 0 || !output.includes(expected)) {
      throw new Error(`${name} did not fail as expected. Output:\n${output}`);
    }
    console.log(`OK negative canary: ${name}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function configureProject(dir, lifecycle = 'DEFINE') {
  const manifestFile = path.join(dir, '.project', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifest.mode = 'project';
  manifest.lifecycle = lifecycle;
  manifest.project = { name: 'Canary', summary: 'Canary project', appType: 'service', primaryUsers: ['tester'], firstRelease: 'First value' };
  manifest.stack = { primary: 'JavaScript', runtime: 'Node', packageManager: 'npm', database: 'none' };
  manifest.commands.verify = 'node .automation/validate.mjs';
  manifest.ui = { hasUserInterface: false, kind: 'none', platform: 'none', devUrl: null, playwright: false, designSystem: null, designTokens: null, componentStrategy: 'not-applicable', accessibilityTarget: 'not-applicable', visualRegression: 'not-applicable' };
  manifest.experience = { audience: 'technical-user', installer: 'not-applicable', onboarding: 'not-applicable', updater: 'not-applicable', recovery: 'documented', reset: 'not-applicable', uninstaller: 'not-applicable', goldenJourneys: ['user reaches first value'] };
  manifest.release = { artifact: 'source', deployment: 'not-applicable', rollback: 'git-revert' };
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, 'PROJECT.md'), '# Project Definition\n\nConcrete canary project.\n');
  fs.writeFileSync(path.join(dir, 'ARCHITECTURE.md'), '# Architecture Record\n\nConcrete canary architecture.\n');
  fs.writeFileSync(path.join(dir, 'STATUS.md'), `# Current State\n\n- Lifecycle: ${lifecycle}\n- Manifest schema: v${manifest.schemaVersion}\n`);
  fs.writeFileSync(path.join(dir, '.github', 'workflows', 'quality.yml'), 'name: Quality\non: [push]\njobs:\n  quality:\n    runs-on: ubuntu-latest\n    steps:\n      - run: node .automation/validate.mjs\n      - run: node .automation/context-integrity.mjs\n      - run: node .automation/context-pack.mjs --scope all\n      - run: node .automation/context-pack.mjs --check\n');
  return manifest;
}


function completeEvidence() {
  return `# Quality Evidence

- Overall status: PASS
- Challenger status: PASS
- Candidate/revision context: current canary

## Outcome and golden journeys
Complete.
## Engineering and security evidence
Complete.
## Product experience evidence
Complete.
## UI / interaction evidence
not-applicable
## Challenger review
No blocking gaps.
## Evidence integrity
Current evidence.
`;
}

function expectSuccess(name, mutate, script = 'context-integrity.mjs', args = []) {
  const dir = copyCase(name);
  try {
    mutate(dir);
    const result = run(dir, script, args);
    if (result.status !== 0) throw new Error(`${name} did not pass. Output:\n${result.stdout}\n${result.stderr}`);
    console.log(`OK positive canary: ${name}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const baseline = run(root);
if (baseline.status !== 0) throw new Error(`baseline validation must pass:\n${baseline.stdout}\n${baseline.stderr}`);
console.log('OK positive canary: baseline');

const contextPack = run(root, 'context-pack.mjs', ['--scope', 'all']);
if (contextPack.status !== 0) throw new Error(`context pack must generate:\n${contextPack.stdout}\n${contextPack.stderr}`);
const packText = fs.readFileSync(path.join(root, '.tmp', 'context-pack.md'), 'utf8');
if (!packText.endsWith('=== CONTEXT PACK COMPLETE ===\n')) throw new Error('context pack must end with completion marker');
const contextCheck = run(root, 'context-pack.mjs', ['--check']);
if (contextCheck.status !== 0) throw new Error(`context pack freshness check must pass:\n${contextCheck.stdout}\n${contextCheck.stderr}`);
console.log('OK positive canary: context-pack-complete-and-current');

expectFailure('schema-version', (dir) => {
  const file = path.join(dir, '.project', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  manifest.schemaVersion = 999;
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
}, '$.schemaVersion must equal 3');

expectFailure('unpinned-action', (dir) => {
  const file = path.join(dir, '.github', 'workflows', 'template-integrity.yml');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/actions\/checkout@[0-9a-f]{40}/i, 'actions/checkout@v6'));
}, 'action is not pinned to a full commit SHA');

const baselineLifecycle = JSON.parse(fs.readFileSync(path.join(root, '.project', 'manifest.json'), 'utf8')).lifecycle;
expectFailure('status-drift', (dir) => {
  const file = path.join(dir, 'STATUS.md');
  const wrongLifecycle = baselineLifecycle === 'BUILD' ? 'VERIFY' : 'BUILD';
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/- Lifecycle: [A-Z_]+/, `- Lifecycle: ${wrongLifecycle}`));
}, `STATUS.md lifecycle must match manifest lifecycle ${baselineLifecycle}`, 'context-integrity.mjs');

expectFailure('status-schema-drift', (dir) => {
  const file = path.join(dir, 'STATUS.md');
  const text = fs.readFileSync(file, 'utf8').replace(/- Manifest schema: v\d+/, '- Manifest schema: v999');
  fs.writeFileSync(file, text);
}, 'STATUS.md manifest schema must match v3', 'context-integrity.mjs');

expectFailure('missing-ui-design-source', (dir) => {
  const manifest = configureProject(dir, 'DESIGN');
  manifest.project.appType = 'desktop';
  manifest.ui = { hasUserInterface: true, kind: 'desktop', platform: 'windows', devUrl: null, playwright: false, designSystem: 'canary/missing-design-system.md', designTokens: 'canary/missing-design-tokens.json', componentStrategy: 'product-components-over-proven-primitives', accessibilityTarget: 'platform accessibility requirements', visualRegression: 'required-when-stable' };
  fs.writeFileSync(path.join(dir, '.project', 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}, 'UI design source does not exist: canary/missing-design-system.md', 'context-integrity.mjs');

expectFailure('incomplete-ui-design-contract', (dir) => {
  const manifest = configureProject(dir, 'DESIGN');
  manifest.project.appType = 'desktop';
  manifest.ui = { hasUserInterface: true, kind: 'desktop', platform: 'windows', devUrl: null, playwright: false, designSystem: 'DESIGN_SYSTEM.md', designTokens: 'design-tokens.json', componentStrategy: 'product-components', accessibilityTarget: 'platform requirements', visualRegression: 'required-when-stable' };
  fs.writeFileSync(path.join(dir, '.project', 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, 'design-tokens.json'), '{}\n');
  fs.writeFileSync(path.join(dir, 'DESIGN_SYSTEM.md'), [
    '# Design', '## Product character', 'Concrete', '## Brand and creative input', 'Concrete',
    '## Reference class', 'Concrete', '## Platform conventions', 'Concrete', '## Design foundations', 'Concrete',
    '## Surface intent and hierarchy', 'Concrete', '## Component strategy', 'Concrete',
    '## Content and terminology', 'Concrete', '## UX patterns', 'Concrete',
    '## Content stress and state behavior', 'Concrete', '## Accessibility', 'Concrete'
  ].join('\n'));
}, 'missing required design section: ## Component contracts', 'context-integrity.mjs');

expectFailure('unsupported-schema-keyword', (dir) => {
  const file = path.join(dir, '.project', 'manifest.schema.json');
  const schema = JSON.parse(fs.readFileSync(file, 'utf8'));
  schema.properties.project.properties.name.pattern = '^x$';
  fs.writeFileSync(file, `${JSON.stringify(schema, null, 2)}\n`);
}, 'uses unsupported schema keyword: pattern');

expectFailure('missing-quality-context-gate', (dir) => {
  configureProject(dir, 'DEFINE');
  fs.writeFileSync(path.join(dir, '.github', 'workflows', 'quality.yml'), 'name: Quality\non: [push]\njobs:\n  quality:\n    runs-on: ubuntu-latest\n    steps:\n      - run: node .automation/validate.mjs\n');
}, 'project quality workflow must run context integrity', 'context-integrity.mjs');

expectFailure('missing-quality-context-resolution-gate', (dir) => {
  configureProject(dir, 'DEFINE');
  fs.writeFileSync(path.join(dir, '.github', 'workflows', 'quality.yml'), 'name: Quality\non: [push]\njobs:\n  quality:\n    runs-on: ubuntu-latest\n    steps:\n      - run: node .automation/validate.mjs\n      - run: node .automation/context-integrity.mjs\n');
}, 'project quality workflow must validate deterministic context resolution', 'context-integrity.mjs');

expectFailure('disabled-mandatory-quality-gate', (dir) => {
  const file = path.join(dir, '.project', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  manifest.quality.requireVisualReviewForUI = false;
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
}, '$.quality.requireVisualReviewForUI must equal true');

expectFailure('missing-context-map', (dir) => {
  fs.rmSync(path.join(dir, '.project', 'context-map.json'));
}, 'context.contextMap must reference an existing file', 'context-integrity.mjs');

expectFailure('weakened-context-map', (dir) => {
  const file = path.join(dir, '.project', 'context-map.json');
  const map = JSON.parse(fs.readFileSync(file, 'utf8'));
  map.scopes.all = map.scopes.all.filter((item) => item !== 'docs/TEST_STRATEGY.md');
  fs.writeFileSync(file, `${JSON.stringify(map, null, 2)}\n`);
}, 'context map all scope must include docs/TEST_STRATEGY.md', 'context-integrity.mjs');

expectFailure('verify-without-quality-evidence', (dir) => {
  configureProject(dir, 'VERIFY');
}, 'VERIFY requires quality.evidence', 'context-integrity.mjs');

expectFailure('verify-with-incomplete-challenger-evidence', (dir) => {
  const manifest = configureProject(dir, 'VERIFY');
  manifest.quality.evidence = 'QUALITY_EVIDENCE.md';
  fs.writeFileSync(path.join(dir, '.project', 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, 'QUALITY_EVIDENCE.md'), '# Quality Evidence\n\n- Overall status: PENDING\n- Challenger status: PENDING\n');
}, 'contains incomplete evidence placeholders', 'context-integrity.mjs');

expectSuccess('verify-with-complete-quality-evidence', (dir) => {
  const manifest = configureProject(dir, 'VERIFY');
  manifest.quality.evidence = 'QUALITY_EVIDENCE.md';
  fs.writeFileSync(path.join(dir, '.project', 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, 'QUALITY_EVIDENCE.md'), completeEvidence());
});

{
  const dir = copyCase('stale-context-pack');
  try {
    const generated = run(dir, 'context-pack.mjs', ['--scope', 'all']);
    if (generated.status !== 0) throw new Error('stale-context-pack setup generation failed');
    fs.appendFileSync(path.join(dir, 'AGENTS.md'), '\ncontext canary mutation\n');
    const result = run(dir, 'context-pack.mjs', ['--check']);
    const output = `${result.stdout}\n${result.stderr}`;
    if (result.status === 0 || !output.includes('Context pack is stale')) throw new Error(`stale-context-pack did not fail as expected. Output:\n${output}`);
    console.log('OK negative canary: stale-context-pack');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  const dir = copyCase('context-pack-revision-mismatch');
  try {
    const git = (args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
    for (const args of [['init'], ['config', 'user.email', 'canary@example.invalid'], ['config', 'user.name', 'Template Canary'], ['add', '-A'], ['commit', '-m', 'baseline']]) {
      const result = git(args);
      if (result.status !== 0) throw new Error(`revision canary git setup failed: ${result.stderr}`);
    }
    const generated = run(dir, 'context-pack.mjs', ['--scope', 'all']);
    if (generated.status !== 0) throw new Error('revision canary context pack generation failed');
    const advanced = git(['commit', '--allow-empty', '-m', 'advance revision']);
    if (advanced.status !== 0) throw new Error(`revision canary empty commit failed: ${advanced.stderr}`);
    const result = run(dir, 'context-pack.mjs', ['--check']);
    const output = `${result.stdout}\n${result.stderr}`;
    if (result.status === 0 || !output.includes('does not match current HEAD')) throw new Error(`context-pack-revision-mismatch did not fail as expected. Output:\n${output}`);
    console.log('OK negative canary: context-pack-revision-mismatch');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

console.log('Self-test OK');
