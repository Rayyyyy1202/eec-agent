import type { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionContentPart,
} from 'openai/resources/chat/completions';
import type { Repo, Message, TaskRow } from '../db/repo.ts';
import type { SkillRegistry } from '../skills/registry.ts';
import type { Validator } from '../tools/validate.ts';
import type { LLMClient } from '../llm/openai.ts';
import { Workspace } from '../workspace/path.ts';
import { runSkill, type RunEvent } from '../executor/node.ts';
import { preflight, readSkillState } from '../executor/preflight.ts';
import { microcompactMessages, ORCHESTRATOR_COMPACTABLE_TOOLS } from '../llm/compact.ts';
import { distillAndSaveDedup } from './distill.ts';
import { readFileSync, existsSync } from 'node:fs';

export interface ChatDeps {
  repo: Repo;
  registry: SkillRegistry;
  validator: Validator;
  llm: LLMClient | null;
}

const ORCHESTRATOR_TURN_CAP = 12;

/**
 * L3 brand-profile injection: returns a single system message containing the
 * distilled brand profile, or [] if none has been generated for this brand.
 * Prepended to every LLM call so the model never has to call query_memory to
 * re-discover what the user has already validated.
 */
function brandProfilePrefix(deps: ChatDeps, brandId: string): ChatCompletionMessageParam[] {
  const profile = deps.repo.getBrandProfile(brandId);
  if (!profile) return [];
  return [
    {
      role: 'system',
      content: `[Brand Profile (auto-distilled @ ${profile.updated_at})]\n\n${profile.profile}`,
    },
  ];
}

// ─── tool catalog (orchestrator LLM) ─────────────────────────────────────

