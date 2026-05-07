import type { Hono } from 'hono';
import type { Repo } from '../db/repo.ts';
import type { LLMClient } from '../llm/openai.ts';
import { Workspace } from '../workspace/path.ts';
import { distillBrandProfile } from '../llm/distill.ts';

const APPROVAL_HISTORY_LIMIT = 50;

export interface DistillDeps {
  repo: Repo;
  llm: LLMClient | null;
}

/**
 * Run a distillation pass for a brand and persist the result.
 * Returns the saved profile, or throws on missing inputs / LLM errors.
 *
 * Used both by the manual endpoint and the auto-trigger inside the approval
 * handler. Caller is responsible for any in-flight de-duplication.
 */
export async function distillAndSave(
  deps: DistillDeps,
  brandId: string,
): Promise<{ profile: string; updated_at: string; promptTokens?: number; completionTokens?: number }> {
  if (!deps.llm) throw new Error('LLM not configured');
  const brand = deps.repo.getBrand(brandId);
  if (!brand) throw new Error(`brand not found: ${brandId}`);

  const workspace = new Workspace(brand.workspace);
  const memories = deps.repo.listMemories(brandId);
  const recentApprovals = deps.repo.listApprovals(brandId).slice(0, APPROVAL_HISTORY_LIMIT);

  const result = await distillBrandProfile({
    llm: deps.llm,
    brief: brand.brand_brief ?? '',
    workspace,
    recentApprovals,
    memories,
  });

  if (!result.profile) throw new Error('distillation produced empty profile');
  deps.repo.setBrandProfile(brandId, result.profile);
  const saved = deps.repo.getBrandProfile(brandId);
  if (!saved) throw new Error('failed to read back saved profile');

  return {
    profile: saved.profile,
    updated_at: saved.updated_at,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
  };
}

// ─── In-flight de-duplication ────────────────────────────────────────────────
// If multiple approvals fire in quick succession we don't want N parallel
// distill calls hitting the LLM for the same brand. Coalesce into the latest.

const inFlight = new Map<string, Promise<unknown>>();

export function distillAndSaveDedup(
  deps: DistillDeps,
  brandId: string,
): Promise<unknown> {
  const existing = inFlight.get(brandId);
  if (existing) return existing;
  const p = distillAndSave(deps, brandId).finally(() => {
    if (inFlight.get(brandId) === p) inFlight.delete(brandId);
  });
  inFlight.set(brandId, p);
  return p;
}

export function mountDistillRoutes(app: Hono, deps: DistillDeps): void {
  app.post('/brands/:id/distill-profile', async (c) => {
    const id = c.req.param('id');
    if (!deps.repo.getBrand(id)) return c.json({ error: 'brand not found' }, 404);
    if (!deps.llm) return c.json({ error: 'llm not configured' }, 503);
    try {
      const result = await distillAndSave(deps, id);
      return c.json(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return c.json({ error: msg }, 500);
    }
  });

  app.get('/brands/:id/profile', (c) => {
    const id = c.req.param('id');
    if (!deps.repo.getBrand(id)) return c.json({ error: 'brand not found' }, 404);
    const p = deps.repo.getBrandProfile(id);
    if (!p) return c.json({ profile: null, updated_at: null });
    return c.json(p);
  });

  app.patch('/brands/:id/profile', async (c) => {
    const id = c.req.param('id');
    if (!deps.repo.getBrand(id)) return c.json({ error: 'brand not found' }, 404);
    const body = (await c.req.json().catch(() => ({}))) as { profile?: string };
    if (typeof body.profile !== 'string') return c.json({ error: 'profile (string) required' }, 400);
    if (body.profile.length > 32_000) return c.json({ error: 'profile too long (>32k chars)' }, 400);
    deps.repo.setBrandProfile(id, body.profile);
    const saved = deps.repo.getBrandProfile(id);
    if (!saved) return c.json({ error: 'failed to read back saved profile' }, 500);
    return c.json(saved);
  });
}
