'use client';

import { use, useEffect, useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import {
  type Brand,
  type BrandProfile,
  fetchBrandProfile,
  fetchBrands,
  distillBrandProfile,
  updateBrandProfile,
} from '../../../lib/agent';

interface BrandProfilePageProps {
  params: Promise<{ brandId: string }>;
}

export default function BrandProfilePage({ params }: BrandProfilePageProps) {
  const { brandId } = use(params);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [profile, setProfile] = useState<BrandProfile>({ profile: null, updated_at: null });
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<'idle' | 'distilling' | 'saving'>('idle');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands().then(({ brands }) => {
      setBrand(brands.find((b) => b.id === brandId) ?? null);
    });
  }, [brandId]);

  useEffect(() => {
    let cancelled = false;
    fetchBrandProfile(brandId)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setDraft(p.profile ?? '');
      })
      .catch((e: Error) => setErr(e.message));
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  const handleDistill = async () => {
    setBusy('distilling');
    setErr(null);
    try {
      const r = await distillBrandProfile(brandId);
      setProfile({ profile: r.profile, updated_at: r.updated_at });
      setDraft(r.profile);
      setEditing(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy('idle');
    }
  };

  const handleSave = async () => {
    setBusy('saving');
    setErr(null);
    try {
      const r = await updateBrandProfile(brandId, draft);
      setProfile({ profile: r.profile, updated_at: r.updated_at });
      setEditing(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy('idle');
    }
  };

  const handleCancel = () => {
    setDraft(profile.profile ?? '');
    setEditing(false);
  };

  return (
    <>
      <Sidebar activeBrandId={brandId} />
      <main className="main">
        <div className="main-header">
          <div className="main-title">
            Brand Profile {brand ? <span style={{ color: 'var(--fg-muted)', fontWeight: 400 }}>· {brand.name}</span> : null}
          </div>
          <div className="main-meta" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {profile.updated_at && (
              <span style={{ color: 'var(--fg-faint)', fontSize: 12 }}>
                更新于 {formatDate(profile.updated_at)}
              </span>
            )}
            {!editing && (
              <>
                <button
                  className="btn-ghost"
                  onClick={() => setEditing(true)}
                  disabled={busy !== 'idle' || profile.profile === null}
                >
                  编辑
                </button>
                <button
                  className="btn-primary"
                  onClick={handleDistill}
                  disabled={busy !== 'idle'}
                  title="Re-run L3 distillation from approvals + skill outputs + memories"
                >
                  {busy === 'distilling' ? '正在提炼…' : profile.profile ? '重新提炼' : '生成 profile'}
                </button>
              </>
            )}
            {editing && (
              <>
                <button className="btn-ghost" onClick={handleCancel} disabled={busy !== 'idle'}>
                  取消
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={busy !== 'idle'}>
                  {busy === 'saving' ? '保存中…' : '保存'}
                </button>
              </>
            )}
          </div>
        </div>
        <div className="main-body" style={{ padding: '20px 28px 60px' }}>
          <div style={{ maxWidth: 920, margin: '0 auto' }}>
            <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginTop: 0 }}>
              这份 profile 由 approvals + 已落盘的 skill outputs + memories 提炼而来，
              会自动注入到所有 LLM 调用的 system prompt 顶部。每次 approval 后会异步刷新。
            </p>

            {err && (
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--status-err)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: 'var(--status-err)',
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                {err}
              </div>
            )}

            {profile.profile === null && !editing && busy === 'idle' && (
              <div
                style={{
                  padding: '24px',
                  background: 'var(--bg-card)',
                  border: '1px dashed var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--fg-muted)',
                  textAlign: 'center',
                }}
              >
                这个 brand 还没有 profile。点击右上角"生成 profile"开始 L3 提炼。
              </div>
            )}

            {editing ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={28}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-mono, ui-monospace), Menlo, monospace',
                  fontSize: 13,
                  lineHeight: 1.6,
                  padding: 14,
                  background: 'var(--bg-card)',
                  color: 'var(--fg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  resize: 'vertical',
                }}
                placeholder="# Brand Profile (auto-distilled)\n\n## 1. 品牌定位\n…"
              />
            ) : (
              profile.profile && (
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 18,
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: 'var(--fg)',
                    fontFamily: 'var(--font-mono, ui-monospace), Menlo, monospace',
                  }}
                >
                  {profile.profile}
                </pre>
              )
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}
