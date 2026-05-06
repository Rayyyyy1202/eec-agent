import type { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { Repo } from '../db/repo.ts';
import type { LLMClient } from '../llm/openai.ts';
import type { SkillRegistry } from '../skills/registry.ts';
import type { Validator } from '../tools/validate.ts';
import { runSkill, type RunEvent } from '../executor/node.ts';
import { computeCompleteness } from '../spec/completeness.ts';
import { freshPrefill, prefillSpec } from '../spec/prefill.ts';
import { runAskMeStep, type AskMeEvent } from '../spec/askme.ts';
import { SpecSchema } from '../spec/schema.ts';
import { applyPatch, loadSpec, saveSpec, type SiteSpec } from '../spec/store.ts';

export interface SpecDeps {
  repo: Repo;
  registry: SkillRegistry;
  validator: Validator;
  llm: LLMClient | null;
  schemasDir: string;
}

/**
 * Strip the FieldEnvelope wrappers so 05 receives plain values. Also
 * collapses palette objects, navigation arrays, etc. into shapes that
 * 05 already understands.
 */
function stripProvenance(spec: SiteSpec): unknown {
  const flatField = (env: any) => (env && typeof env === 'object' && 'value' in env ? env.value : env);
  const out: any = {
    brand_id: spec.brand_id,
    version: spec.version,
    updated_at: spec.updated_at,
    global: {} as Record<string, unknown>,
    navigation: {} as Record<string, unknown>,
    routes: spec.routes.map((r) => ({
      path: r.path,
      title: r.title,
      seo_intent: r.seo_intent ?? null,
      sku_template: r.sku_template ?? false,
      sections: r.sections.map((s) => ({
        id: s.id,
        variant: s.variant,
        ...(s.asset_id !== undefined && { asset_id: s.asset_id }),
        ...(s.asset_ids !== undefined && { asset_ids: s.asset_ids }),
        ...(s.copy_block_id !== undefined && { copy_block_id: s.copy_block_id }),
        ...(s.copy_block_ids !== undefined && { copy_block_ids: s.copy_block_ids }),
        ...(s.sku_id !== undefined && { sku_id: s.sku_id }),
        ...(s.sku_ids !== undefined && { sku_ids: s.sku_ids }),
        ...(s.headline !== undefined && { headline: s.headline }),
        ...(s.body !== undefined && { body: s.body }),
        ...(s.cta !== undefined && { cta: s.cta }),
      })),
      sku_ids: r.sku_ids ?? [],
      asset_ids: r.asset_ids ?? [],
      copy_block_ids: r.copy_block_ids ?? [],
    })),
  };
  for (const [k, v] of Object.entries(spec.global)) out.global[k] = flatField(v);
  for (const [k, v] of Object.entries(spec.navigation)) out.navigation[k] = flatField(v);
  return out;
}

export function mountSpecRoutes(app: Hono, deps: SpecDeps): void {
  const schema = new SpecSchema(deps.schemasDir);

  // ─── GET /brands/:id/spec ──────────────────────────────────────────────
  app.get('/brands/:id/spec', (c) => {
    const brand = deps.repo.getBrand(c.req.param('id'));
    if (!brand) return c.json({ error: 'unknown brand' }, 404);
    const existing = loadSpec(brand.workspace, brand.id);
    // Auto-prefill on first read so the user sees populated fields immediately
    const spec = existing.routes.length === 0 ? prefillSpec(brand.workspace, existing) : existing;
    if (existing.routes.length === 0) saveSpec(brand.workspace, spec);
    return c.json({
      spec,
      completeness: computeCompleteness(spec),
    });
  });

  // ─── POST /brands/:id/spec/refresh ─────────────────────────────────────
  app.post('/brands/:id/spec/refresh', (c) => {
    const brand = deps.repo.getBrand(c.req.param('id'));
    if (!brand) return c.json({ error: 'unknown brand' }, 404);
    const existing = loadSpec(brand.workspace, brand.id);
    const next = prefillSpec(brand.workspace, existing);
    saveSpec(brand.workspace, next);
    return c.json({ spec: next, completeness: computeCompleteness(next) });
  });

  // ─── PATCH /brands/:id/spec  body: { path, value, source? } ────────────
  app.patch('/brands/:id/spec', async (c) => {
    const brand = deps.repo.getBrand(c.req.param('id'));
    if (!brand) return c.json({ error: 'unknown brand' }, 404);
    const body = (await c.req.json().catch(() => ({}))) as {
      path?: string;
      value?: unknown;
      source?: 'user' | 'derived';
    };
    if (!body.path) return c.json({ error: 'path required' }, 400);

    const validation = schema.validateField(body.path, body.value);
    if (!validation.ok) return c.json({ error: 'validation failed', errors: validation.errors }, 422);

    const cur = loadSpec(brand.workspace, brand.id);
    const next = applyPatch(cur, body.path, body.value, body.source ?? 'user');
    saveSpec(brand.workspace, next);
    return c.json({ spec: next, completeness: computeCompleteness(next) });
  });

  // ─── POST /brands/:id/spec/ask  body: { field_path, user_reply?, history? } ──
  app.post('/brands/:id/spec/ask', async (c) => {
    const brand = deps.repo.getBrand(c.req.param('id'));
    if (!brand) return c.json({ error: 'unknown brand' }, 404);
    const llm = deps.llm;
    if (!llm) return c.json({ error: 'OPENAI_API_KEY not set on server' }, 503);

    const body = (await c.req.json().catch(() => ({}))) as {
      field_path?: string;
      user_reply?: string;
      history?: ChatCompletionMessageParam[];
      model?: string;
    };
    if (!body.field_path) return c.json({ error: 'field_path required' }, 400);
    const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : undefined;

    return streamSSE(c, async (stream) => {
      const send = async (e: AskMeEvent | { type: 'state'; payload: unknown }) => {
        await stream.writeSSE({ event: e.type, data: JSON.stringify(e.payload) });
      };
      try {
        const cur = loadSpec(brand.workspace, brand.id);
        const result = await runAskMeStep(
          {
            fieldPath: body.field_path!,
            spec: cur,
            schema,
            llm,
            brandName: brand.name,
            brandBrief: brand.brand_brief,
            userReply: body.user_reply,
            history: body.history,
            saveSpec: (s) => saveSpec(brand.workspace, s),
            model,
          },
          (e) => send(e),
        );
        await send({
          type: 'state',
          payload: {
            done: result.done,
            awaiting_user: result.awaitingUser,
            history: result.history,
          },
        });
      } catch (err) {
        await send({ type: 'error', payload: { message: (err as Error).message } });
      }
    });
  });

  // ─── POST /brands/:id/spec/build  → write input-spec.json + stream skill 05 ──
  app.post('/brands/:id/spec/build', async (c) => {
    const brand = deps.repo.getBrand(c.req.param('id'));
    if (!brand) return c.json({ error: 'unknown brand' }, 404);
    const llm = deps.llm;
    if (!llm) return c.json({ error: 'OPENAI_API_KEY not set on server' }, 503);

    const body = (await c.req.json().catch(() => ({}))) as {
      auto_stub_upstream?: boolean;
      allow_missing_upstream?: boolean;
      turn_cap?: number;
      model?: string;
    };
    const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : undefined;

    const node = deps.registry.get('05');
    if (!node) return c.json({ error: 'skill 05 not registered' }, 500);

    const cur = loadSpec(brand.workspace, brand.id);
    const completeness = computeCompleteness(cur);
    if (!completeness.ready_to_build) {
      return c.json(
        { error: 'spec not ready to build', completeness, missing: completeness.empty_required_paths },
        409,
      );
    }

    // Write the synthesized input-spec.json that 05's prompt will read first.
    const flat = stripProvenance(cur);
    const inputSpecPath = join(brand.workspace, 'eec', '05-site-build', 'input-spec.json');
    mkdirSync(dirname(inputSpecPath), { recursive: true });
    writeFileSync(inputSpecPath, JSON.stringify(flat, null, 2), 'utf-8');

    const { Workspace } = await import('../workspace/path.ts');
    const ws = new Workspace(brand.workspace);

    return streamSSE(c, async (stream) => {
      const send = async (e: { type: string; payload: unknown }) => {
        await stream.writeSSE({ event: e.type, data: JSON.stringify(e.payload) });
      };
      try {
        await send({
          type: 'spec_written',
          payload: { path: inputSpecPath, bytes: existsSync(inputSpecPath) ? 1 : 0 },
        });
        const result = await runSkill(
          '05',
          deps.registry,
          ws,
          deps.validator,
          llm,
          (e: RunEvent) => void send({ type: e.type, payload: e.payload }),
          {
            brandBrief: brand.brand_brief ?? undefined,
            turnCap: body.turn_cap,
            autoStubUpstream: body.auto_stub_upstream,
            allowMissingUpstream: body.allow_missing_upstream,
            model,
          },
        );
        await send({ type: 'result', payload: result });
      } catch (err) {
        await send({ type: 'error', payload: { message: (err as Error).message } });
      }
    });
  });
}
