import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root, readJson } from './contract.mjs';

const map = readJson('.project/context-map.json');
const manifest = readJson('.project/manifest.json');
const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};
const unique = (items) => [...new Set(items.filter(Boolean))];
const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

function manifestValue(dotted) {
  return dotted.split('.').reduce((value, key) => value?.[key], manifest);
}

function gitHead() {
  try {
    return execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'unavailable';
  }
}
function selectedScopes() {
  const raw = valueAfter('--scope');
  if (!raw) return ['all'];
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

function resolveSources(scopes) {
  const sources = [...(map.always || []), ...(map.lifecycle?.[manifest.lifecycle] || [])];
  const requested = scopes.length ? scopes : [];
  for (const scope of requested) {
    const mapped = map.scopes?.[scope];
    if (mapped) sources.push(...mapped);
    else if (map.rules?.unknownScopeFallsBackToAll) { console.warn(`Unknown context scope '${scope}', falling back to all.`); sources.push(...(map.scopes?.all || [])); }
    else throw new Error(`Unknown context scope: ${scope}`);
  }
  for (const dotted of map.manifestReferences || []) {
    const value = manifestValue(dotted);
    if (typeof value === 'string' && value.trim() && !['UNSET', 'not-applicable'].includes(value)) sources.push(value);
  }
  return unique(sources);
}

function sourceRecord(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) throw new Error(`Required context source missing: ${rel}`);
  const content = fs.readFileSync(full, 'utf8');
  return {
    path: rel.replaceAll('\\', '/'),
    bytes: Buffer.byteLength(content),
    lines: content.split(/\r?\n/).length,
    sha256: sha256(content),
    content
  };
}
function checkExisting() {
  const metaPath = path.join(root, '.tmp', 'context-pack.json');
  if (!fs.existsSync(metaPath)) throw new Error('No context pack receipt exists; generate one before material work.');
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const currentRevision = gitHead();
  if (currentRevision !== 'unavailable' && meta.revision !== currentRevision) {
    throw new Error(`Context pack revision ${meta.revision} does not match current HEAD ${currentRevision}`);
  }
  const requiredScopes = selectedScopes();
  if (!meta.scopes?.includes('all')) {
    for (const scope of requiredScopes) {
      if (!meta.scopes?.includes(scope)) throw new Error(`Latest context pack does not satisfy required scope: ${scope}`);
    }
  }
  const stale = [];
  for (const source of meta.sources || []) {
    const full = path.join(root, source.path);
    if (!fs.existsSync(full)) stale.push(`${source.path} is missing`);
    else if (sha256(fs.readFileSync(full, 'utf8')) !== source.sha256) stale.push(`${source.path} changed`);
  }
  if (stale.length) throw new Error(`Context pack is stale:\n- ${stale.join('\n- ')}`);
  console.log(`Context pack current (${meta.sources.length} sources; scopes=${meta.scopes.join(',')}).`);
}

if (has('--check')) {
  try { checkExisting(); } catch (error) { console.error(`Context pack check FAILED: ${error.message}`); process.exit(1); }
  process.exit(0);
}

const scopes = selectedScopes();
let records;
try {
  records = resolveSources(scopes).map(sourceRecord);
} catch (error) {
  console.error(`Context pack FAILED: ${error.message}`);
  process.exit(1);
}

const totalBytes = records.reduce((sum, item) => sum + item.bytes, 0);
const lines = [
  '# Repository Context Pack',
  '',
  `- Revision: ${gitHead()}`,
  `- Lifecycle: ${manifest.lifecycle}`,
  `- Scopes: ${scopes.join(', ')}`,
  `- Sources: ${records.length}`,
  `- Source bytes: ${totalBytes}`,
  '',
  '> Read this generated pack through the completion marker before material work. Missing marker means reading is incomplete.',
  ''
];
for (const [index, record] of records.entries()) {
  lines.push(`## ${String(index + 1).padStart(2, '0')} — ${record.path}`);
  lines.push('');
  lines.push(`- SHA-256: ${record.sha256}`);
  lines.push(`- Bytes: ${record.bytes}`);
  lines.push(`- Lines: ${record.lines}`);
  lines.push('');
  lines.push('```text');
  lines.push(record.content.replace(/```/g, '``\u200b`'));
  lines.push('```');
  lines.push('');
}
lines.push('=== CONTEXT PACK COMPLETE ===');

const tmp = path.join(root, '.tmp');
fs.mkdirSync(tmp, { recursive: true });
const packPath = path.join(tmp, 'context-pack.md');
const metaPath = path.join(tmp, 'context-pack.json');
fs.writeFileSync(packPath, `${lines.join('\n')}\n`);
fs.writeFileSync(metaPath, `${JSON.stringify({
  version: 1,
  revision: gitHead(),
  lifecycle: manifest.lifecycle,
  scopes,
  generatedAt: new Date().toISOString(),
  completionMarker: '=== CONTEXT PACK COMPLETE ===',
  sources: records.map(({ content, ...record }) => record)
}, null, 2)}\n`);

if (has('--list')) records.forEach((item, index) => console.log(`${index + 1}. ${item.path} ${item.sha256}`));
console.log(`Context pack generated: ${path.relative(root, packPath)} (${records.length} sources, ${totalBytes} source bytes).`);
console.log('Read the generated file completely and confirm the final marker before material work.');
