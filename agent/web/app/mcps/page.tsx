'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import {
  type McpStatus,
  type McpPriority,
  fetchMcps,
} from '../../lib/agent';
import { skillDisplayName } from '../../lib/skill-names';

const PRIORITY_LABEL: Record<McpPriority, string> = {
  required: '必填',
  recommended: '推荐',
  optional: '可选',
};

export default function McpsPage() {
  const [items, setItems] = useState<McpStatus[]>([]);
  const [summary, setSummary] = useState<{ total: number; connected: number }>({ total: 0, connected: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchMcps()
      .then((r) => {
        setItems(r.mcps);
        setSummary(r.summary);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const connected = useMemo(() => items.filter((i) => i.connected), [items]);
  const recommended = useMemo(
    () => items.filter((i) => !i.connected && i.priority !== 'optional'),
    [items],
  );
  const optional = useMemo(
    () => items.filter((i) => !i.connected && i.priority === 'optional'),
    [items],
  );

  return (
    <>
      <Sidebar />
      <main className="main">
        <div className="main-header">
          <div className="main-title">MCP 浏览</div>
          <div className="main-meta">
            已接入 {summary.connected} / {summary.total}
          </div>
        </div>
        <div className="main-body" style={{ padding: '20px 28px 60px' }}>
          {loading && <div style={{ color: 'var(--fg-muted)' }}>加载中…</div>}
          {err && <div style={{ color: 'var(--status-err)' }}>加载失败：{err}</div>}

          {!loading && !err && (
            <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div style={{ color: 'var(--fg-muted)', fontSize: 12 }}>
                通过扫描本机 <code>~/.claude.json</code> / <code>claude_desktop_config.json</code> /{' '}
                <code>~/.cursor/mcp.json</code> / 工程根目录的 <code>.mcp.json</code> 推断；只看 server 名是否出现，不读取任何 token。
              </div>
              <Section
                title="已接入"
                subtitle="本机的 MCP 配置中检测到对应 server"
                items={connected}
                emptyHint="本机还没有检测到任何 MCP server。安装下方推荐的 server 后会自动出现在这里。"
              />
              <Section
                title="推荐接入"
                subtitle="跑 EEC 流程时帮助最大的 MCP"
                items={recommended}
                emptyHint="所有推荐 MCP 都已接入。"
              />
              <Section
                title="可选 / Phase 2"
                subtitle="按业务需要再接"
                items={optional}
                emptyHint="—"
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function Section({
  title,
  subtitle,
  items,
  emptyHint,
}: {
  title: string;
  subtitle: string;
  items: McpStatus[];
  emptyHint: string;
}) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>{title}</h2>
        <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>{subtitle}</span>
        <span style={{ marginLeft: 'auto', color: 'var(--fg-faint)', fontSize: 12 }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--fg-muted)', fontSize: 13 }}>
          {emptyHint}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
          {items.map((it) => <McpCard key={it.id} item={it} />)}
        </div>
      )}
    </section>
  );
}

function McpCard({ item }: { item: McpStatus }) {
  return (
    <div className={`integration-card ${item.connected ? 'is-connected' : ''}`}>
      <div className="integration-card-head">
        <div className="integration-card-title">
          <span className={`integration-dot ${item.connected ? 'on' : 'off'}`} />
          <span>{item.name}</span>
        </div>
        <span className={`integration-priority p-${item.priority}`}>
          {PRIORITY_LABEL[item.priority]}
        </span>
      </div>

      <div className="integration-meta">
        <span className="integration-category">{item.category}</span>
      </div>

      <p className="integration-desc">{item.description}</p>

      {item.used_by_skills.length > 0 && (
        <div className="integration-skills">
          {item.used_by_skills.map((sid) => (
            <span key={sid} className="integration-skill-tag" title={`flow ${sid}`}>
              {skillDisplayName(sid)}
            </span>
          ))}
        </div>
      )}

      {item.aliases && item.aliases.length > 0 && (
        <div className="integration-env">
          <div className="integration-env-label">配置 key</div>
          <div className="integration-env-vars">
            {item.aliases.map((k) => (
              <code key={k} className={`integration-env-var ${item.connected ? 'set' : 'missing'}`}>
                {k}
              </code>
            ))}
          </div>
        </div>
      )}

      {item.docs_url && (
        <a
          className="integration-docs"
          href={item.docs_url}
          target="_blank"
          rel="noreferrer noopener"
        >
          文档 →
        </a>
      )}
    </div>
  );
}
