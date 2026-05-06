'use client';

import { useEffect, useState } from 'react';
import {
  type SkillState,
  type TaskRow,
  fetchTasks,
  fetchWorkspaceState,
} from '../lib/agent';

interface InspectorProps {
  conversationId?: string;
  brandId?: string | null;
  /** ticks higher whenever the chat stream emits a relevant event */
  refreshSignal?: number;
  /** flat tool-call/result log from the live stream */
  toolLog?: ToolLogEntry[];
}

export interface ToolLogEntry {
  id: string;
  name: string;
  args: string;
  result?: { ok: boolean; summary: string };
  startedAt: string;
}

type Tab = 'tasks' | 'tools' | 'pipeline';

export default function Inspector({ conversationId, brandId, refreshSignal, toolLog = [] }: InspectorProps) {
  const [tab, setTab] = useState<Tab>('tasks');
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [states, setStates] = useState<SkillState[]>([]);

  useEffect(() => {
    if (!conversationId) {
      setTasks([]);
      return;
    }
    fetchTasks(conversationId).then(setTasks).catch(() => setTasks([]));
  }, [conversationId, refreshSignal]);

  useEffect(() => {
    if (!brandId) {
      setStates([]);
      return;
    }
    fetchWorkspaceState(brandId).then(setStates).catch(() => setStates([]));
  }, [brandId, refreshSignal]);

  return (
    <aside className="inspector">
      <div className="inspector-tabs">
        <button className={`inspector-tab ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>
          Tasks
        </button>
        <button className={`inspector-tab ${tab === 'tools' ? 'active' : ''}`} onClick={() => setTab('tools')}>
          Tool log
        </button>
        <button className={`inspector-tab ${tab === 'pipeline' ? 'active' : ''}`} onClick={() => setTab('pipeline')}>
          Pipeline
        </button>
      </div>
      <div className="inspector-body">
        {tab === 'tasks' && <TaskTree tasks={tasks} />}
        {tab === 'tools' && <ToolLog entries={toolLog} />}
        {tab === 'pipeline' && <PipelineMini states={states} />}
      </div>
    </aside>
  );
}

function TaskTree({ tasks }: { tasks: TaskRow[] }) {
  if (tasks.length === 0) {
    return <div style={{ color: 'var(--fg-muted)', fontSize: 13 }}>No tasks yet.</div>;
  }
  const roots = tasks.filter((t) => !t.parent_id);
  return (
    <div>
      {roots.map((t) => (
        <TaskItem key={t.id} task={t} all={tasks} />
      ))}
    </div>
  );
}

function TaskItem({ task, all }: { task: TaskRow; all: TaskRow[] }) {
  const children = all.filter((t) => t.parent_id === task.id);
  const mark =
    task.status === 'completed' ? '✓' : task.status === 'in_progress' ? '◐' : task.status === 'cancelled' ? '×' : '○';
  return (
    <div className={`task-node s-${task.status}`}>
      <div className="title">
        <span className="check">{mark}</span>
        {task.title}
      </div>
      {task.notes && <div className="meta">{task.notes}</div>}
      <div className="meta">{task.status}</div>
      {children.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {children.map((c) => (
            <TaskItem key={c.id} task={c} all={all} />
          ))}
        </div>
      )}
    </div>
  );
}

function ToolLog({ entries }: { entries: ToolLogEntry[] }) {
  if (entries.length === 0) {
    return <div style={{ color: 'var(--fg-muted)', fontSize: 13 }}>No tool calls yet.</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.map((e) => (
        <div key={e.id} className="tool-card">
          <div className="tool-card-head">
            <span className="tag">{e.result ? (e.result.ok ? 'ok' : 'err') : 'run'}</span>
            <span>{e.name}</span>
          </div>
          {e.args && e.args !== '{}' && (
            <div className="tool-card-body muted">{prettifyJSON(e.args)}</div>
          )}
          {e.result && <div className="tool-card-body">{e.result.summary}</div>}
        </div>
      ))}
    </div>
  );
}

function prettifyJSON(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}

function PipelineMini({ states }: { states: SkillState[] }) {
  if (states.length === 0) {
    return <div style={{ color: 'var(--fg-muted)', fontSize: 13 }}>Select a brand to see pipeline state.</div>;
  }
  return (
    <div>
      {states.map((s) => {
        const dot = s.error
          ? 'err'
          : s.synthetic && s.exists
            ? 'warn'
            : s.exists && s.valid
              ? 'ok'
              : 'gray';
        return (
          <span key={s.id} className="skill-pill" title={s.full_name}>
            <span className={`dot ${dot}`} />
            {s.id}
          </span>
        );
      })}
    </div>
  );
}
