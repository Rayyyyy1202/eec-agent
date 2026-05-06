'use client';

import { useEffect, useRef, useState } from 'react';
import {
  askField,
  getStoredModel,
  setStoredModel,
  type AskMeEvent,
  type SiteSpec,
} from '../lib/agent';
import ModelPicker from './ModelPicker';

interface AskMeChatProps {
  brandId: string;
  fieldPath: string;
  fieldLabel: string;
  onClose: () => void;
  onFieldUpdated: (spec: SiteSpec) => void;
}

interface Bubble {
  role: 'assistant' | 'user' | 'system';
  text: string;
}

export default function AskMeChat({
  brandId,
  fieldPath,
  fieldLabel,
  onClose,
  onFieldUpdated,
}: AskMeChatProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [history, setHistory] = useState<unknown[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [doneOk, setDoneOk] = useState(false);
  const [model, setModel] = useState<string>('gpt-5.4');
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    setModel(getStoredModel());
  }, []);

  const handleModelChange = (next: string) => {
    setModel(next);
    setStoredModel(next);
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    // Use the stored model on first run; subsequent replies reuse current model state.
    void runStep({ field_path: fieldPath, model: getStoredModel() });
  }, [fieldPath]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [bubbles]);

  async function runStep(body: { field_path: string; user_reply?: string; history?: unknown[]; model?: string }) {
    setBusy(true);
    try {
      await askField(brandId, body, (e: AskMeEvent) => {
        if (e.type === 'tool_call' && e.payload.name === 'ask_user') {
          try {
            const args = JSON.parse(e.payload.arguments) as { question?: string };
            if (args.question) {
              setBubbles((prev) => [...prev, { role: 'assistant', text: args.question! }]);
            }
          } catch {
            /* skip */
          }
        } else if (e.type === 'turn' && e.payload.text) {
          setBubbles((prev) => [...prev, { role: 'assistant', text: e.payload.text }]);
        } else if (e.type === 'awaiting_user') {
          if (e.payload.question) {
            // Ensure visible even if no separate tool_call surfaced.
            setBubbles((prev) => {
              if (prev.length > 0 && prev[prev.length - 1]!.text === e.payload.question) return prev;
              return [...prev, { role: 'assistant', text: e.payload.question }];
            });
          }
        } else if (e.type === 'state') {
          setHistory(e.payload.history);
        } else if (e.type === 'field_updated') {
          setBubbles((prev) => [
            ...prev,
            { role: 'system', text: `✓ Saved value for ${fieldLabel}` },
          ]);
          onFieldUpdated(e.payload.spec);
          setDoneOk(true);
        } else if (e.type === 'error') {
          setBubbles((prev) => [...prev, { role: 'system', text: `error: ${e.payload.message}` }]);
        }
      });
    } finally {
      setBusy(false);
    }
  }

  const sendReply = async () => {
    const reply = input.trim();
    if (!reply || busy || doneOk) return;
    setInput('');
    setBubbles((prev) => [...prev, { role: 'user', text: reply }]);
    await runStep({ field_path: fieldPath, user_reply: reply, history, model });
  };

  return (
    <aside className="askme-panel">
      <div className="askme-head">
        <div>
          <div className="askme-title">Ask AI</div>
          <code className="askme-path">{fieldPath}</code>
        </div>
        <div className="askme-head-controls">
          <ModelPicker value={model} onChange={handleModelChange} disabled={busy || doneOk} compact />
          <button className="icon-btn" onClick={onClose} title="Close">
            ×
          </button>
        </div>
      </div>
      <div className="askme-stream" ref={scrollRef}>
        {bubbles.length === 0 && !busy && (
          <div className="askme-empty">Starting conversation…</div>
        )}
        {bubbles.map((b, i) => (
          <div key={i} className={`askme-bubble askme-bubble-${b.role}`}>
            {b.text}
          </div>
        ))}
        {busy && <div className="askme-typing">AI is thinking…</div>}
      </div>
      <div className="askme-composer">
        {doneOk ? (
          <button className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
            Done — close
          </button>
        ) : (
          <>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer…"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendReply();
                }
              }}
              disabled={busy}
            />
            <button className="btn-primary" onClick={sendReply} disabled={busy || !input.trim()}>
              Send
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
