'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, type Edge, type Node, type NodeProps, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import {
  fetchSkills,
  fetchWorkspaceState,
  fetchPreflight,
  streamRun,
  type SkillSummary,
  type SkillState,
  type PreflightReport,
  type RunEvent,
} from '@/lib/agent';

function colorFor(state: SkillState | undefined): string {
  if (!state || !state.exists) return '#3a4452';
  if (!state.valid) return '#c93b3b';
  if (state.synthetic) return '#d8a93a';
  return '#3aae50';
}

function PipelineNode({ data, selected }: NodeProps<{ skill: SkillSummary; state?: SkillState; onClick: () => void }>) {
  const { skill, state, onClick } = data;
  const bg = colorFor(state);
  return (
    <div
      onClick={onClick}
      style={{
        background: bg,
        color: '#0b0d10',
        border: selected ? '2px solid #fff' : '2px solid transparent',
        borderRadius: 8,
        padding: '10px 14px',
        minWidth: 170,
        textAlign: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#1e2630' }} />
      <div style={{ fontSize: 11, opacity: 0.8 }}>#{skill.id} · {skill.tier}</div>
      <div style={{ fontWeight: 700, marginTop: 2 }}>{skill.slug}</div>
      <Handle type="source" position={Position.Right} style={{ background: '#1e2630' }} />
    </div>
  );
}

const nodeTypes = { skill: PipelineNode };

const MAIN_ORDER = ['01', '02', '03', '04', '05', '06', '07a', '07b', '08', '09'];

function layoutNodes(skills: SkillSummary[], states: Map<string, SkillState>, onClick: (id: string) => void): Node[] {
  const xMain = 280;
  const yMain = 220;
  const sideOffset = 180;
  const nodes: Node[] = [];

  const mainIdx = new Map<string, number>();
  MAIN_ORDER.forEach((id, i) => mainIdx.set(id, i));

  for (const s of skills) {
    const isMain = mainIdx.has(s.id);
    let x: number, y: number;
    if (isMain) {
      x = 60 + (mainIdx.get(s.id) ?? 0) * xMain;
      y = yMain;
    } else {
      // side skills positioned near their primary upstream main node
      const anchor = s.upstream_required[0];
      const ax = mainIdx.has(anchor) ? 60 + (mainIdx.get(anchor) ?? 0) * xMain : 60;
      x = ax + 40;
      y = yMain + sideOffset;
    }
    nodes.push({
      id: s.id,
      type: 'skill',
      position: { x, y },
      data: { skill: s, state: states.get(s.id), onClick: () => onClick(s.id) },
    });
  }
  return nodes;
}

function makeEdges(skills: SkillSummary[]): Edge[] {
  const edges: Edge[] = [];
  for (const s of skills) {
    for (const up of s.upstream_required) {
      edges.push({
        id: `${up}->${s.id}`,
        source: up,
        target: s.id,
        animated: false,
        style: { stroke: '#3b4756', strokeWidth: 2 },
      });
    }
  }
  return edges;
}

export default function PipelinePage() {
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [states, setStates] = useState<Map<string, SkillState>>(new Map());
  const [selected, setSelected] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [sk, st] = await Promise.all([fetchSkills(), fetchWorkspaceState()]);
    setSkills(sk);
    setStates(new Map(st.map((x) => [x.id, x])));
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleNodeClick = useCallback((id: string) => setSelected(id), []);

  const nodes = useMemo(() => layoutNodes(skills, states, handleNodeClick), [skills, states, handleNodeClick]);
  const edges = useMemo(() => makeEdges(skills), [skills]);

  const selectedSkill = selected ? skills.find((s) => s.id === selected) ?? null : null;
  const selectedState = selected ? states.get(selected) : undefined;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{ position: 'fixed', top: 12, left: 16, zIndex: 10, color: '#cdd5dd', fontSize: 13 }}>
        EEC Pipeline · {skills.length} skills · click any node to run
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e2630" gap={24} />
        <Controls position="bottom-right" />
      </ReactFlow>

      <div className="legend">
        <div><span className="dot" style={{ background: '#3aae50' }} /> valid</div>
        <div><span className="dot" style={{ background: '#d8a93a' }} /> synthetic</div>
        <div><span className="dot" style={{ background: '#c93b3b' }} /> invalid</div>
        <div><span className="dot" style={{ background: '#3a4452' }} /> missing</div>
      </div>

      {selectedSkill && (
        <SkillDrawer
          skill={selectedSkill}
          state={selectedState}
          onClose={() => setSelected(null)}
          onAfterRun={() => {
            void reload();
          }}
        />
      )}
    </div>
  );
}

