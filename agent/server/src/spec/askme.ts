import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import type { LLMClient } from '../llm/openai.ts';
import { toolMessage } from '../llm/openai.ts';
import type { SpecSchema } from './schema.ts';
import type { SiteSpec } from './store.ts';
import { applyPatch, readPointer } from './store.ts';

export type AskMeEvent =
  | { type: 'turn'; payload: { index: number; text: string; finish: string | null } }
  | { type: 'tool_call'; payload: { id: string; name: string; arguments: string } }
  | { type: 'tool_result'; payload: { id: string; ok: boolean; summary: string } }
  | { type: 'field_updated'; payload: { path: string; value: unknown; spec: SiteSpec } }
  | { type: 'awaiting_user'; payload: { question: string } }
  | { type: 'done'; payload: { ok: boolean; reason: string } }
  | { type: 'error'; payload: { message: string } };

const ASKME_TURN_CAP = 6;

function writeFieldTool(): ChatCompletionTool {
  return {
    type: 'function',
    function: {
      name: 'write_field',
      description:
        'Commit the final value for the field this conversation is about. Call this exactly once when you have a clear answer. After calling, the conversation ends.',
      parameters: {
        type: 'object',
        required: ['value'],
        properties: {
          value: {
            description:
              'The value to write into the spec field. Must match the field schema. For string fields use a string; for arrays use an array.',
          },
        },
        additionalProperties: false,
      },
    },
  };
}

function awaitUserTool(): ChatCompletionTool {
  return {
    type: 'function',
    function: {
      name: 'ask_user',
      description:
        'Ask the user a single short question to gather missing info. Use when you genuinely need input — do not stack questions, ask one at a time. The conversation pauses here and resumes with the user reply.',
      parameters: {
        type: 'object',
        required: ['question'],
        properties: { question: { type: 'string' } },
        additionalProperties: false,
      },
    },
  };
}

function buildSystem(opts: {
  fieldPath: string;
  fieldSchema: unknown;
  currentValue: unknown;
  brandName: string | null;
  brandBrief: string | null;
}): string {
  return [
    'You are filling ONE field in a website build spec.',
    `Field path: ${opts.fieldPath}`,
    `Field JSON Schema: ${JSON.stringify(opts.fieldSchema)}`,
    `Current value: ${JSON.stringify(opts.currentValue) ?? 'null'}`,
    opts.brandName ? `Brand: ${opts.brandName}` : '',
    opts.brandBrief ? `Brand brief: ${opts.brandBrief}` : '',
    '',
    'Rules:',
    '- Ask AT MOST 3 small clarifying questions via the `ask_user` tool — one question per call.',
    '- When you have enough information to commit a value, call `write_field` with the final value and stop.',
    '- For string fields, return a plain string. For arrays, return a JSON array.',
    '- Never invent. If after 3 questions you still cannot, call `write_field` with a sensible default and a brief explanation in your last assistant message.',
    '- Conversation language follows the user.',
  ]
    .filter(Boolean)
    .join('\n');
}

export interface AskMeOptions {
  fieldPath: string;
  spec: SiteSpec;
  schema: SpecSchema;
  llm: LLMClient;
  brandName: string | null;
  brandBrief: string | null;
  /** Optional initial user reply (when the chat is being resumed). */
  userReply?: string;
  /** Prior conversation turns to keep state across user replies. */
  history?: ChatCompletionMessageParam[];
  /** Persist mutated spec to disk. */
  saveSpec: (spec: SiteSpec) => void;
  /** Per-call OpenAI model override. Falls back to LLMClient default. */
  model?: string;
}

export interface AskMeStepResult {
  /** Updated message history (push to disk between user replies). */
  history: ChatCompletionMessageParam[];
  /** True when the loop committed a value and should be torn down. */
  done: boolean;
  /** True when the loop is paused waiting for user input. */
  awaitingUser: boolean;
}

/**
 * Run the ask-me loop for one user turn. Stops when:
 *   - the assistant calls `write_field` (done = true)
 *   - the assistant calls `ask_user` (awaitingUser = true)
 *   - the turn cap is hit (done = true with error event)
 */
