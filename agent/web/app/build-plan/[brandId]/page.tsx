'use client';

import { use, useEffect, useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import SpecView from '../../../components/SpecView';
import AskMeChat from '../../../components/AskMeChat';
import {
  buildFromSpec,
  fetchBrands,
  fetchSpec,
  getStoredModel,
  patchSpec,
  refreshSpec,
  setStoredModel,
  type Brand,
  type SiteSpec,
  type SpecBuildEvent,
  type SpecCompleteness,
} from '../../../lib/agent';
import ModelPicker from '../../../components/ModelPicker';

interface BuildPlanPageProps {
  params: Promise<{ brandId: string }>;
}

export default function BuildPlanPage({ params }: BuildPlanPageProps) {
  const { brandId } = use(params);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [spec, setSpec] = useState<SiteSpec | null>(null);
  const [completeness, setCompleteness] = useState<SpecCompleteness | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [askField, setAskField] = useState<{ path: string; label: string } | null>(null);

  const [buildBusy, setBuildBusy] = useState(false);
  const [buildLog, setBuildLog] = useState<string[]>([]);
  const [showBuildPanel, setShowBuildPanel] = useState(false);
  const [model, setModel] = useState<string>('gpt-5.4');

  useEffect(() => {
    setModel(getStoredModel());
  }, []);

  const handleModelChange = (next: string) => {
    setModel(next);
    setStoredModel(next);
  };

  useEffect(() => {
    fetchBrands().then(({ brands }) => {
      const b = brands.find((x) => x.id === brandId) ?? null;
      setBrand(b);
    });
  }, [brandId]);

  useEffect(() => {
    let cancelled = false;
    fetchSpec(brandId)
      .then((r) => {
        if (cancelled) return;
        setSpec(r.spec);
        setCompleteness(r.completeness);
      })
      .catch((e) => setLoadErr((e as Error).message));
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  const handlePatch = async (path: string, value: unknown) => {
    const r = await patchSpec(brandId, path, value);
    setSpec(r.spec);
    setCompleteness(r.completeness);
  };

  const handleRefresh = async () => {
    const r = await refreshSpec(brandId);
    setSpec(r.spec);
    setCompleteness(r.completeness);
  };

  const handleAskMe = (path: string, label: string) => {
    setAskField({ path, label });
  };

  const handleAskClosed = () => {
    setAskField(null);
    fetchSpec(brandId).then((r) => {
      setSpec(r.spec);
      setCompleteness(r.completeness);
    });
  };

  const handleAskFieldUpdated = (next: SiteSpec) => {
    setSpec(next);
    fetchSpec(brandId).then((r) => setCompleteness(r.completeness));
  };

  const handleBuild = async () => {
    if (buildBusy) return;
    setBuildBusy(true);
    setBuildLog([]);
    setShowBuildPanel(true);
    try {
      await buildFromSpec(brandId, { model }, (e: SpecBuildEvent) => {
        const line = `[${e.type}] ${summarize(e)}`;
        setBuildLog((prev) => [...prev, line]);
      });
    } catch (e) {
      setBuildLog((prev) => [...prev, `[error] ${(e as Error).message}`]);
    } finally {
      setBuildBusy(false);
    }
  };

  if (loadErr) {
    return (
      <>
        <Sidebar />
        <main className="main">
          <div className="main-header">
            <div className="main-title">Build Plan</div>
          </div>
          <div className="main-body" style={{ padding: 24 }}>
            <div style={{ color: 'var(--status-err)' }}>Error loading spec: {loadErr}</div>
          </div>
        </main>
      </>
    );
  }

  if (!spec || !completeness) {
    return (
      <>
        <Sidebar />
        <main className="main">
          <div className="main-header">
            <div className="main-title">Build Plan</div>
          </div>
          <div className="main-body" style={{ padding: 24, color: 'var(--fg-muted)' }}>
            Loading…
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="main">
        <div className="main-header">
          <div className="main-title">
            Build Plan {brand && <span className="main-meta">· {brand.name}</span>}
          </div>
          <div className="main-header-right">
            <ModelPicker value={model} onChange={handleModelChange} disabled={buildBusy} compact />
            <span className="main-meta">
              updated {new Date(spec.updated_at).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="main-body main-body-spec">
          <SpecView
            spec={spec}
            completeness={completeness}
            onPatch={handlePatch}
            onAskMe={handleAskMe}
            onRefresh={handleRefresh}
            onBuild={handleBuild}
            buildBusy={buildBusy}
          />
          {showBuildPanel && (
            <div
              className="build-log"
              data-magic="agent 跑 05 建站时的实时日志：每个 turn / tool_call / validate 都会出现一行"
            >
              <div className="build-log-head">
                <span>Skill 05 — site build</span>
                <button className="icon-btn" onClick={() => setShowBuildPanel(false)} title="Hide">
                  ×
                </button>
              </div>
              <div className="build-log-body">
                {buildLog.length === 0 && <div className="build-log-empty">Waiting for events…</div>}
                {buildLog.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      {askField && (
        <AskMeChat
          brandId={brandId}
          fieldPath={askField.path}
          fieldLabel={askField.label}
          onClose={handleAskClosed}
          onFieldUpdated={handleAskFieldUpdated}
        />
      )}
    </>
  );
}

function summarize(e: SpecBuildEvent): string {
  if (e.type === 'spec_written') return e.payload.path;
  if (e.type === 'turn') return `turn ${e.payload.index} (${e.payload.finish ?? '…'})`;
  if (e.type === 'tool_call') return `${e.payload.name}`;
  if (e.type === 'tool_result') return `${e.payload.id} ${e.payload.ok ? 'ok' : 'fail'} — ${e.payload.summary}`;
  if (e.type === 'validate') return e.payload.ok ? 'schema ok' : `${e.payload.errors.length} errors`;
  if (e.type === 'done') return e.payload.reason;
  if (e.type === 'result') return `${e.payload.ok ? 'ok' : 'fail'} — ${e.payload.reason}`;
  if (e.type === 'error') return e.payload.message;
  return JSON.stringify(e.payload).slice(0, 120);
}