function SkillDrawer({
  skill,
  state,
  onClose,
  onAfterRun,
}: {
  skill: SkillSummary;
  state: SkillState | undefined;
  onClose: () => void;
  onAfterRun: () => void;
}) {
  const [brief, setBrief] = useState('');
  const [autoStub, setAutoStub] = useState(true);
  const [running, setRunning] = useState(false);
  const [pf, setPf] = useState<PreflightReport | null>(null);
  const [events, setEvents] = useState<Array<{ type: string; payload: unknown }>>([]);

  useEffect(() => {
    setEvents([]);
    setPf(null);
    void fetchPreflight(skill.id).then(setPf);
  }, [skill.id]);

  const onRun = async () => {
    setRunning(true);
    setEvents([]);
    try {
      await streamRun(
        skill.id,
        { brand_brief: brief || undefined, auto_stub_upstream: autoStub },
        (e: RunEvent) => {
          setEvents((prev) => [...prev, { type: e.type, payload: e.payload }]);
        },
      );
    } catch (e) {
      setEvents((prev) => [...prev, { type: 'error', payload: { message: (e as Error).message } }]);
    } finally {
      setRunning(false);
      onAfterRun();
    }
  };

  return (
    <div className="drawer">
      <button className="close" onClick={onClose}>×</button>
      <h2>#{skill.id} {skill.slug}</h2>
      <div className="meta">{skill.full_name} · {skill.tier} · {skill.module_count} modules</div>
      <div style={{ fontSize: 13, color: '#cdd5dd' }}>{skill.description}</div>

      <label>Upstream readiness</label>
      {pf ? (
        <div>
          {pf.upstreamRequired.length === 0 && <div className="upstream">no upstream</div>}
          {pf.upstreamRequired.map((u) => (
            <div key={u.id} className="upstream">
              <strong>{u.id}</strong> · {u.exists ? (u.valid ? '✓ valid' : '⚠ invalid') : '— missing'}
              {u.synthetic && <span style={{ color: '#d8a93a' }}> · synthetic</span>}
              {u.error && <div style={{ color: '#ff7676', marginTop: 2 }}>{u.error}</div>}
            </div>
          ))}
          {!pf.ready && (
            <div style={{ color: '#ffaa55', fontSize: 12, marginTop: 6 }}>
              {pf.blockers.join('; ')}
            </div>
          )}
        </div>
      ) : (
        <div className="upstream">loading…</div>
      )}

      <label>Brand brief (optional)</label>
      <textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="e.g. designer dog collars sized for every dog" />

      <div className="row">
        <input type="checkbox" id="autoStub" checked={autoStub} onChange={(e) => setAutoStub(e.target.checked)} />
        <label htmlFor="autoStub" style={{ margin: 0 }}>Auto-stub missing upstream</label>
      </div>

      <button disabled={running} onClick={onRun}>
        {running ? 'Running…' : `Run ${skill.full_name}`}
      </button>

      {state?.exists && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#8b95a1' }}>
          Current output: {state.exists ? '✓' : '—'}
          {state.synthetic && ' · synthetic'} · last run {state.mtime?.replace('T', ' ').slice(0, 16)}
        </div>
      )}

      {events.length > 0 && (
        <div className="events">
          {events.map((e, i) => (
            <div key={i} className={`e-${e.type}`}>
              <strong>[{e.type}]</strong> {summarize(e.type, e.payload)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function summarize(type: string, payload: unknown): string {
  const p = payload as Record<string, unknown>;
  switch (type) {
    case 'start':
      return `skill=${p.skillId} turnCap=${p.turnCap}`;
    case 'preflight':
      return p.ready ? 'ready' : `BLOCKED: ${(p.blockers as string[]).join('; ')}`;
    case 'stub':
      return `${p.skillId} ${(p as { ok: boolean }).ok ? '✓' : '✗'}${(p as { preExisted: boolean }).preExisted ? ' (preserved)' : ' (generated)'}`;
    case 'turn':
      return `t${p.index} finish=${p.finish ?? '—'} ${typeof p.text === 'string' ? p.text.slice(0, 80) : ''}`;
    case 'tool_call':
      return `${p.name}(${(p.arguments as string).slice(0, 80)}…)`;
    case 'tool_result':
      return `id=${(p.id as string).slice(0, 8)} ok=${p.ok}`;
    case 'validate':
      return p.ok ? '✓ schema OK' : `✗ ${(p.errors as Array<{ message: string }>).slice(0, 2).map((x) => x.message).join('; ')}`;
    case 'done':
    case 'result':
      return `ok=${p.ok} reason=${p.reason}`;
    case 'error':
      return String(p.message);
    default:
      return JSON.stringify(p).slice(0, 120);
  }
}
