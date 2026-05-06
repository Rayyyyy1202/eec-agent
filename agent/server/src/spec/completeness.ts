import type { FieldEnvelope, SiteSpec } from './store.ts';

export interface CompletenessReport {
  filled: number;
  required_empty: number;
  total_required: number;
  ready_to_build: boolean;
  empty_required_paths: string[];
}

function isEmpty(env: FieldEnvelope<unknown> | undefined | null): boolean {
  if (!env) return true;
  if (env.value == null) return true;
  if (typeof env.value === 'string' && env.value.trim() === '') return true;
  if (Array.isArray(env.value) && env.value.length === 0) return true;
  return false;
}

function visitGlobal(spec: SiteSpec, out: CompletenessReport): void {
  for (const [key, env] of Object.entries(spec.global)) {
    const e = env as FieldEnvelope<unknown>;
    const isReq = e?.required === true;
    const empty = isEmpty(e);
    if (isReq) {
      out.total_required += 1;
      if (empty) {
        out.required_empty += 1;
        out.empty_required_paths.push(`/global/${key}`);
      }
    }
    if (!empty) out.filled += 1;
  }
}

function visitNav(spec: SiteSpec, out: CompletenessReport): void {
  for (const [key, env] of Object.entries(spec.navigation)) {
    const e = env as FieldEnvelope<unknown>;
    const isReq = e?.required === true;
    const empty = isEmpty(e);
    if (isReq) {
      out.total_required += 1;
      if (empty) {
        out.required_empty += 1;
        out.empty_required_paths.push(`/navigation/${key}`);
      }
    }
    if (!empty) out.filled += 1;
  }
}

function visitRoutes(spec: SiteSpec, out: CompletenessReport): void {
  if (spec.routes.length === 0) {
    out.total_required += 1;
    out.required_empty += 1;
    out.empty_required_paths.push('/routes');
    return;
  }
  spec.routes.forEach((r, i) => {
    if (!r.path || !r.title) {
      out.total_required += 1;
      out.required_empty += 1;
      out.empty_required_paths.push(`/routes/${i}`);
    } else {
      out.filled += 1;
    }
    r.sections.forEach((s, j) => {
      if (s.required && !s.variant) {
        out.total_required += 1;
        out.required_empty += 1;
        out.empty_required_paths.push(`/routes/${i}/sections/${j}/variant`);
      } else if (s.variant) {
        out.filled += 1;
      }
    });
  });
}

export function computeCompleteness(spec: SiteSpec): CompletenessReport {
  const out: CompletenessReport = {
    filled: 0,
    required_empty: 0,
    total_required: 0,
    ready_to_build: false,
    empty_required_paths: [],
  };
  visitGlobal(spec, out);
  visitNav(spec, out);
  visitRoutes(spec, out);
  out.ready_to_build = out.required_empty === 0;
  return out;
}
