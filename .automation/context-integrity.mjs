import { readJson, validateContext, validateSchema, validateSchemaDefinition } from './contract.mjs';

let manifest;
let schema;
try {
  manifest = readJson('.project/manifest.json');
  schema = readJson('.project/manifest.schema.json');
} catch (error) {
  console.error(`Context integrity FAILED: ${error.message}`);
  process.exit(1);
}

const failures = [
  ...validateSchemaDefinition(schema),
  ...validateSchema(manifest, schema),
  ...validateContext(manifest)
];

if (failures.length) {
  console.error('Context integrity FAILED');
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Context integrity OK');