export async function runAskMeStep(
  opts: AskMeOptions,
  emit: (e: AskMeEvent) => Promise<void> | void,
): Promise<AskMeStepResult> {
  const fragment = opts.schema.resolvePointer(opts.fieldPath);
  if (!fragment) {
    await emit({ type: 'error', payload: { message: `unknown field path: ${opts.fieldPath}` } });
    return { history: opts.history ?? [], done: true, awaitingUser: false };
  }
  const currentValue = readPointer(opts.spec, opts.fieldPath);

  let history: ChatCompletionMessageParam[] = opts.history ? [...opts.history] : [];
  if (history.length === 0) {
    history.push({
      role: 'system',
      content: buildSystem({
        fieldPath: opts.fieldPath,
        fieldSchema: fragment,
        currentValue,
        brandName: opts.brandName,
        brandBrief: opts.brandBrief,
      }),
    });
  }
  if (opts.userReply) {
    history.push({ role: 'user', content: opts.userReply });
  }

  const tools: ChatCompletionTool[] = [writeFieldTool(), awaitUserTool()];

  for (let i = 0; i < ASKME_TURN_CAP; i++) {
    const resp = await opts.llm.chat(history, tools, opts.model);
    history.push(resp.message);
    if (resp.text) {
      await emit({ type: 'turn', payload: { index: i + 1, text: resp.text, finish: resp.finish } });
    }
    if (resp.toolCalls.length === 0) {
      // Assistant produced text without a tool call. Treat as a question to the user.
      await emit({ type: 'awaiting_user', payload: { question: resp.text } });
      return { history, done: false, awaitingUser: true };
    }

    let committedValue: unknown = undefined;
    let askedQuestion: string | null = null;

    for (const tc of resp.toolCalls) {
      await emit({ type: 'tool_call', payload: { id: tc.id, name: tc.name, arguments: tc.arguments } });
      let parsed: any = {};
      try {
        parsed = JSON.parse(tc.arguments);
      } catch {
        parsed = {};
      }
      if (tc.name === 'write_field') {
        const v = parsed?.value;
        const validation = opts.schema.validateField(opts.fieldPath, v);
        if (!validation.ok) {
          history.push(
            toolMessage(tc.id, {
              ok: false,
              error: 'value did not validate against the field schema',
              errors: validation.errors,
            }),
          );
          await emit({
            type: 'tool_result',
            payload: {
              id: tc.id,
              ok: false,
              summary: `validation failed: ${validation.errors.map((e) => e.message).join('; ')}`,
            },
          });
          continue;
        }
        committedValue = v;
        history.push(toolMessage(tc.id, { ok: true, value: v }));
        await emit({ type: 'tool_result', payload: { id: tc.id, ok: true, summary: 'field committed' } });
      } else if (tc.name === 'ask_user') {
        askedQuestion = String(parsed?.question ?? '').trim();
        history.push(toolMessage(tc.id, { ok: true }));
        await emit({ type: 'tool_result', payload: { id: tc.id, ok: true, summary: 'asked user' } });
      } else {
        history.push(toolMessage(tc.id, { ok: false, error: `unknown tool: ${tc.name}` }));
        await emit({
          type: 'tool_result',
          payload: { id: tc.id, ok: false, summary: `unknown tool: ${tc.name}` },
        });
      }
    }

    if (committedValue !== undefined) {
      const nextSpec = applyPatch(opts.spec, opts.fieldPath, committedValue, 'user');
      opts.saveSpec(nextSpec);
      await emit({
        type: 'field_updated',
        payload: { path: opts.fieldPath, value: committedValue, spec: nextSpec },
      });
      await emit({ type: 'done', payload: { ok: true, reason: 'field written' } });
      return { history, done: true, awaitingUser: false };
    }
    if (askedQuestion !== null) {
      await emit({ type: 'awaiting_user', payload: { question: askedQuestion } });
      return { history, done: false, awaitingUser: true };
    }
  }

  await emit({ type: 'done', payload: { ok: false, reason: 'turn cap reached' } });
  return { history, done: true, awaitingUser: false };
}
