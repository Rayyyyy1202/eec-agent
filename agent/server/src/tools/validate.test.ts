import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Validator } from './validate.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../../..');
const SCHEMAS_DIR = join(REPO_ROOT, 'shared', 'schemas');

describe('Validator', () => {
  const dir = mkdtempSync(join(tmpdir(), 'schema-'));

  it('compiles and accepts a valid object', () => {
    const schemaPath = join(dir, 'simple.schema.json');
    writeFileSync(
      schemaPath,
      JSON.stringify({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1 },
          age: { type: 'integer', minimum: 0 },
        },
      }),
    );
    const v = new Validator(SCHEMAS_DIR);
    const r = v.validate(schemaPath, { name: 'alice', age: 30 });
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('rejects an invalid object with structured errors', () => {
    const schemaPath = join(dir, 'invalid.schema.json');
    writeFileSync(
      schemaPath,
      JSON.stringify({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string', minLength: 1 } },
      }),
    );
    const v = new Validator(SCHEMAS_DIR);
    const r = v.validate(schemaPath, { age: 30 });
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.errors[0]).toHaveProperty('path');
    expect(r.errors[0]).toHaveProperty('message');
  });

  it('caches compiled schemas across calls', () => {
    const schemaPath = join(dir, 'cached.schema.json');
    writeFileSync(
      schemaPath,
      JSON.stringify({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'string',
      }),
    );
    const v = new Validator(SCHEMAS_DIR);
    expect(v.validate(schemaPath, 'hello').ok).toBe(true);
    expect(v.validate(schemaPath, 42).ok).toBe(false);
  });

  it('resolves $ref to _common.schema.json', () => {
    const schemaPath = join(dir, 'refs-common.schema.json');
    writeFileSync(
      schemaPath,
      JSON.stringify({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        required: ['confidence'],
        properties: {
          confidence: { $ref: '_common.schema.json#/$defs/Confidence' },
        },
      }),
    );
    const v = new Validator(SCHEMAS_DIR);
    expect(v.validate(schemaPath, { confidence: 'high' }).ok).toBe(true);
    expect(v.validate(schemaPath, { confidence: 'super-high' }).ok).toBe(false);
  });

  it('applies format validators (date-time, uri)', () => {
    const schemaPath = join(dir, 'formats.schema.json');
    writeFileSync(
      schemaPath,
      JSON.stringify({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          when: { type: 'string', format: 'date-time' },
          where: { type: 'string', format: 'uri' },
        },
      }),
    );
    const v = new Validator(SCHEMAS_DIR);
    expect(
      v.validate(schemaPath, { when: '2026-05-07T10:00:00Z', where: 'https://example.com' }).ok,
    ).toBe(true);
    expect(v.validate(schemaPath, { when: 'not-a-date' }).ok).toBe(false);
  });
});
