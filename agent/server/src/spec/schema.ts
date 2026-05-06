import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020, { type AnySchemaObject, type ErrorObject } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export interface SpecValidationResult {
  ok: boolean;
  errors: Array<{ path: string; message: string }>;
}

/**
 * Compiles site-spec.schema.json once and exposes whole-doc validation
 * plus a focused per-field validator that can be used by the ask-me loop
 * before a `write_field` is committed.
 */
export class SpecSchema {
  readonly raw: AnySchemaObject;
  private ajv: Ajv2020;
  private validateAll: ReturnType<Ajv2020['compile']>;
  private fieldValidators = new Map<string, ReturnType<Ajv2020['compile']>>();

  constructor(schemasDir: string) {
    this.ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(this.ajv as unknown as Parameters<typeof addFormats>[0]);

    const commonPath = resolve(schemasDir, '_common.schema.json');
    const common = JSON.parse(readFileSync(commonPath, 'utf-8')) as AnySchemaObject;
    this.ajv.addSchema(common, '_common.schema.json');

    const specPath = resolve(schemasDir, 'site-spec.schema.json');
    this.raw = JSON.parse(readFileSync(specPath, 'utf-8')) as AnySchemaObject;
    // Register under a stable URI so per-field validators can $ref into $defs.
    this.ajv.addSchema(this.raw, 'site-spec.schema.json');
    this.validateAll = this.ajv.compile(this.raw);
  }

  validate(data: unknown): SpecValidationResult {
    const ok = this.validateAll(data) as boolean;
    if (ok) return { ok: true, errors: [] };
    return { ok: false, errors: this.formatErrors(this.validateAll.errors) };
  }

  /**
   * Validate a single field value against the schema at `pointer`.
   * `pointer` is a JSON Pointer like "/global/domain". When the field is
   * a FieldEnvelope (has properties.value), validates against the inner
   * value schema rather than the envelope shape. PATCH callers pass the
   * raw value (a string, an array, etc.), not the wrapped envelope.
   */
  validateField(pointer: string, value: unknown): SpecValidationResult {
    const valuePointer = this.findValueSchemaPointer(pointer);
    if (!valuePointer) {
      return { ok: false, errors: [{ path: pointer, message: 'unknown field path' }] };
    }
    let v = this.fieldValidators.get(valuePointer);
    if (!v) {
      const wrapper: AnySchemaObject = { $ref: `site-spec.schema.json#${valuePointer}` };
      v = this.ajv.compile(wrapper);
      this.fieldValidators.set(valuePointer, v);
    }
    const ok = v(value) as boolean;
    if (ok) return { ok: true, errors: [] };
    return { ok: false, errors: this.formatErrors(v.errors) };
  }

  /**
   * Walk the spec schema to find the JSON Pointer of the value schema for
   * a given field path. For envelope fields, this points at
   * `.../properties/value`; for plain fields it points at the field schema
   * itself. Returns null if the path is unknown.
   */
  private findValueSchemaPointer(pointer: string): string | null {
    const parts = pointer.split('/').filter(Boolean);
    let node: unknown = this.raw;
    let outPointer = '';
    for (const part of parts) {
      const dereffed = this.derefIfNeeded(node);
      if (!dereffed || typeof dereffed !== 'object') return null;
      const obj = dereffed as Record<string, unknown>;
      if (obj.type === 'object' && obj.properties && (obj.properties as any)[part] !== undefined) {
        // We descend into properties — preserve the $ref-aware pointer.
        const refPath = this.refPathOf(node);
        outPointer = (refPath ?? outPointer) + `/properties/${escapeJsonPointer(part)}`;
        node = (obj.properties as any)[part];
      } else if (obj.type === 'array' && obj.items) {
        const refPath = this.refPathOf(node);
        outPointer = (refPath ?? outPointer) + `/items`;
        node = obj.items;
      } else {
        return null;
      }
    }
    const final = this.derefIfNeeded(node);
    if (final && typeof final === 'object') {
      const finalObj = final as Record<string, unknown>;
      if (finalObj.properties && (finalObj.properties as any).value !== undefined) {
        // Envelope — point at the value schema.
        const refPath = this.refPathOf(node);
        return (refPath ?? outPointer) + '/properties/value';
      }
    }
    const refPath = this.refPathOf(node);
    return refPath ?? outPointer;
  }

  /** If node is `{$ref: "#/..."}`, return the local pointer it targets. */
  private refPathOf(node: unknown): string | null {
    if (!node || typeof node !== 'object') return null;
    const obj = node as Record<string, unknown>;
    if (typeof obj.$ref === 'string' && obj.$ref.startsWith('#')) {
      return obj.$ref.slice(1);
    }
    return null;
  }

  /**
   * Walk the schema for a JSON Pointer. Resolves arrays by either index
   * (`/routes/0`) or wildcard (`/routes/*`). Resolves $ref under #/$defs.
   */
  resolvePointer(pointer: string): unknown {
    const parts = pointer.split('/').filter(Boolean);
    let node: unknown = this.raw;
    for (const part of parts) {
      node = this.derefIfNeeded(node);
      if (!node || typeof node !== 'object') return null;
      const obj = node as Record<string, unknown>;
      if (obj.type === 'object' && obj.properties && typeof obj.properties === 'object') {
        node = (obj.properties as Record<string, unknown>)[part];
      } else if (obj.type === 'array' && obj.items) {
        node = obj.items;
      } else if (obj[part] !== undefined) {
        node = obj[part];
      } else {
        return null;
      }
    }
    return this.derefIfNeeded(node);
  }

  private derefIfNeeded(node: unknown): unknown {
    if (!node || typeof node !== 'object') return node;
    const obj = node as Record<string, unknown>;
    if (typeof obj.$ref === 'string') {
      const ref = obj.$ref;
      if (ref.startsWith('#/$defs/')) {
        const key = ref.slice('#/$defs/'.length);
        const defs = (this.raw.$defs ?? {}) as Record<string, unknown>;
        return defs[key] ?? null;
      }
    }
    return node;
  }

  private formatErrors(errs: ErrorObject[] | null | undefined): SpecValidationResult['errors'] {
    return (errs ?? []).map((e) => ({
      path: e.instancePath || '/',
      message: `${e.keyword}: ${e.message ?? ''}${e.params ? ' ' + JSON.stringify(e.params) : ''}`,
    }));
  }
}

function escapeJsonPointer(s: string): string {
  return s.replace(/~/g, '~0').replace(/\//g, '~1');
}
