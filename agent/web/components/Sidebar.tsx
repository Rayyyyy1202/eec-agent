'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  type Brand,
  type Conversation,
  fetchBrands,
  fetchConversations,
  createBrand,
  createConversation,
  archiveConversation,
  renameConversation,
  deleteBrand,
  updateBrand,
} from '../lib/agent';

interface SidebarProps {
  activeConversationId?: string;
  activeBrandId?: string;
  onActiveBrandChange?: (brandId: string | null) => void;
}

export default function Sidebar({ activeConversationId, activeBrandId, onActiveBrandChange }: SidebarProps) {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [defaultBrandId, setDefaultBrandId] = useState<string | null>(null);
  const [convsByBrand, setConvsByBrand] = useState<Record<string, Conversation[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    fetchBrands().then(({ brands: bs, default_brand_id }) => {
      setBrands(bs);
      setDefaultBrandId(default_brand_id);
      const next: Record<string, boolean> = {};
      for (const b of bs) next[b.id] = true;
      setExpanded(next);
    });
  }, [refreshTick]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(brands.map(async (b) => [b.id, await fetchConversations(b.id)] as const)).then((rows) => {
      if (cancelled) return;
      const map: Record<string, Conversation[]> = {};
      for (const [id, list] of rows) map[id] = list;
      setConvsByBrand(map);
    });
    return () => {
      cancelled = true;
    };
  }, [brands, refreshTick]);

  // notify parent of active brand
  useEffect(() => {
    if (!activeConversationId || !onActiveBrandChange) return;
    for (const [bid, list] of Object.entries(convsByBrand)) {
      if (list.some((c) => c.id === activeConversationId)) {
        onActiveBrandChange(bid);
        return;
      }
    }
  }, [activeConversationId, convsByBrand, onActiveBrandChange]);

  const handleNewConv = async (brandId: string) => {
    const c = await createConversation(brandId);
    setRefreshTick((t) => t + 1);
    router.push(`/chat/${c.id}`);
  };

  const handleRename = async (c: Conversation) => {
    const next = window.prompt('Rename conversation', c.title);
    if (!next || next === c.title) return;
    await renameConversation(c.id, next);
    setRefreshTick((t) => t + 1);
  };

  const handleArchive = async (c: Conversation) => {
    if (!window.confirm(`Archive "${c.title}"?`)) return;
    await archiveConversation(c.id);
    if (c.id === activeConversationId) router.push('/chat');
    setRefreshTick((t) => t + 1);
  };

  const handleRenameBrand = async (b: Brand) => {
    const next = window.prompt('Rename brand', b.name);
    if (!next || next === b.name) return;
    await updateBrand(b.id, { name: next });
    setRefreshTick((t) => t + 1);
  };

  const handleArchiveBrand = async (b: Brand) => {
    if (!window.confirm(`Archive brand "${b.name}"? Conversations stay in the database but the brand is hidden.`)) return;
    await deleteBrand(b.id);
    setRefreshTick((t) => t + 1);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/chat" className="sidebar-logo" style={{ color: 'inherit' }}>
          <span className="logo-mark" />
          <span>EEC Agent</span>
        </Link>
        <div className="sidebar-actions">
          <button
            className="icon-btn"
            title="New brand"
            onClick={() => setShowBrandModal(true)}
            aria-label="New brand"
          >
            +
          </button>
        </div>
      </div>

      <div className="sidebar-scroll">
        {brands.length === 0 && (
          <div style={{ padding: '12px', color: 'var(--fg-muted)', fontSize: 12 }}>
            No brands yet. Click + to add one.
          </div>
        )}
        {brands.map((b) => {
          const isExpanded = expanded[b.id] !== false;
          const convs = convsByBrand[b.id] ?? [];
          return (
            <div className="brand-group" key={b.id}>
              <div
                className={`brand-row ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpanded({ ...expanded, [b.id]: !isExpanded })}
                onContextMenu={(e) => {
                  e.preventDefault();
                  const choice = window.prompt(`Brand actions for "${b.name}":\n  r — rename\n  d — archive\n(empty = cancel)`);
                  if (choice === 'r') handleRenameBrand(b);
                  else if (choice === 'd') handleArchiveBrand(b);
                }}
                title="Right-click for actions"
              >
                <span className="brand-avatar">{b.name.slice(0, 1).toUpperCase()}</span>
                <span className="brand-name">{b.name}</span>
                {b.id === defaultBrandId && (
                  <span style={{ fontSize: 10, color: 'var(--fg-faint)' }}>default</span>
                )}
                <span className="brand-caret">▶</span>
              </div>
              {isExpanded && (
                <div className="conv-list">
                  {convs.length === 0 && <div className="conv-empty">No conversations</div>}
                  {convs.map((c) => (
                    <div
                      key={c.id}
                      className={`conv-row ${c.id === activeConversationId ? 'active' : ''}`}
                      onClick={() => router.push(`/chat/${c.id}`)}
                      title={c.title}
                    >
                      <span className="conv-title">{c.title}</span>
                      <span className="conv-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="icon-btn"
                          style={{ width: 22, height: 22, fontSize: 11 }}
                          onClick={() => handleRename(c)}
                          title="Rename"
                        >
                          ✎
                        </button>
                        <button
                          className="icon-btn"
                          style={{ width: 22, height: 22, fontSize: 13 }}
                          onClick={() => handleArchive(c)}
                          title="Archive"
                        >
                          ×
                        </button>
                      </span>
                    </div>
                  ))}
                  <div
                    className="brand-add-conv"
                    onClick={() => handleNewConv(b.id)}
                  >
                    + New conversation
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <Link href="/pipeline" className="footer-link" style={{ color: 'inherit' }}>
          <span className="icon">▦</span>
          <span>Pipeline</span>
        </Link>
        <div
          className="footer-link"
          onClick={() => {
            const target = activeBrandId ?? defaultBrandId ?? brands[0]?.id;
            if (target) router.push(`/build-plan/${target}`);
          }}
          title={activeBrandId ?? defaultBrandId ? 'Open build plan' : 'No brand selected'}
        >
          <span className="icon">▤</span>
          <span>Build Plan</span>
        </div>
        <div
          className="footer-link"
          onClick={() => {
            const target = activeBrandId ?? defaultBrandId ?? brands[0]?.id;
            if (target) router.push(`/assets/${target}`);
          }}
          title={activeBrandId ?? defaultBrandId ? 'Open asset library' : 'No brand selected'}
        >
          <span className="icon">◇</span>
          <span>素材库</span>
        </div>
        <div
          className="footer-link"
          onClick={() => router.push('/memory')}
        >
          <span className="icon">◆</span>
          <span>Memory</span>
        </div>
        <Link href="/integrations" className="footer-link" style={{ color: 'inherit' }}>
          <span className="icon">⌬</span>
          <span>API 接口</span>
        </Link>
        <Link href="/mcps" className="footer-link" style={{ color: 'inherit' }}>
          <span className="icon">⊙</span>
          <span>MCP 浏览</span>
        </Link>
      </div>

      {showBrandModal && (
        <NewBrandModal
          onClose={() => setShowBrandModal(false)}
          onCreated={(b) => {
            setShowBrandModal(false);
            setRefreshTick((t) => t + 1);
            handleNewConv(b.id);
          }}
        />
      )}
    </aside>
  );
}

function NewBrandModal({ onClose, onCreated }: { onClose: () => void; onCreated: (b: Brand) => void }) {
  const [name, setName] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [brief, setBrief] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      setErr('name is required');
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const b = await createBrand(name.trim(), workspace.trim(), brief.trim() || undefined);
      onCreated(b);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New brand</h2>
        <label>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Petropolitian" autoFocus />
        <label>Workspace path <span style={{ color: 'var(--fg-faint)', fontWeight: 400 }}>(optional — auto from name if empty)</span></label>
        <input
          type="text"
          value={workspace}
          onChange={(e) => setWorkspace(e.target.value)}
          placeholder={name.trim() ? `auto: <repo>/${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}` : '/Users/you/projects/my-brand'}
        />
        <label>Default brand brief (optional)</label>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={3}
          placeholder="designer dog collars sized for every dog"
        />
        {err && <div style={{ color: 'var(--status-err)', fontSize: 12, marginTop: 8 }}>{err}</div>}
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create brand'}
          </button>
        </div>
      </div>
    </div>
  );
}