function orchestratorTools(): ChatCompletionTool[] {
  return [
    {
      type: 'function',
      function: {
        name: 'list_skills',
        description: 'List all available EEC pipeline skills.',
        parameters: { type: 'object', properties: {}, additionalProperties: false },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_workspace_state',
        description: 'Get current state of the brand workspace (which skills have outputs, valid, synthetic).',
        parameters: { type: 'object', properties: {}, additionalProperties: false },
      },
    },
    {
      type: 'function',
      function: {
        name: 'preflight_skill',
        description: 'Check whether a skill is ready to run (upstream outputs valid).',
        parameters: {
          type: 'object',
          properties: { skill_id: { type: 'string', description: 'e.g. "04", "07a"' } },
          required: ['skill_id'],
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'run_skill',
        description:
          'Execute a single EEC skill against the brand workspace. Streams nested progress events back to the user. Use auto_stub_upstream:true if upstream outputs are missing.',
        parameters: {
          type: 'object',
          properties: {
            skill_id: { type: 'string' },
            brand_brief: { type: 'string', description: 'Brand brief; falls back to brand-level default.' },
            auto_stub_upstream: { type: 'boolean', default: false },
            allow_missing_upstream: { type: 'boolean', default: false },
          },
          required: ['skill_id'],
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'read_output',
        description: 'Read a skill output.json from the brand workspace.',
        parameters: {
          type: 'object',
          properties: { skill_id: { type: 'string' } },
          required: ['skill_id'],
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'add_task',
        description: 'Add a task or subtask to the conversation task tree.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            parent_id: { type: 'string', description: 'Optional id of parent task to nest under.' },
            notes: { type: 'string' },
          },
          required: ['title'],
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'update_task',
        description: 'Update a task status/title/notes.',
        parameters: {
          type: 'object',
          properties: {
            task_id: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
            title: { type: 'string' },
            notes: { type: 'string' },
          },
          required: ['task_id'],
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'list_tasks',
        description: 'List all tasks in this conversation.',
        parameters: { type: 'object', properties: {}, additionalProperties: false },
      },
    },
    {
      type: 'function',
      function: {
        name: 'save_memory',
        description: 'Persist a brand-level memory note (key + content). Overwrites if key exists.',
        parameters: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            content: { type: 'string' },
          },
          required: ['key', 'content'],
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'query_memory',
        description: 'Search brand memories by keyword.',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query'],
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'distill_brand_profile',
        description:
          'Force-refresh the brand profile (L3 long-term memory). The profile is auto-injected at the top of every future system prompt. Call this at major milestones (e.g. after 03 brand identity, after 05 site build) so subsequent conversations start from the latest consensus. Auto-runs after every approval, so manual calls are rarely needed.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
    },
  ];
}

// ─── history builder ─────────────────────────────────────────────────────

function buildHistory(deps: ChatDeps, conversationId: string): ChatCompletionMessageParam[] {
  const rows = deps.repo.listMessages(conversationId);
  const out: ChatCompletionMessageParam[] = [];
  for (const r of rows) {
    if (r.role === 'system') {
      out.push({ role: 'system', content: r.content });
    } else if (r.role === 'user') {
      const attachmentIds = r.attachments_json ? (JSON.parse(r.attachments_json) as string[]) : [];
      if (attachmentIds.length === 0) {
        out.push({ role: 'user', content: r.content });
      } else {
        const parts: ChatCompletionContentPart[] = [];
        if (r.content) parts.push({ type: 'text', text: r.content });
        for (const aid of attachmentIds) {
          const att = deps.repo.getAttachment(aid);
          if (att && att.kind === 'image') {
            parts.push({
              type: 'image_url',
              image_url: { url: `data:${att.mime};base64,${att.data_base64}` },
            });
          }
        }
        out.push({ role: 'user', content: parts });
      }
    } else if (r.role === 'assistant') {
      const toolCalls = r.tool_calls_json
        ? (JSON.parse(r.tool_calls_json) as Array<{
            id: string;
            type: 'function';
            function: { name: string; arguments: string };
          }>)
        : undefined;
      out.push({
        role: 'assistant',
        content: r.content || null,
        ...(toolCalls && toolCalls.length > 0 && { tool_calls: toolCalls }),
      });
    } else if (r.role === 'tool') {
      out.push({ role: 'tool', tool_call_id: r.tool_call_id ?? '', content: r.content });
    }
  }
  return out;
}

const SYSTEM_PROMPT = `You are the EEC Agent, a co-pilot for operating an e-commerce brand pipeline of 15 skills (research → product-selection → brand-identity → creative-factory → site-build → tracking → tech-seo → content-marketing → paid-ads → optimization, plus side skills).

You can:
- Run any single skill against the user's brand workspace (use \`run_skill\`). Skills emit JSON to <workspace>/eec/<id>-<slug>/output.json.
- Auto-stub missing upstream outputs (set \`auto_stub_upstream: true\`).
- Inspect existing outputs and workspace state.
- Maintain a task tree and brand-level memory notes for the user.

Operating principles:
- ALWAYS use \`get_workspace_state\` or \`preflight_skill\` before running, so the user knows what will happen.
- When the user's request implies multiple steps, create tasks first via \`add_task\`, then update their status as you progress.
- When you call \`run_skill\`, the user will see the nested execution live — you do NOT need to repeat its output. Summarize after it finishes.
- If the user uploads images, treat them as creative references / inspiration / brand assets to feed into the relevant skill.
- Keep responses concise. Don't narrate every action in prose — let the tool calls speak for themselves.
- The conversation language is whatever the user uses. Mirror it. If the user has not spoken yet, default to Chinese (the brand brief is typically Chinese); switch if the user replies in another language.

Approval gate (CRITICAL):
- After ANY successful \`run_skill\` call, you MUST stop and let the user 批准 / 修改. Do NOT call \`run_skill\` again in the same turn or for the next skill until the user has explicitly approved.
- After a successful run, write a 1-2 line summary in your assistant turn (主推 SKU / 关键字段 / 平均毛利 等) and then end your turn. The UI will render an approval card with 批准 / 提建议重跑 buttons; the user can also reply in chat.
- When the user replies with 批准 / approve / 同意 / "ok" / "looks good" → you may proceed to the next skill (still call \`preflight_skill\` first).
- When the user replies with modifications (e.g. "把毛利目标改成 30%") → call \`run_skill\` for the SAME skill again, with the modification incorporated into \`brand_brief\`. Do NOT advance to the next skill yet.
- This rule applies even if the user's original request was "把整个 pipeline 跑完" — translate it to "approval-gated chain" not "non-stop chain".

Onboarding (first turn of a new conversation):
- If you see a \`[KICKOFF]\` directive in the system context, this is the very first turn and the user has not typed anything yet. You MUST:
  1. Call \`get_workspace_state\` first to see which skills already have output.json.
  2. Greet the user briefly (1 sentence).
  3. If NO skills have outputs: explain this is a fresh workspace, the EEC pipeline starts at 01-research, and offer 2 paths — "从 01 开始" or "你已经做到第 N 步了？告诉我，我从那里接上".
  4. If SOME skills have outputs: list briefly what's done (e.g. "✓ 01 调研, ✓ 02 选品, ✓ 03 品牌识别"), name the next logical skill (the smallest id whose required upstreams are valid but whose own output is missing), and ask "要现在跑 04 素材工厂吗？".
  5. Keep it under ~6 lines total. No bullet vomit. Offer 2-3 concrete next actions max.
- Do NOT auto-run any skill during the kickoff turn — wait for the user to confirm.`;

// ─── tool dispatcher ─────────────────────────────────────────────────────

interface DispatchCtx {
  deps: ChatDeps;
  conversationId: string;
  brandId: string;
  workspace: Workspace;
  /** Per-conversation model override (passed to nested run_skill). */
  model?: string;
  /** Push a typed event out the chat SSE stream */
  emit: (event: ChatStreamEvent) => Promise<void>;
}

type ChatStreamEvent =
  | { type: 'message_persisted'; payload: Message }
  | { type: 'assistant_message'; payload: { id: string; content: string; tool_calls?: unknown } }
  | { type: 'tool_call'; payload: { id: string; name: string; arguments: string } }
  | { type: 'tool_result'; payload: { id: string; ok: boolean; summary: string } }
  | { type: 'nested_run'; payload: { tool_call_id: string; event: RunEvent } }
  | {
      type: 'awaiting_approval';
      payload: {
        skill_id: string;
        full_name: string;
        output_path: string;
        summary: string;
      };
    }
  | { type: 'approval_recorded'; payload: { id: string; skill_id: string; decision: string } }
  | { type: 'task_changed'; payload: { task: TaskRow; action: 'created' | 'updated' | 'deleted' } }
  | { type: 'memory_saved'; payload: { key: string } }
  | { type: 'conversation_renamed'; payload: { id: string; title: string } }
  | { type: 'done'; payload: { turns: number } }
  | { type: 'error'; payload: { message: string } };

function safeParseJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function dispatchOrchestratorTool(
  name: string,
  argsJson: string,
  toolCallId: string,
  ctx: DispatchCtx,
): Promise<unknown> {
  const args = safeParseJson(argsJson);
  const { deps, conversationId, brandId, workspace } = ctx;

  switch (name) {
    case 'list_skills':
      return {
        skills: deps.registry.list().map((s) => ({
          id: s.id,
          full_name: s.fullName,
          tier: s.tier,
          description: s.description,
          upstream_required: s.upstreamRequired,
        })),
      };

    case 'get_workspace_state': {
      const states = deps.registry.list().map((s) => {
        const { id: _omit, ...st } = readSkillState(s, workspace, deps.validator);
        return { id: s.id, full_name: s.fullName, tier: s.tier, ...st };
      });
      return { workspace: workspace.root, states };
    }

    case 'preflight_skill': {
      const skill = String(args.skill_id ?? '');
      if (!deps.registry.get(skill)) return { ok: false, error: `unknown skill: ${skill}` };
      return preflight(skill, deps.registry, workspace, deps.validator);
    }

    case 'run_skill': {
      const skill = String(args.skill_id ?? '');
      const node = deps.registry.get(skill);
      if (!node) return { ok: false, error: `unknown skill: ${skill}` };
      if (!deps.llm) return { ok: false, error: 'llm not configured' };

      // Resolve brand brief: explicit > brand default
      const brand = deps.repo.getBrand(brandId);
      const brief = (typeof args.brand_brief === 'string' && args.brand_brief) || brand?.brand_brief || undefined;
      const profile = deps.repo.getBrandProfile(brandId)?.profile;

      const result = await runSkill(
        skill,
        deps.registry,
        workspace,
        deps.validator,
        deps.llm,
        async (e: RunEvent) => {
          await ctx.emit({ type: 'nested_run', payload: { tool_call_id: toolCallId, event: e } });
        },
        {
          brandBrief: brief,
          brandProfile: profile,
          autoStubUpstream: args.auto_stub_upstream === true,
          allowMissingUpstream: args.allow_missing_upstream === true,
          model: ctx.model,
        },
      );

      // Approval gate: when a skill succeeds, emit an awaiting_approval event
      // so the chat UI renders an approval card. The system prompt forbids
      // chaining the next skill until the user approves.
      if ((result as { ok?: boolean }).ok && (result as { outputPath?: string }).outputPath) {
        const outputPath = (result as { outputPath: string }).outputPath;
        let summary = (result as { reason?: string }).reason ?? '';
        try {
          const raw = readFileSync(outputPath, 'utf-8');
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          const keys = Object.keys(parsed).slice(0, 6).join(', ');
          summary = `${summary}${summary ? ' — ' : ''}fields: ${keys}`.slice(0, 400);
        } catch {
          /* keep reason-only summary */
        }
        await ctx.emit({
          type: 'awaiting_approval',
          payload: {
            skill_id: skill,
            full_name: node.fullName,
            output_path: outputPath,
            summary,
          },
        });
      }

      return result;
    }

    case 'read_output': {
      const skill = String(args.skill_id ?? '');
      const node = deps.registry.get(skill);
      if (!node) return { ok: false, error: `unknown skill: ${skill}` };
      const out = workspace.outputJsonPath(node);
      if (!existsSync(out)) return { ok: false, error: 'output.json not found' };
      try {
        const data = JSON.parse(readFileSync(out, 'utf-8'));
        return { ok: true, path: out, data };
      } catch (e) {
        return { ok: false, error: (e as Error).message };
      }
    }

    case 'add_task': {
      const t = deps.repo.createTask({
        conversation_id: conversationId,
        title: String(args.title ?? ''),
        parent_id: typeof args.parent_id === 'string' ? args.parent_id : undefined,
        notes: typeof args.notes === 'string' ? args.notes : undefined,
      });
      await ctx.emit({ type: 'task_changed', payload: { task: t, action: 'created' } });
      return { ok: true, task: t };
    }

    case 'update_task': {
      const taskId = String(args.task_id ?? '');
      const updates: Partial<Pick<TaskRow, 'title' | 'status' | 'notes'>> = {};
      if (typeof args.title === 'string') updates.title = args.title;
      if (typeof args.status === 'string')
        updates.status = args.status as TaskRow['status'];
      if (typeof args.notes === 'string') updates.notes = args.notes;
      const t = deps.repo.updateTask(taskId, updates);
      if (!t) return { ok: false, error: 'task not found' };
      await ctx.emit({ type: 'task_changed', payload: { task: t, action: 'updated' } });
      return { ok: true, task: t };
    }

    case 'list_tasks':
      return { tasks: deps.repo.listTasks(conversationId) };

    case 'save_memory': {
      const key = String(args.key ?? '');
      const content = String(args.content ?? '');
      if (!key) return { ok: false, error: 'key required' };
      const m = deps.repo.saveMemory(brandId, key, content);
      await ctx.emit({ type: 'memory_saved', payload: { key } });
      return { ok: true, memory: m };
    }

    case 'query_memory': {
      const q = String(args.query ?? '');
      const memories = q
        ? deps.repo.searchMemories(brandId, q)
        : deps.repo.listMemories(brandId).slice(0, 10);
      return { memories };
    }

    case 'distill_brand_profile': {
      if (!deps.llm) return { ok: false, error: 'llm not configured' };
      try {
        const result = await distillAndSaveDedup({ repo: deps.repo, llm: deps.llm }, brandId);
        return { ok: true, result };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    }

    default:
      return { ok: false, error: `unknown tool: ${name}` };
  }
}

// ─── routes ──────────────────────────────────────────────────────────────

export function mountChatRoutes(app: Hono, deps: ChatDeps): void {
  // conversation CRUD
  app.get('/brands/:id/conversations', (c) => {
    const brand = deps.repo.getBrand(c.req.param('id'));
    if (!brand) return c.json({ error: 'unknown brand' }, 404);
    return c.json({ conversations: deps.repo.listConversations(brand.id) });
  });

  app.post('/brands/:id/conversations', async (c) => {
    const brand = deps.repo.getBrand(c.req.param('id'));
    if (!brand) return c.json({ error: 'unknown brand' }, 404);
    const body = (await c.req.json().catch(() => ({}))) as { title?: string };
    const conv = deps.repo.createConversation(brand.id, body.title);
    return c.json(conv, 201);
  });

  app.get('/conversations/:id', (c) => {
    const conv = deps.repo.getConversation(c.req.param('id'));
    if (!conv) return c.json({ error: 'not found' }, 404);
    const brand = deps.repo.getBrand(conv.brand_id);
    return c.json({ conversation: conv, brand });
  });

  app.patch('/conversations/:id', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { title?: string };
    if (!body.title) return c.json({ error: 'title required' }, 400);
    deps.repo.renameConversation(c.req.param('id'), body.title);
    return c.json(deps.repo.getConversation(c.req.param('id')));
  });

  app.delete('/conversations/:id', (c) => {
    deps.repo.archiveConversation(c.req.param('id'));
    return c.json({ ok: true });
  });

  app.get('/conversations/:id/messages', (c) => {
    const conv = deps.repo.getConversation(c.req.param('id'));
    if (!conv) return c.json({ error: 'not found' }, 404);
    const messages = deps.repo.listMessages(conv.id);
    const attachments = deps.repo.listAttachmentsForConversation(conv.id);
    return c.json({
      messages,
      attachments: attachments.map(({ data_base64: _omit, ...a }) => a),
    });
  });

  // attachments — upload before sending message; client passes attachment ids in /message body
  app.post('/conversations/:id/attachments', async (c) => {
    const conv = deps.repo.getConversation(c.req.param('id'));
    if (!conv) return c.json({ error: 'not found' }, 404);
    const body = (await c.req.json().catch(() => ({}))) as {
      mime?: string;
      filename?: string;
      data_base64?: string;
    };
    if (!body.mime || !body.data_base64) return c.json({ error: 'mime + data_base64 required' }, 400);
    if (body.data_base64.length > 6_000_000) return c.json({ error: 'image too large (>4MB)' }, 413);
    const a = deps.repo.saveAttachment({
      conversation_id: conv.id,
      message_id: null,
      kind: body.mime.startsWith('image/') ? 'image' : 'file',
      mime: body.mime,
      filename: body.filename ?? null,
      data_base64: body.data_base64,
      bytes: Math.floor((body.data_base64.length * 3) / 4),
    });
    const { data_base64: _omit, ...meta } = a;
    return c.json(meta, 201);
  });

  app.get('/attachments/:id', (c) => {
    const a = deps.repo.getAttachment(c.req.param('id'));
    if (!a) return c.json({ error: 'not found' }, 404);
    const buf = Buffer.from(a.data_base64, 'base64');
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: { 'Content-Type': a.mime, 'Cache-Control': 'public, max-age=31536000' },
    });
  });

  // tasks (manual CRUD; orchestrator also uses tools)
  app.get('/conversations/:id/tasks', (c) => c.json({ tasks: deps.repo.listTasks(c.req.param('id')) }));

  app.post('/conversations/:id/tasks', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { title?: string; parent_id?: string; notes?: string };
    if (!body.title) return c.json({ error: 'title required' }, 400);
    return c.json(
      deps.repo.createTask({
        conversation_id: c.req.param('id'),
        title: body.title,
        parent_id: body.parent_id,
        notes: body.notes,
      }),
      201,
    );
  });

  app.patch('/tasks/:id', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Partial<Pick<TaskRow, 'title' | 'status' | 'notes'>>;
    const t = deps.repo.updateTask(c.req.param('id'), body);
    if (!t) return c.json({ error: 'not found' }, 404);
    return c.json(t);
  });

  app.delete('/tasks/:id', (c) => {
    deps.repo.deleteTask(c.req.param('id'));
    return c.json({ ok: true });
  });

  // memories
  app.get('/brands/:id/memories', (c) => {
    if (!deps.repo.getBrand(c.req.param('id'))) return c.json({ error: 'unknown brand' }, 404);
    const q = c.req.query('q');
    return c.json({
      memories: q ? deps.repo.searchMemories(c.req.param('id'), q) : deps.repo.listMemories(c.req.param('id')),
    });
  });

  app.post('/brands/:id/memories', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { key?: string; content?: string };
    if (!body.key || !body.content) return c.json({ error: 'key + content required' }, 400);
    return c.json(deps.repo.saveMemory(c.req.param('id'), body.key, body.content), 201);
  });

  app.delete('/memories/:id', (c) => {
    deps.repo.deleteMemory(c.req.param('id'));
    return c.json({ ok: true });
  });

  // ─── approvals ────────────────────────────────────────────────────────
  app.get('/brands/:id/approvals', (c) => {
    if (!deps.repo.getBrand(c.req.param('id'))) return c.json({ error: 'unknown brand' }, 404);
    const skillId = c.req.query('skill_id') ?? undefined;
    return c.json({ approvals: deps.repo.listApprovals(c.req.param('id'), skillId) });
  });

  app.post('/brands/:id/approvals', async (c) => {
    const brandId = c.req.param('id');
    const brand = deps.repo.getBrand(brandId);
    if (!brand) return c.json({ error: 'unknown brand' }, 404);
    const body = (await c.req.json().catch(() => ({}))) as {
      skill_id?: string;
      conversation_id?: string;
      decision?: 'approved' | 'modified_rerun' | 'rejected';
      note?: string;
    };
    if (!body.skill_id) return c.json({ error: 'skill_id required' }, 400);
    if (!body.decision || !['approved', 'modified_rerun', 'rejected'].includes(body.decision)) {
      return c.json({ error: 'decision required (approved | modified_rerun | rejected)' }, 400);
    }
    const node = deps.registry.get(body.skill_id);
    if (!node) return c.json({ error: `unknown skill: ${body.skill_id}` }, 404);

    // Snapshot the output.json at approval time (best-effort).
    let snapshot: string | null = null;
    try {
      const workspace = new Workspace(brand.workspace);
      const outputPath = workspace.outputJsonPath(node);
      if (existsSync(outputPath)) {
        snapshot = readFileSync(outputPath, 'utf-8').slice(0, 200_000); // hard cap to avoid blob blow-up
      }
    } catch {
      /* snapshot is best-effort */
    }

    const row = deps.repo.appendApproval({
      brand_id: brandId,
      skill_id: body.skill_id,
      conversation_id: body.conversation_id ?? null,
      decision: body.decision,
      output_snapshot: snapshot,
      note: body.note ?? null,
    });

    // L3 fire-and-forget: refresh the brand profile so the next conversation
    // turn sees the user's latest validated state. Dedup'd per brand.
    if (deps.llm) {
      queueMicrotask(() => {
        distillAndSaveDedup({ repo: deps.repo, llm: deps.llm }, brandId).catch((e) => {
          console.warn(`[distill] auto-refresh failed for brand=${brandId}:`, e);
        });
      });
    }

    return c.json(row, 201);
  });

  // ─── kickoff greeting (called once when a conversation is empty) ─────
  app.post('/conversations/:id/greet', async (c) => {
    const conv = deps.repo.getConversation(c.req.param('id'));
    if (!conv) return c.json({ error: 'not found' }, 404);
    const brand = deps.repo.getBrand(conv.brand_id);
    if (!brand) return c.json({ error: 'brand missing' }, 404);
    const llm = deps.llm;
    if (!llm) return c.json({ error: 'OPENAI_API_KEY not set on server' }, 503);

    // Reject if conversation already has any non-system content.
    const existing = deps.repo.listMessages(conv.id);
    if (existing.some((m) => m.role !== 'system')) {
      return c.json({ error: 'conversation already has messages — kickoff skipped' }, 409);
    }

    const body = (await c.req.json().catch(() => ({}))) as { model?: string };
    const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : undefined;
    const workspace = new Workspace(brand.workspace);

    return streamSSE(c, async (stream) => {
      const send = async (e: ChatStreamEvent) => {
        await stream.writeSSE({ event: e.type, data: JSON.stringify(e.payload) });
      };

      try {
        // Seed system message (persisted) with the kickoff directive.
        if (!existing.some((m) => m.role === 'system')) {
          deps.repo.appendMessage({
            conversation_id: conv.id,
            role: 'system',
            content: `${SYSTEM_PROMPT}\n\nBrand: ${brand.name}\nWorkspace: ${brand.workspace}\nDefault brand brief: ${brand.brand_brief ?? '(none)'}\n\n[KICKOFF] This conversation is brand-new and the user has not typed anything yet. Follow the Onboarding rules above: call get_workspace_state, then greet + propose next step in ≤6 lines.`,
          });
        }

        const ctx: DispatchCtx = {
          deps,
          conversationId: conv.id,
          brandId: brand.id,
          workspace,
          model,
          emit: send,
        };
        const tools = orchestratorTools();
        let turns = 0;
        // Cap kickoff at fewer turns — should be: tool_call(get_workspace_state) → text reply.
        const KICKOFF_TURN_CAP = 4;

        // Ephemeral kickoff trigger — NOT persisted. Lets the LLM know it's first turn.
        const ephemeralUser: ChatCompletionMessageParam = {
          role: 'user',
          content: '[内部触发：新对话已开启。请按 Onboarding 流程问候并提出下一步建议。]',
        };

        for (let i = 0; i < KICKOFF_TURN_CAP; i++) {
          turns = i + 1;
          const history = buildHistory(deps, conv.id);
          // Inject the ephemeral trigger at the start of every iteration's tail
          // so the LLM always sees it as the latest user turn (until tool calls accumulate).
          const messagesForLLM: ChatCompletionMessageParam[] =
            history.some((m) => m.role === 'assistant' || m.role === 'tool')
              ? [...history]
              : [...history, ephemeralUser];
          const withProfile: ChatCompletionMessageParam[] = [
            ...brandProfilePrefix(deps, brand.id),
            ...messagesForLLM,
          ];
          const compacted = microcompactMessages(withProfile, ORCHESTRATOR_COMPACTABLE_TOOLS);
          const resp = await llm.chat(compacted, tools, model);

          const assistantMsg = deps.repo.appendMessage({
            conversation_id: conv.id,
            role: 'assistant',
            content: resp.text,
            tool_calls:
              resp.toolCalls.length > 0
                ? resp.toolCalls.map((tc) => ({
                    id: tc.id,
                    type: 'function' as const,
                    function: { name: tc.name, arguments: tc.arguments },
                  }))
                : undefined,
          });
          await send({
            type: 'assistant_message',
            payload: {
              id: assistantMsg.id,
              content: resp.text,
              ...(resp.toolCalls.length > 0 && {
                tool_calls: resp.toolCalls.map((tc) => ({
                  id: tc.id,
                  name: tc.name,
                  arguments: tc.arguments,
                })),
              }),
            },
          });

          if (resp.toolCalls.length === 0) break;

          for (const tc of resp.toolCalls) {
            await send({ type: 'tool_call', payload: { id: tc.id, name: tc.name, arguments: tc.arguments } });
            const result = await dispatchOrchestratorTool(tc.name, tc.arguments, tc.id, ctx);
            const ok = (result as { ok?: boolean }).ok !== false;
            const summary =
              typeof result === 'object' && result && 'error' in result
                ? String((result as { error: unknown }).error).slice(0, 120)
                : 'ok';
            await send({ type: 'tool_result', payload: { id: tc.id, ok, summary } });
            deps.repo.appendMessage({
              conversation_id: conv.id,
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify(result),
            });
          }
        }

        await send({ type: 'done', payload: { turns } });
      } catch (e) {
        await send({ type: 'error', payload: { message: (e as Error).message } });
      }
    });
  });

  // ─── chat — the hot path ─────────────────────────────────────────────
  app.post('/conversations/:id/messages', async (c) => {
    const conv = deps.repo.getConversation(c.req.param('id'));
    if (!conv) return c.json({ error: 'not found' }, 404);
    const brand = deps.repo.getBrand(conv.brand_id);
    if (!brand) return c.json({ error: 'brand missing' }, 404);
    const llm = deps.llm;
    if (!llm) return c.json({ error: 'OPENAI_API_KEY not set on server' }, 503);

    const body = (await c.req.json().catch(() => ({}))) as {
      content?: string;
      attachment_ids?: string[];
      model?: string;
    };

    if (typeof body.content !== 'string' || body.content.trim().length === 0) {
      return c.json(
        { error: 'content is required and must be a non-empty string' },
        400,
      );
    }

    const workspace = new Workspace(brand.workspace);
    const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : undefined;

    return streamSSE(c, async (stream) => {
      const send = async (e: ChatStreamEvent) => {
        await stream.writeSSE({ event: e.type, data: JSON.stringify(e.payload) });
      };

      try {
        // 1. persist user message
        const userMsg = deps.repo.appendMessage({
          conversation_id: conv.id,
          role: 'user',
          content: body.content ?? '',
          attachments: body.attachment_ids ?? [],
        });
        await send({ type: 'message_persisted', payload: userMsg });

        // 2. auto-name conversation if first user message
        if (conv.title === 'New conversation' && (body.content ?? '').trim()) {
          const newTitle = (body.content ?? '').trim().slice(0, 48);
          deps.repo.renameConversation(conv.id, newTitle);
          await send({ type: 'conversation_renamed', payload: { id: conv.id, title: newTitle } });
        }

        // 3. seed system message if conversation has none
        const hasSystem = deps.repo.listMessages(conv.id).some((m) => m.role === 'system');
        if (!hasSystem) {
          deps.repo.appendMessage({
            conversation_id: conv.id,
            role: 'system',
            content: `${SYSTEM_PROMPT}\n\nBrand: ${brand.name}\nWorkspace: ${brand.workspace}\nDefault brand brief: ${brand.brand_brief ?? '(none)'}`,
          });
        }

        // 4. orchestrator loop
        const ctx: DispatchCtx = {
          deps,
          conversationId: conv.id,
          brandId: brand.id,
          workspace,
          model,
          emit: send,
        };
        const tools = orchestratorTools();
        let turns = 0;

        for (let i = 0; i < ORCHESTRATOR_TURN_CAP; i++) {
          turns = i + 1;
          const history = buildHistory(deps, conv.id);
          const withProfile: ChatCompletionMessageParam[] = [
            ...brandProfilePrefix(deps, brand.id),
            ...history,
          ];
          const compacted = microcompactMessages(withProfile, ORCHESTRATOR_COMPACTABLE_TOOLS);
          const resp = await llm.chat(compacted, tools, model);

          // persist assistant message
          const assistantMsg = deps.repo.appendMessage({
            conversation_id: conv.id,
            role: 'assistant',
            content: resp.text,
            tool_calls:
              resp.toolCalls.length > 0
                ? resp.toolCalls.map((tc) => ({
                    id: tc.id,
                    type: 'function' as const,
                    function: { name: tc.name, arguments: tc.arguments },
                  }))
                : undefined,
          });
          await send({
            type: 'assistant_message',
            payload: {
              id: assistantMsg.id,
              content: resp.text,
              ...(resp.toolCalls.length > 0 && {
                tool_calls: resp.toolCalls.map((tc) => ({
                  id: tc.id,
                  name: tc.name,
                  arguments: tc.arguments,
                })),
              }),
            },
          });

          if (resp.toolCalls.length === 0) break;

          for (const tc of resp.toolCalls) {
            await send({
              type: 'tool_call',
              payload: { id: tc.id, name: tc.name, arguments: tc.arguments },
            });
            const result = await dispatchOrchestratorTool(tc.name, tc.arguments, tc.id, ctx);
            const ok = (result as { ok?: boolean }).ok !== false;
            const summary =
              typeof result === 'object' && result && 'error' in result
                ? String((result as { error: unknown }).error).slice(0, 120)
                : 'ok';
            await send({ type: 'tool_result', payload: { id: tc.id, ok, summary } });
            deps.repo.appendMessage({
              conversation_id: conv.id,
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify(result),
            });
          }
        }

        await send({ type: 'done', payload: { turns } });
      } catch (e) {
        await send({ type: 'error', payload: { message: (e as Error).message } });
      }
    });
  });
}
