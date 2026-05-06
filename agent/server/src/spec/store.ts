import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type Source =
  | 'empty'
  | 'user'
  | '01'
  | '02'
  | '03'
  | '04'
  | '03+04'
  | '04+03'
  | 'derived';

export interface FieldEnvelope<T> {
  value: T | null;
  source: Source;
  locked?: boolean;
  required?: boolean;
}

export interface NavItem {
  label: string;
  route: string;
}

export interface Section {
  id: string;
  variant: string;
  asset_id?: string | null;
  asset_ids?: string[];
  copy_block_id?: string | null;
  copy_block_ids?: string[];
  sku_id?: string | null;
  sku_ids?: string[];
  headline?: string | null;
  body?: string | null;
  cta?: { label: string; route: string } | null;
  source?: Source;
  required?: boolean;
}

export interface Route {
  path: string;
  title: string;
  seo_intent?: string | null;
  sku_template?: boolean;
  sections: Section[];
  sku_ids?: string[];
  asset_ids?: string[];
  copy_block_ids?: string[];
  source?: Source;
}

export interface SiteSpec {
  brand_id: string;
  version: number;
  updated_at: string;
  global: {
    brand_name: FieldEnvelope<string>;
    tagline: FieldEnvelope<string>;
    mission: FieldEnvelope<string>;
    primary_palette: FieldEnvelope<string[]>;
    logo_brief: FieldEnvelope<string>;
    voice_tone: FieldEnvelope<string>;
    domain: FieldEnvelope<string>;
    tech_stack: FieldEnvelope<string>;
  };
  navigation: {
    header: FieldEnvelope<NavItem[]>;
    footer: FieldEnvelope<NavItem[]>;
  };
  routes: Route[];
}

const empty = <T>(required = false): FieldEnvelope<T> => ({
  value: null,
  source: 'empty',
  locked: false,
  required,
});

export function newEmptySpec(brandId: string): SiteSpec {
  return {
    brand_id: brandId,
    version: 1,
    updated_at: new Date().toISOString(),
    global: {
      brand_name: empty<string>(true),
      tagline: empty<string>(true),
      mission: empty<string>(),
      primary_palette: empty<string[]>(true),
      logo_brief: empty<string>(),
      voice_tone: empty<string>(),
      domain: empty<string>(true),
      tech_stack: empty<string>(),
    },
    navigation: {
      header: empty<NavItem[]>(true),
      footer: empty<NavItem[]>(),
    },
    routes: [],
  };
}

export function specFilePath(workspaceRoot: string): string {
  return join(workspaceRoot, 'eec', 'build-plan', 'spec.json');
}

export function loadSpec(workspaceRoot: string, brandId: string): SiteSpec {
  const file = specFilePath(workspaceRoot);
  if (!existsSync(file)) return newEmptySpec(brandId);
  try {
    const data = JSON.parse(readFileSync(file, 'utf-8')) as SiteSpec;
    if (!data.brand_id) data.brand_id = brandId;
    return data;
  } catch {
    return newEmptySpec(brandId);
  }
}

export function saveSpec(workspaceRoot: string, spec: SiteSpec): void {
  const file = specFilePath(workspaceRoot);
  mkdirSync(dirname(file), { recursive: true });
  spec.updated_at = new Date().toISOString();
  writeFileSync(file, JSON.stringify(spec, null, 2), 'utf-8');
}

/**
 * Apply a JSON-Pointer-style mutation. Pointer is "/global/domain" or
 * "/routes/0/sections/2/copy_block_id". Always wraps writes through the
 * field envelope when the target is one (so source/locked stay sane).
 */
export function applyPatch(
  spec: SiteSpec,
  pointer: string,
  newValue: unknown,
  source: Source = 'user',
): SiteSpec {
  const parts = pointer.split('/').filter(Boolean);
  if (parts.length === 0) throw new Error('empty pointer');

  const next = JSON.parse(JSON.stringify(spec)) as SiteSpec;
  let parent: any = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i] as string;
    if (parent[key] == null) {
      parent[key] = isIndex(parts[i + 1] as string) ? [] : {};
    }
    parent = parent[key];
  }
  const leaf = parts[parts.length - 1] as string;

  const cur = parent[leaf];
  if (cur && typeof cur === 'object' && 'value' in cur && 'source' in cur) {
    parent[leaf] = { ...cur, value: newValue, source, locked: source === 'user' ? true : cur.locked };
  } else {
    parent[leaf] = newValue;
  }
  return next;
}

function isIndex(s: string): boolean {
  return /^[0-9]+$/.test(s);
}

/**
 * Traverse a pointer in a SiteSpec value (without schema). Used by the
 * ask-me chat to read the current value of a field before prompting.
 */
export function readPointer(spec: SiteSpec, pointer: string): unknown {
  const parts = pointer.split('/').filter(Boolean);
  let node: any = spec;
  for (const part of parts) {
    if (node == null) return undefined;
    node = node[part];
  }
  return node;
}
