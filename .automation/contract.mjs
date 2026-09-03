import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

export function readText(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

export function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function typeMatches(value, expected) {
  if (expected === 'null') return value === null;
  if (expected === 'array') return Array.isArray(value);
  if (expected === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (expected === 'integer') return Number.isInteger(value);
  return typeof value === expected;
}

export function validateSchema(value, schema, at = '$') {
  const failures = [];
  if (Object.hasOwn(schema, 'const') && value !== schema.const) failures.push(`${at} must equal ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.some((item) => item === value)) failures.push(`${at} must be one of ${schema.enum.join(', ')}`);

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => typeMatches(value, type))) {
      failures.push(`${at} must have type ${types.join(' or ')}`);
      return failures;
    }
  }

  if (typeof value === 'string' && schema.minLength && value.length < schema.minLength) failures.push(`${at} is too short`);
  if (Array.isArray(value) && schema.minItems && value.length < schema.minItems) failures.push(`${at} requires at least ${schema.minItems} items`);

  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => failures.push(...validateSchema(item, schema.items, `${at}[${index}]`)));
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const properties = schema.properties || {};
    for (const key of schema.required || []) {
      if (!Object.hasOwn(value, key)) failures.push(`${at}.${key} is required`);
    }
    for (const [key, child] of Object.entries(value)) {
      if (properties[key]) failures.push(...validateSchema(child, properties[key], `${at}.${key}`));
      else if (schema.additionalProperties === false) failures.push(`${at}.${key} is not allowed`);
    }
  }
  return failures;
}

export const lifecycleOrder = [
  'TEMPLATE', 'DISCOVER', 'DEFINE', 'DESIGN', 'BUILD', 'VERIFY',
  'RELEASE_CANDIDATE', 'RELEASED', 'OPERATE'
];

function atLeast(manifest, lifecycle) {
  return lifecycleOrder.indexOf(manifest.lifecycle) >= lifecycleOrder.indexOf(lifecycle);
}

function isSet(value) {
  return typeof value === 'string' && value.trim() && value !== 'UNSET';
}

export function validateContext(manifest) {
  const failures = [];
  const requiredResume = ['.project/manifest.json', 'PROJECT.md', 'STATUS.md', 'PLAN.md', 'DECISIONS.md', 'RISKS.md', 'ARCHITECTURE.md'];
  for (const rel of requiredResume) {
    if (!manifest.context?.resumeSources?.includes(rel)) failures.push(`context.resumeSources must include ${rel}`);
  }
  for (const rel of manifest.context?.resumeSources || []) {
    if (!exists(rel)) failures.push(`resume source does not exist: ${rel}`);
  }
  if (!exists(manifest.quality?.definitionOfDone || '')) failures.push('quality.definitionOfDone must reference an existing file');
  if (!exists(manifest.context?.contextMap || '')) failures.push('context.contextMap must reference an existing file');
  else {
    try {
      const contextMap = readJson(manifest.context.contextMap);
      if (contextMap.version !== 1) failures.push('context map version must equal 1');
      if (!Array.isArray(contextMap.always) || !contextMap.always.length) failures.push('context map requires always sources');
      if (!contextMap.lifecycle || typeof contextMap.lifecycle !== 'object') failures.push('context map requires lifecycle mappings');
      if (!contextMap.scopes || typeof contextMap.scopes !== 'object' || !contextMap.scopes.all) failures.push('context map requires scopes including all');
      const requiredAlways = ['AGENTS.md', '.project/manifest.json', 'PROJECT.md', 'STATUS.md', 'PLAN.md', 'DECISIONS.md', 'RISKS.md', 'ARCHITECTURE.md', 'docs/CONTEXT_INTEGRITY.md', 'docs/CONTEXT_RESOLUTION.md', 'docs/DEFINITION_OF_DONE.md', 'docs/TOOL_POLICY.md'];
      const requiredAll = ['docs/PRODUCT_DISCOVERY.md', 'docs/PROJECT_ACTIVATION.md', 'docs/SDLC.md', 'docs/DESIGN_STANDARD.md', 'docs/PRODUCT_EXPERIENCE_STANDARD.md', 'docs/SECURITY_STANDARD.md', 'docs/TEST_STRATEGY.md', 'docs/RELEASE_AND_RECOVERY.md', 'docs/QUALITY_EVIDENCE_TEMPLATE.md', 'docs/DESIGN_SYSTEM_TEMPLATE.md'];
      const requiredRefs = ['ui.designSystem', 'ui.designTokens', 'quality.evidence', 'quality.definitionOfDone'];
      for (const rel of requiredAlways) if (!contextMap.always?.includes(rel)) failures.push(`context map always sources must include ${rel}`);
      for (const rel of requiredAll) if (!contextMap.scopes?.all?.includes(rel)) failures.push(`context map all scope must include ${rel}`);
      for (const ref of requiredRefs) if (!contextMap.manifestReferences?.includes(ref)) failures.push(`context map manifestReferences must include ${ref}`);
      if (contextMap.rules?.materialWorkRequiresPack !== true) failures.push('context map must require a pack for material work');
      if (contextMap.rules?.unknownScopeFallsBackToAll !== true) failures.push('context map must fall back unknown scopes to all');
      if (contextMap.rules?.requireCompletionMarker !== true) failures.push('context map must require the completion marker');
      for (const rel of contextMap.always || []) if (!exists(rel)) failures.push(`context map source does not exist: ${rel}`);
      for (const group of [contextMap.lifecycle, contextMap.scopes]) {
        for (const sources of Object.values(group || {})) {
          if (!Array.isArray(sources)) { failures.push('context map lifecycle/scope entries must be arrays'); continue; }
          for (const rel of sources) if (!exists(rel)) failures.push(`context map source does not exist: ${rel}`);
        }
      }
    } catch (error) {
      failures.push(`context map is invalid: ${error.message}`);
    }
  }

  const status = exists('STATUS.md') ? readText('STATUS.md') : '';
  if (!status.includes(`- Lifecycle: ${manifest.lifecycle}`)) failures.push(`STATUS.md lifecycle must match manifest lifecycle ${manifest.lifecycle}`);
  if (!status.includes(`- Manifest schema: v${manifest.schemaVersion}`)) failures.push(`STATUS.md manifest schema must match v${manifest.schemaVersion}`);

  if (manifest.mode === 'template') {
    if (manifest.lifecycle !== 'TEMPLATE') failures.push('template mode must use TEMPLATE lifecycle');
    return failures;
  }

  if (manifest.lifecycle === 'TEMPLATE') failures.push('project mode cannot use TEMPLATE lifecycle');
  if (JSON.stringify(manifest).includes('UNSET')) failures.push('project manifest still contains UNSET placeholders');
  if (!manifest.project?.primaryUsers?.length) failures.push('project mode requires at least one primary user');
  if (!isSet(manifest.commands?.verify)) failures.push('project mode requires commands.verify');
  if (!exists('.github/workflows/quality.yml')) failures.push('project mode requires .github/workflows/quality.yml');
  else {
    const qualityWorkflow = readText('.github/workflows/quality.yml');
    if (!qualityWorkflow.includes('.automation/validate.mjs')) failures.push('project quality workflow must run repository validation');
    if (!qualityWorkflow.includes('.automation/context-integrity.mjs')) failures.push('project quality workflow must run context integrity');
    if (!qualityWorkflow.includes('.automation/context-pack.mjs')) failures.push('project quality workflow must validate deterministic context resolution');
  }

  const project = exists('PROJECT.md') ? readText('PROJECT.md') : '';
  if (project.includes('UNSET')) failures.push('PROJECT.md still contains UNSET placeholders');

  if (atLeast(manifest, 'DEFINE')) {
    const architecture = exists('ARCHITECTURE.md') ? readText('ARCHITECTURE.md') : '';
    if (architecture.includes('UNSET until discovery')) failures.push('DEFINE requires concrete project architecture');
  }

  if (atLeast(manifest, 'DESIGN')) {
    if (!manifest.experience?.goldenJourneys?.length) failures.push('DESIGN requires at least one experience.goldenJourneys entry');
    if (manifest.ui?.hasUserInterface) {
      if (!isSet(manifest.ui.designSystem)) failures.push('UI DESIGN requires ui.designSystem');
      if (!isSet(manifest.ui.designTokens)) failures.push('UI DESIGN requires ui.designTokens');
      if (!isSet(manifest.ui.componentStrategy) || manifest.ui.componentStrategy === 'not-applicable') failures.push('UI DESIGN requires a component strategy');
      if (!isSet(manifest.ui.accessibilityTarget) || manifest.ui.accessibilityTarget === 'not-applicable') failures.push('UI DESIGN requires an accessibility target');
      for (const rel of [manifest.ui.designSystem, manifest.ui.designTokens]) {
        if (isSet(rel) && !exists(rel)) failures.push(`UI design source does not exist: ${rel}`);
      }
      if (isSet(manifest.ui.designSystem) && exists(manifest.ui.designSystem)) {
        const designText = readText(manifest.ui.designSystem);
        if (designText.includes('UNSET')) failures.push(`${manifest.ui.designSystem} still contains UNSET placeholders`);
        for (const heading of ['## Product character', '## Brand and creative input', '## Reference class', '## Platform conventions', '## Design foundations', '## Surface intent and hierarchy', '## Component strategy', '## Component contracts', '## Content and terminology', '## UX patterns', '## Content stress and state behavior', '## Accessibility']) {
          if (!designText.includes(heading)) failures.push(`${manifest.ui.designSystem} missing required design section: ${heading}`);
        }
      }
    }
  }

  if (manifest.ui?.hasUserInterface && manifest.ui.kind === 'web') {
    if (!manifest.ui.playwright) failures.push('web UI projects must enable Playwright');
    if (!manifest.ui.devUrl) failures.push('web UI projects require ui.devUrl');
  }

  if (atLeast(manifest, 'VERIFY') && manifest.ui?.hasUserInterface && !isSet(manifest.commands?.e2e)) {
    failures.push('VERIFY for UI projects requires commands.e2e');
  }

  if (atLeast(manifest, 'VERIFY')) {
    if (!isSet(manifest.quality?.evidence)) failures.push('VERIFY requires quality.evidence');
    else if (!exists(manifest.quality.evidence)) failures.push(`quality evidence source does not exist: ${manifest.quality.evidence}`);
    else {
      const evidence = readText(manifest.quality.evidence);
      if (/\b(?:UNSET|PENDING)\b/.test(evidence)) failures.push(`${manifest.quality.evidence} contains incomplete evidence placeholders`);
      for (const heading of ['## Outcome and golden journeys', '## Engineering and security evidence', '## Product experience evidence', '## UI / interaction evidence', '## Challenger review', '## Evidence integrity']) {
        if (!evidence.includes(heading)) failures.push(`${manifest.quality.evidence} missing required evidence section: ${heading}`);
      }
      if (!evidence.includes('- Overall status: PASS')) failures.push(`${manifest.quality.evidence} must record Overall status: PASS`);
      if (!evidence.includes('- Challenger status: PASS')) failures.push(`${manifest.quality.evidence} must record Challenger status: PASS`);
    }
  }

  return failures;
}

export function validateSchemaDefinition(schema, at = '$schema') {
  const failures = [];
  const allowed = new Set(['$schema', 'title', 'type', 'required', 'properties', 'additionalProperties', 'const', 'enum', 'minLength', 'minItems', 'items']);
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return [`${at} must be a schema object`];
  for (const key of Object.keys(schema)) {
    if (!allowed.has(key)) failures.push(`${at} uses unsupported schema keyword: ${key}`);
  }
  if (schema.properties) {
    for (const [name, child] of Object.entries(schema.properties)) failures.push(...validateSchemaDefinition(child, `${at}.properties.${name}`));
  }
  if (schema.items) failures.push(...validateSchemaDefinition(schema.items, `${at}.items`));
  return failures;
}
