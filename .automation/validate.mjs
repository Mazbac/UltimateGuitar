import fs from 'node:fs';
import path from 'node:path';
import { root, readJson, validateContext, validateSchema, validateSchemaDefinition } from './contract.mjs';

const failures = [];
const required = [
  'AGENTS.md', 'START_HERE.md', 'PROJECT.md', 'STATUS.md', 'PLAN.md',
  'ARCHITECTURE.md', 'DECISIONS.md', 'RISKS.md', 'BACKLOG.md', '.editorconfig',
  '.automation/bootstrap.mjs', '.automation/doctor.mjs', '.automation/contract.mjs', '.automation/context-pack.mjs',
  '.automation/context-integrity.mjs', '.automation/self-test.mjs', '.githooks/pre-push',
  '.project/manifest.json', '.project/manifest.schema.json', '.project/context-map.json',
  'docs/PRODUCT_DISCOVERY.md', 'docs/PROJECT_ACTIVATION.md', 'docs/SDLC.md', 'docs/CONTEXT_RESOLUTION.md',
  'docs/CONTEXT_INTEGRITY.md', 'docs/DESIGN_STANDARD.md', 'docs/DESIGN_SYSTEM_TEMPLATE.md',
  'docs/PRODUCT_EXPERIENCE_STANDARD.md', 'docs/SECURITY_STANDARD.md',
  'docs/TEST_STRATEGY.md', 'docs/DEFINITION_OF_DONE.md', 'docs/QUALITY_EVIDENCE_TEMPLATE.md',
  'docs/TOOL_POLICY.md', 'docs/RELEASE_AND_RECOVERY.md'
];

for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) failures.push(`missing required file: ${rel}`);
  else if (fs.statSync(full).size === 0) failures.push(`empty required file: ${rel}`);
}

let manifest;
let schema;
try {
  manifest = readJson('.project/manifest.json');
  schema = readJson('.project/manifest.schema.json');
} catch (error) {
  failures.push(`invalid manifest/schema JSON: ${error.message}`);
}

if (manifest && schema) {
  failures.push(...validateSchemaDefinition(schema));
  failures.push(...validateSchema(manifest, schema));
  failures.push(...validateContext(manifest));
}

const workflowDir = path.join(root, '.github/workflows');
if (fs.existsSync(workflowDir)) {
  for (const name of fs.readdirSync(workflowDir)) {
    if (!/\.ya?ml$/i.test(name)) continue;
    const rel = `.github/workflows/${name}`;
    const text = fs.readFileSync(path.join(workflowDir, name), 'utf8');
    for (const [index, line] of text.split(/\r?\n/).entries()) {
      const match = line.match(/\buses:\s*([^\s#]+)/);
      if (!match) continue;
      const target = match[1].replace(/["']/g, '');
      if (target.startsWith('./')) continue;
      const at = target.lastIndexOf('@');
      const ref = at >= 0 ? target.slice(at + 1) : '';
      if (!/^[0-9a-f]{40}$/i.test(ref)) failures.push(`${rel}:${index + 1} action is not pinned to a full commit SHA: ${target}`);
    }
  }
}

if (failures.length) {
  console.error('Template validation FAILED');
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Template validation OK (${required.length} required files checked; manifest schema + context integrity enforced)`);
