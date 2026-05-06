'use client';

import { useState } from 'react';
import type { NavItem, Route, Section, SiteSpec, SpecCompleteness } from '../lib/agent';
import { SourceBadge, SpecField } from './SpecField';

interface SpecViewProps {
  spec: SiteSpec;
  completeness: SpecCompleteness;
  onPatch: (path: string, value: unknown) => Promise<void>;
  onAskMe: (path: string, label: string) => void;
  onRefresh: () => Promise<void>;
  onBuild: () => void;
  buildBusy: boolean;
}

export default function SpecView({
  spec,
  completeness,
  onPatch,
  onAskMe,
  onRefresh,
  onBuild,
  buildBusy,
}: SpecViewProps) {
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const pct =
    completeness.total_required === 0
      ? 100
      : Math.round(
          ((completeness.total_required - completeness.required_empty) /
            completeness.total_required) *
            100,
        );

  return (
    <div className="spec-view">
      <div className="spec-toolbar">
        <div className="spec-progress">
          <div className="spec-progress-track">
            <div
              className={`spec-progress-fill ${completeness.ready_to_build ? 'ready' : ''}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="spec-progress-label">
            {completeness.total_required - completeness.required_empty} /{' '}
            {completeness.total_required} required filled · {completeness.filled} fields total
          </div>
        </div>
        <div className="spec-toolbar-actions">
          <button className="btn-ghost" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : '↻ Refresh from sources'}
          </button>
          <button
            className="btn-primary"
            onClick={onBuild}
            disabled={!completeness.ready_to_build || buildBusy}
            title={completeness.ready_to_build ? '' : 'Fill all required fields first'}
          >
            {buildBusy ? 'Building…' : '▶ Build site'}
          </button>
        </div>
      </div>

      <Section title="Global">
        <SpecField
          label="Brand name"
          path="/global/brand_name"
          envelope={spec.global.brand_name}
          onSave={onPatch}
          onAskMe={onAskMe}
        />
        <SpecField
          label="Tagline"
          path="/global/tagline"
          envelope={spec.global.tagline}
          onSave={onPatch}
          onAskMe={onAskMe}
        />
        <SpecField
          label="Mission"
          path="/global/mission"
          envelope={spec.global.mission}
          multiline
          onSave={onPatch}
          onAskMe={onAskMe}
        />
        <SpecField<string[]>
          label="Primary palette (hex, comma-separated)"
          path="/global/primary_palette"
          envelope={spec.global.primary_palette}
          toInput={(v) => (v ?? []).join(', ')}
          fromInput={(s) =>
            s
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean)
          }
          onSave={onPatch}
          onAskMe={onAskMe}
        />
        <SpecField
          label="Logo brief"
          path="/global/logo_brief"
          envelope={spec.global.logo_brief}
          multiline
          onSave={onPatch}
          onAskMe={onAskMe}
        />
        <SpecField
          label="Voice & tone"
          path="/global/voice_tone"
          envelope={spec.global.voice_tone}
          multiline
          onSave={onPatch}
          onAskMe={onAskMe}
        />
        <SpecField
          label="Domain"
          path="/global/domain"
          envelope={spec.global.domain}
          onSave={onPatch}
          onAskMe={onAskMe}
        />
        <SpecField
          label="Tech stack"
          path="/global/tech_stack"
          envelope={spec.global.tech_stack}
          onSave={onPatch}
          onAskMe={onAskMe}
        />
      </Section>

      <Section title="Navigation">
        <SpecField<NavItem[]>
          label="Header"
          path="/navigation/header"
          envelope={spec.navigation.header}
          toInput={(v) => navToInput(v)}
          fromInput={(s) => navFromInput(s)}
          multiline
          onSave={onPatch}
          onAskMe={onAskMe}
        />
        <SpecField<NavItem[]>
          label="Footer"
          path="/navigation/footer"
          envelope={spec.navigation.footer}
          toInput={(v) => navToInput(v)}
          fromInput={(s) => navFromInput(s)}
          multiline
          onSave={onPatch}
          onAskMe={onAskMe}
        />
        <p className="spec-hint">Format: <code>label → /route</code> per line.</p>
      </Section>

      <Section title={`Routes (${spec.routes.length})`}>
        {spec.routes.length === 0 && (
          <div className="spec-empty">No routes yet — refresh from sources to seed defaults.</div>
        )}
        {spec.routes.map((route, idx) => (
          <RouteCard
            key={`${route.path}-${idx}`}
            route={route}
            index={idx}
            onPatch={onPatch}
            onAskMe={onAskMe}
          />
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="spec-section">
      <h3 className="spec-section-title">{title}</h3>
      <div className="spec-section-body">{children}</div>
    </div>
  );
}

function RouteCard({
  route,
  index,
  onPatch,
  onAskMe,
}: {
  route: Route;
  index: number;
  onPatch: (path: string, value: unknown) => Promise<void>;
  onAskMe: (path: string, label: string) => void;
}) {
  const [open, setOpen] = useState(idx0Open(index));
  return (
    <div className="route-card">
      <div className="route-card-head" onClick={() => setOpen(!open)}>
        <span className={`caret ${open ? 'open' : ''}`}>▶</span>
        <code className="route-path">{route.path}</code>
        <span className="route-title">{route.title}</span>
        {route.sku_template && <span className="route-pill">SKU template</span>}
        {route.source && <SourceBadge source={route.source} />}
        <span className="route-counts">
          {route.sections.length} section{route.sections.length === 1 ? '' : 's'}
        </span>
      </div>
      {open && (
        <div className="route-card-body">
          {route.seo_intent && <p className="route-seo">SEO intent: {route.seo_intent}</p>}
          <div className="section-list">
            {route.sections.map((sec, sIdx) => (
              <SectionRow
                key={`${sec.id}-${sIdx}`}
                section={sec}
                routeIdx={index}
                secIdx={sIdx}
                onPatch={onPatch}
                onAskMe={onAskMe}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionRow({
  section,
  routeIdx,
  secIdx,
  onPatch,
  onAskMe,
}: {
  section: Section;
  routeIdx: number;
  secIdx: number;
  onPatch: (path: string, value: unknown) => Promise<void>;
  onAskMe: (path: string, label: string) => void;
}) {
  const base = `/routes/${routeIdx}/sections/${secIdx}`;
  const summary = sectionSummary(section);
  return (
    <div className="section-row">
      <div className="section-row-head">
        <span className="section-id">{section.id}</span>
        <span className="section-variant">{section.variant}</span>
        {section.required && <span className="section-required" title="required">*</span>}
        {section.source && <SourceBadge source={section.source} />}
      </div>
      <div className="section-row-body">
        {summary.length === 0 ? (
          <span className="section-empty">empty section</span>
        ) : (
          summary.map((line, i) => (
            <code key={i} className="section-fact">
              {line}
            </code>
          ))
        )}
      </div>
      <div className="section-row-actions">
        {section.asset_id === null && (
          <button
            className="btn-askme"
            onClick={() => onAskMe(`${base}/asset_id`, `${section.id} asset`)}
          >
            ✦ pick asset
          </button>
        )}
        {section.copy_block_id === null && (
          <button
            className="btn-askme"
            onClick={() => onAskMe(`${base}/copy_block_id`, `${section.id} copy`)}
          >
            ✦ pick copy
          </button>
        )}
      </div>
    </div>
  );
}

function sectionSummary(s: Section): string[] {
  const out: string[] = [];
  if (s.asset_id) out.push(`asset:${s.asset_id}`);
  if (s.asset_ids?.length) out.push(`assets:${s.asset_ids.join(',')}`);
  if (s.copy_block_id) out.push(`copy:${s.copy_block_id}`);
  if (s.copy_block_ids?.length) out.push(`copy:${s.copy_block_ids.join(',')}`);
  if (s.sku_id) out.push(`sku:${s.sku_id}`);
  if (s.sku_ids?.length) out.push(`skus:${s.sku_ids.length}`);
  if (s.headline) out.push(`headline:${truncate(s.headline, 40)}`);
  if (s.body) out.push(`body:${truncate(s.body, 40)}`);
  if (s.cta) out.push(`cta:${s.cta.label} → ${s.cta.route}`);
  return out;
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function navToInput(v: NavItem[] | null): string {
  if (!v) return '';
  return v.map((it) => `${it.label} → ${it.route}`).join('\n');
}

function navFromInput(s: string): NavItem[] {
  return s
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, route] = line.split('→').map((x) => x.trim());
      if (!label || !route) throw new Error(`bad line "${line}" — use "label → /route"`);
      return { label, route };
    });
}

function idx0Open(idx: number): boolean {
  return idx === 0;
}
