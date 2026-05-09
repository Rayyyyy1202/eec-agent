'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type AttachmentMeta,
  type AwaitingApprovalPayload,
  type ChatEvent,
  type Conversation,
  type Message,
  type RunEvent,
  attachmentUrl,
  createApproval,
  fetchConversation,
  fetchMessages,
  getStoredModel,
  setStoredModel,
  streamChat,
  streamGreet,
  updateSkillOutput,
  uploadAttachment,
} from '../lib/agent';
import ModelPicker from './ModelPicker';
import { OutputPreview } from './OutputPreview';
import { type ToolLogEntry } from './Inspector';

interface ChatPanelProps {
  conversationId: string;
  seedPrompt?: string;
  onConversationRenamed?: (id: string, title: string) => void;
  onToolLog?: (entries: ToolLogEntry[]) => void;
  onActivity?: () => void;
}

interface PendingAttachment {
  id?: string;
  name: string;
  mime: string;
  preview: string; // data URL
  bytes: number;
  uploaded: boolean;
  error?: string;
}

interface NestedRunState {
  events: RunEvent[];
  done: boolean;
  ok: boolean | null;
}

export default function ChatPanel({ conversationId, seedPrompt, onConversationRenamed, onToolLog, onActivity }: ChatPanelProps) {
  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [attachmentMeta, setAttachmentMeta] = useState<Record<string, AttachmentMeta>>({});
  const [composerText, setComposerText] = useState('');
  const [pendingAtts, setPendingAtts] = useState<PendingAttachment[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nestedRuns, setNestedRuns] = useState<Record<string, NestedRunState>>({});
  const [toolLog, setToolLog] = useState<ToolLogEntry[]>([]);
  const [model, setModel] = useState<string>('gpt-5.4');
  const [pendingApprovals, setPendingApprovals] = useState<AwaitingApprovalPayload[]>([]);
  const [approvalNote, setApprovalNote] = useState('');
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [lastApproved, setLastApproved] = useState<string | null>(null);

  useEffect(() => {
    setModel(getStoredModel());
  }, []);

  const handleModelChange = (next: string) => {
    setModel(next);
    setStoredModel(next);
  };

  const streamRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [c, m] = await Promise.all([fetchConversation(conversationId), fetchMessages(conversationId)]);
      setConv(c);
      setMessages(m.messages);
      const map: Record<string, AttachmentMeta> = {};
      for (const a of m.attachments) map[a.id] = a;
      setAttachmentMeta(map);
    } catch (e) {
      setError(`无法加载对话: ${(e as Error).message}`);
    } finally {
      setHydrated(true);
    }
  }, [conversationId]);

  useEffect(() => {
    setHydrated(false);
    refresh();
    setNestedRuns({});
    setToolLog([]);
    setComposerText(seedPrompt ?? '');
    setPendingAtts([]);
    setError(null);
    setPendingApprovals([]);
    setApprovalNote('');
    setLastApproved(null);
  }, [conversationId, refresh, seedPrompt]);

  // auto-send seed once when the conversation has no user messages yet
  const seededRef = useRef<string | null>(null);
  useEffect(() => {
    if (!seedPrompt) return;
    if (!hydrated) return;
    if (seededRef.current === conversationId) return;
    seededRef.current = conversationId;
    if (messages.some((m) => m.role === 'user')) return;
    setTimeout(() => sendMessage(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, seedPrompt, hydrated, messages]);

  // bubble tool log up
  useEffect(() => {
    onToolLog?.(toolLog);
  }, [toolLog, onToolLog]);

  // auto-scroll only when user is already near the bottom
  const isAtBottomRef = useRef(true);
  const onStreamScroll = useCallback(() => {
    const el = streamRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = dist < 64;
  }, []);

  useEffect(() => {
    if (!isAtBottomRef.current) return;
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  // nested-run events fire frequently — throttle their auto-scroll
  useEffect(() => {
    if (!isAtBottomRef.current) return;
    const t = setTimeout(() => {
      const el = streamRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 120);
    return () => clearTimeout(t);
  }, [nestedRuns]);

  const onPickFiles = (files: FileList | null) => {
    if (!files) return;
    const next: PendingAttachment[] = [];
    let remaining = files.length;
    Array.from(files).forEach((f) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const isImage = f.type.startsWith('image/');
        const att: PendingAttachment = {
          name: f.name,
          mime: f.type || 'application/octet-stream',
          preview: dataUrl,
          bytes: f.size,
          uploaded: false,
        };
        try {
          const base64 = dataUrl.split(',', 2)[1] ?? '';
          const meta = await uploadAttachment(conversationId, {
            kind: isImage ? 'image' : 'file',
            mime: att.mime,
            filename: f.name,
            data_base64: base64,
          });
          att.id = meta.id;
          att.uploaded = true;
        } catch (e) {
          att.error = (e as Error).message;
        }
        next.push(att);
        remaining -= 1;
        if (remaining === 0) {
          setPendingAtts((curr) => [...curr, ...next]);
        }
      };
      reader.readAsDataURL(f);
    });
  };

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (const it of Array.from(items)) {
      if (it.kind === 'file') {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length === 0) return;
    e.preventDefault();
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    onPickFiles(dt.files);
  };

  const removeAttachment = (idx: number) => {
    setPendingAtts((curr) => curr.filter((_, i) => i !== idx));
  };

  const handleChatEvent = useCallback(
    (e: ChatEvent) => {
      if (e.type !== 'error') setError(null);
      switch (e.type) {
        case 'message_persisted':
          setMessages((curr) => {
            if (curr.some((m) => m.id === e.payload.id)) return curr;
            return [...curr, e.payload];
          });
          break;
        case 'assistant_message': {
          const p = e.payload;
          const m: Message = {
            id: p.id,
            conversation_id: conversationId,
            role: 'assistant',
            content: p.content ?? '',
            tool_call_id: null,
            tool_calls_json: p.tool_calls
              ? JSON.stringify(
                  p.tool_calls.map((tc) => ({
                    id: tc.id,
                    type: 'function',
                    function: { name: tc.name, arguments: tc.arguments },
                  })),
                )
              : null,
            attachments_json: null,
            created_at: new Date().toISOString(),
            prompt_tokens: p.usage?.prompt_tokens ?? null,
            completion_tokens: p.usage?.completion_tokens ?? null,
            total_tokens: p.usage?.total_tokens ?? null,
          };
          setMessages((curr) => (curr.some((x) => x.id === m.id) ? curr : [...curr, m]));
          break;
        }
        case 'tool_call': {
          const t: ToolLogEntry = {
            id: e.payload.id,
            name: e.payload.name,
            args: e.payload.arguments,
            startedAt: new Date().toISOString(),
          };
          setToolLog((curr) => [...curr, t]);
          onActivity?.();
          break;
        }
        case 'tool_result':
          setToolLog((curr) =>
            curr.map((t) =>
              t.id === e.payload.id
                ? { ...t, result: { ok: e.payload.ok, summary: e.payload.summary } }
                : t,
            ),
          );
          break;
        case 'nested_run': {
          const tcid = e.payload.tool_call_id;
          const ev = e.payload.event;
          setNestedRuns((curr) => {
            const prev = curr[tcid] ?? { events: [], done: false, ok: null };
            const next: NestedRunState = {
              events: [...prev.events, ev],
              done: ev.type === 'done' || ev.type === 'error' ? true : prev.done,
              ok: ev.type === 'done' ? ev.payload.ok : ev.type === 'error' ? false : prev.ok,
            };
            return { ...curr, [tcid]: next };
          });
          if (ev.type === 'done' || ev.type === 'validate' || ev.type === 'stub') {
            onActivity?.();
          }
          break;
        }
        case 'task_changed':
        case 'memory_saved':
          onActivity?.();
          break;
        case 'conversation_renamed':
          setConv((c) => (c ? { ...c, title: e.payload.title } : c));
          onConversationRenamed?.(e.payload.id, e.payload.title);
          break;
        case 'awaiting_approval':
          setPendingApprovals((q) => [...q, e.payload]);
          setApprovalNote('');
          onActivity?.();
          break;
        case 'approval_recorded':
          // server-emitted confirmation; nothing else to do client-side
          break;
        case 'done':
          refresh();
          break;
        case 'error':
          setError(e.payload.message);
          break;
      }
    },
    [conversationId, onActivity, onConversationRenamed, refresh],
  );

  // auto-greet once when the conversation hydrates empty and has no seed prompt.
  // The agent introspects the workspace and proposes the next step.
  const greetedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    if (seedPrompt) return;
    if (greetedRef.current === conversationId) return;
    if (messages.some((m) => m.role !== 'system')) return;
    if (streaming) return;
    greetedRef.current = conversationId;
    setStreaming(true);
    setError(null);
    streamGreet(conversationId, { model }, handleChatEvent)
      .catch((e: unknown) => {
        const code = (e as { code?: number }).code;
        if (code === 409) return; // expected: conversation already has messages
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setStreaming(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, hydrated, seedPrompt, messages, model, handleChatEvent]);

  const sendChat = useCallback(
    async (text: string, attIds: string[]) => {
      if (streaming) return;
      if (!text && attIds.length === 0) return;
      setStreaming(true);
      setError(null);
      setNestedRuns({});
      try {
        await streamChat(
          conversationId,
          { content: text, attachment_ids: attIds, model },
          handleChatEvent,
        );
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setStreaming(false);
      }
    },
    [conversationId, model, handleChatEvent, streaming],
  );

  const sendMessage = async () => {
    const text = composerText.trim();
    const attIds = pendingAtts.filter((a) => a.uploaded && a.id).map((a) => a.id!) as string[];
    if (!text && attIds.length === 0) return;
    setComposerText('');
    setPendingAtts([]);
    await sendChat(text, attIds);
  };

  const handleApprove = async () => {
    const head = pendingApprovals[0];
    if (!head || !conv || approvalBusy || streaming) return;
    setApprovalBusy(true);
    const skillId = head.skill_id;
    const outputPath = head.output_path;
    try {
      await createApproval(conv.brand_id, {
        skill_id: skillId,
        decision: 'approved',
        conversation_id: conversationId,
        output_path: outputPath,
      });
      setPendingApprovals((q) => q.slice(1));
      setApprovalNote('');
      setLastApproved(skillId);
      setTimeout(() => setLastApproved((s) => (s === skillId ? null : s)), 3000);
      await sendChat(`已批准 ${skillId}，请继续下一步`, []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setApprovalBusy(false);
    }
  };

  const handleModifyRerun = async () => {
    const head = pendingApprovals[0];
    if (!head || !conv || approvalBusy || streaming) return;
    const note = approvalNote.trim();
    if (!note) {
      setError('请填写修改建议');
      return;
    }
    setApprovalBusy(true);
    const skillId = head.skill_id;
    const outputPath = head.output_path;
    try {
      await createApproval(conv.brand_id, {
        skill_id: skillId,
        decision: 'modified_rerun',
        conversation_id: conversationId,
        note,
        output_path: outputPath,
      });
      setPendingApprovals((q) => q.slice(1));
      setApprovalNote('');
      await sendChat(`请按以下修改重跑 ${skillId}：${note}`, []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setApprovalBusy(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="main">
      <div className="main-header">
        <div className="main-title">
          {conv?.title ?? (hydrated ? '对话不存在或已归档' : '加载中…')}
        </div>
        <div className="main-meta">
          {hydrated ? renderMeta(messages) : ''}
        </div>
      </div>

      <div className="main-body">
        <div className="chat-stream" ref={streamRef} onScroll={onStreamScroll}>
          {(() => {
            const toolResultsByCallId: Record<string, string> = {};
            for (const m of messages) {
              if (m.role === 'tool' && m.tool_call_id) toolResultsByCallId[m.tool_call_id] = m.content;
            }
            return messages
              .filter((m) => m.role !== 'system' && m.role !== 'tool')
              .map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  attachmentMeta={attachmentMeta}
                  nestedRuns={nestedRuns}
                  toolResultsByCallId={toolResultsByCallId}
                />
              ));
          })()}
          {streaming && (
            <div className="msg msg-assistant">
              <div className="msg-avatar">A</div>
              <div className="msg-body">
                <div className="msg-content" style={{ color: 'var(--fg-muted)' }}>
                  <span className="typing">●●●</span>
                </div>
              </div>
            </div>
          )}
          {pendingApprovals.length > 0 && !streaming && conv && (
            <ApprovalCard
              payload={pendingApprovals[0]}
              brandId={conv.brand_id}
              queueDepth={pendingApprovals.length}
              note={approvalNote}
              busy={approvalBusy}
              onChangeNote={setApprovalNote}
              onApprove={handleApprove}
              onModifyRerun={handleModifyRerun}
              onDismiss={() => {
                setPendingApprovals((q) => q.slice(1));
                setApprovalNote('');
              }}
            />
          )}
          {lastApproved && (
            <div className="approved-banner">
              ✓ 已批准 {lastApproved}，正在触发下一步…
            </div>
          )}
          {error && <div style={{ color: 'var(--status-err)', fontSize: 13 }}>Error: {error}</div>}
        </div>

        <div className="composer-wrap">
          <div className="composer">
            {pendingAtts.length > 0 && (
              <div className="composer-attachments">
                {pendingAtts.map((a, i) => (
                  <div className="chip" key={i}>
                    {a.mime.startsWith('image/') ? (
                      <img src={a.preview} alt={a.name} />
                    ) : (
                      <span>{a.name}</span>
                    )}
                    {!a.uploaded && !a.error && <span style={{ color: 'var(--fg-muted)', fontSize: 11 }}>uploading…</span>}
                    {a.error && <span style={{ color: 'var(--status-err)', fontSize: 11 }}>{a.error}</span>}
                    <button onClick={() => removeAttachment(i)} title="Remove">×</button>
                  </div>
                ))}
              </div>
            )}
            <textarea
              ref={composerRef}
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              placeholder="Send a message, or paste an image…  (Enter to send, Shift+Enter for newline)"
              rows={1}
              disabled={streaming}
              data-magic="输入消息：回车发送，Shift+回车换行；可以直接粘贴图片，agent 会一起看"
            />
            <div className="composer-bar">
              <button
                className="btn-ghost"
                onClick={() => fileInputRef.current?.click()}
                title="Attach files / images"
                data-magic="上传图片或文件给 agent；图片会作为视觉输入，文件以 base64 编码"
              >
                + Attach
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  onPickFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <span data-magic="选用的 LLM 模型，影响速度、质量和成本；可以随时换，下一条消息生效">
                <ModelPicker value={model} onChange={handleModelChange} disabled={streaming} compact />
              </span>
              <span className="hint">images sent as base64</span>
              <span className="spacer" />
              <button
                className="btn-primary"
                onClick={sendMessage}
                disabled={streaming || (!composerText.trim() && pendingAtts.length === 0)}
              >
                {streaming ? 'Streaming…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  attachmentMeta,
  nestedRuns,
  toolResultsByCallId,
}: {
  message: Message;
  attachmentMeta: Record<string, AttachmentMeta>;
  nestedRuns: Record<string, NestedRunState>;
  toolResultsByCallId: Record<string, string>;
}) {
  const role = message.role;
  const avatar = role === 'user' ? 'U' : role === 'assistant' ? 'A' : role === 'tool' ? 'T' : 'S';
  const attIds: string[] = message.attachments_json ? JSON.parse(message.attachments_json) : [];
  const toolCalls: Array<{ id: string; type: string; function: { name: string; arguments: string } }> =
    message.tool_calls_json ? JSON.parse(message.tool_calls_json) : [];
  const showTokens = role === 'assistant' && message.total_tokens != null;

  return (
    <div className={`msg msg-${role}`}>
      <div className="msg-avatar">{avatar}</div>
      <div className="msg-body">
        {showTokens && (
          <div className="msg-role">
            <span
              className="msg-tokens"
              title={`prompt ${message.prompt_tokens ?? 0} · completion ${message.completion_tokens ?? 0}`}
              data-magic={`这条消息消耗的 token 数（输入+输出）。鼠标悬停看 prompt/completion 拆分。token ≈ 钱，越长越贵`}
            >
              {formatTokens(message.total_tokens!)} tok
            </span>
          </div>
        )}
        {message.content && <div className="msg-content">{message.content}</div>}
        {attIds.length > 0 && (
          <div className="msg-attachments">
            {attIds.map((aid) => {
              const meta = attachmentMeta[aid];
              if (!meta) return null;
              return meta.kind === 'image' ? (
                <img key={aid} src={attachmentUrl(aid)} alt={meta.filename ?? ''} />
              ) : (
                <div key={aid} className="att-file">
                  📎 {meta.filename ?? `${meta.mime} ${meta.bytes}b`}
                </div>
              );
            })}
          </div>
        )}
        {toolCalls.map((tc) => (
          <ToolCallCard
            key={tc.id}
            call={tc}
            result={toolResultsByCallId[tc.id]}
            nestedRun={nestedRuns[tc.id]}
          />
        ))}
      </div>
    </div>
  );
}

function ToolCallCard({
  call,
  result,
  nestedRun,
}: {
  call: { id: string; function: { name: string; arguments: string } };
  result?: string;
  nestedRun?: NestedRunState;
}) {
  const args = call.function.arguments;
  const hasArgs = args && args !== '{}';
  return (
    <div>
      <div className="tool-card">
        <div className="tool-card-head">
          <span className="tag">call</span>
          <span>{call.function.name}</span>
        </div>
        {hasArgs && (
          <>
            <div className="collapsible-section-label">args</div>
            <CollapsibleBlock body={prettifyJSON(args)} />
          </>
        )}
        {result !== undefined && result !== '' && (
          <>
            <div className="collapsible-section-label">result</div>
            <CollapsibleBlock body={result} />
          </>
        )}
      </div>
      {nestedRun && nestedRun.events.length > 0 && <NestedRunPanel run={nestedRun} />}
    </div>
  );
}

function CollapsibleBlock({
  body,
  maxPreviewLines = 8,
}: {
  body: string;
  maxPreviewLines?: number;
}) {
  const lineCount = body.split('\n').length;
  const longByLine = lineCount > maxPreviewLines;
  const longByChar = body.length > 800;
  const collapsibleNeeded = longByLine || longByChar;
  const [open, setOpen] = useState(false);
  if (!collapsibleNeeded) {
    return <div className="collapsible-body">{body}</div>;
  }
  const label = longByLine
    ? `${lineCount} lines`
    : `${body.length.toLocaleString()} chars`;
  return (
    <div className="collapsible">
      <div className={`collapsible-body${open ? '' : ' is-collapsed'}`}>{body}</div>
      <button type="button" className="collapsible-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? `▲ Collapse (${label})` : `▼ Show all (${label})`}
      </button>
    </div>
  );
}

function NestedRunPanel({ run }: { run: NestedRunState }) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 4);
  }, [run.events.length]);

  return (
    <div className="nested-run">
      <div className="nested-run-head">
        <span className="skill-id">run_skill</span>
        <span>{nestedRunHead(run)}</span>
        <span className="ev-count">
          {run.events.length} ev{overflowing ? ' ↓' : ''}
        </span>
      </div>
      <div ref={bodyRef} className={`nested-run-body${overflowing ? ' is-overflowing' : ''}`}>
        {run.events.map((ev, i) => (
          <div className="ev" key={i}>
            <span className="t">{ev.type}</span> · {summarizeRunEvent(ev)}
          </div>
        ))}
      </div>
    </div>
  );
}

function nestedRunHead(s: NestedRunState): string {
  if (!s.done) return `${s.events.length} events…`;
  if (s.ok === true) return 'completed';
  if (s.ok === false) return 'failed';
  return 'finished';
}

function summarizeRunEvent(ev: RunEvent): string {
  switch (ev.type) {
    case 'start':
      return `skill=${ev.payload.skillId} cap=${ev.payload.turnCap}`;
    case 'preflight':
      return `ready=${ev.payload.ready} blockers=${ev.payload.blockers.length}`;
    case 'stub':
      return `${ev.payload.skillId} ${ev.payload.preExisted ? 'kept' : 'stubbed'}`;
    case 'turn':
      return `#${ev.payload.index} ${truncate(ev.payload.text, 120)}`;
    case 'tool_call':
      return `${ev.payload.name}(${truncate(ev.payload.arguments, 80)})`;
    case 'tool_result':
      return `${ev.payload.id.slice(-6)} ${ev.payload.ok ? '✓' : '×'} ${truncate(ev.payload.summary, 120)}`;
    case 'validate':
      return ev.payload.ok ? 'schema ok' : `${ev.payload.errors.length} errors`;
    case 'done':
      return `ok=${ev.payload.ok} ${ev.payload.reason}`;
    case 'result':
      return `ok=${ev.payload.ok} turns=${ev.payload.turns}`;
    case 'error':
      return ev.payload.message;
    default:
      return '';
  }
}

function truncate(s: string, n: number): string {
  if (!s) return '';
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function formatTokens(n: number): string {
  if (n < 1000) return String(n);
  if (n < 100_000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n / 1000)}k`;
}

function renderMeta(messages: Message[]): string {
  const visible = messages.filter((m) => m.role !== 'system');
  let total = 0;
  for (const m of messages) {
    if (m.role === 'assistant' && typeof m.total_tokens === 'number') {
      total += m.total_tokens;
    }
  }
  const count = `${visible.length} messages`;
  return total > 0 ? `${count} · ${formatTokens(total)} tok` : count;
}

function prettifyJSON(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}

function ApprovalCard({
  payload,
  brandId,
  queueDepth,
  note,
  busy,
  onChangeNote,
  onApprove,
  onModifyRerun,
  onDismiss,
}: {
  payload: AwaitingApprovalPayload;
  brandId: string;
  queueDepth?: number;
  note: string;
  busy: boolean;
  onChangeNote: (v: string) => void;
  onApprove: () => void;
  onModifyRerun: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="approval-card">
      <div className="approval-card-head">
        <span className="approval-tag">approval</span>
        <span className="approval-skill">
          {payload.skill_id} · {payload.full_name}
        </span>
        <span className="approval-status">等待审批</span>
      </div>
      <div className="approval-card-body">
        {payload.summary && <div className="approval-summary">{payload.summary}</div>}
        <div className="approval-path">{payload.output_path}</div>
        {payload.data != null && (
          <OutputPreview
            data={payload.data}
            readonly={busy}
            onSave={async (next) => updateSkillOutput(payload.skill_id, next, brandId)}
          />
        )}
        {queueDepth && queueDepth > 1 && (
          <div className="approval-queue">队列：还有 {queueDepth - 1} 条待审</div>
        )}
        <textarea
          className="approval-textarea"
          value={note}
          onChange={(e) => onChangeNote(e.target.value)}
          placeholder="（可选）写下修改建议，点 提建议重跑 让 agent 用新要求重新运行该步骤"
          rows={2}
          disabled={busy}
          data-magic="不满意时在这里写改进建议（如：audience 加一个银发族），下面点 提建议重跑"
        />
        <div className="approval-actions">
          <button
            className="btn-primary"
            onClick={onApprove}
            disabled={busy}
            data-magic="这一步的产出 OK，让 agent 继续做下一步；同时会自动刷新品牌长期记忆 (brand profile)"
          >
            {busy ? '处理中…' : '批准 → 下一步'}
          </button>
          <button
            className="btn-ghost"
            onClick={onModifyRerun}
            disabled={busy || !note.trim()}
            data-magic="按上面写的备注重新跑这一步；要先填备注才能点"
          >
            提建议重跑
          </button>
          <span className="spacer" />
          <button
            className="btn-ghost"
            onClick={onDismiss}
            disabled={busy}
            title="忽略 (不记录)"
            data-magic="先放着不审批；下次还能再回来"
          >
            忽略
          </button>
        </div>
      </div>
    </div>
  );
}

