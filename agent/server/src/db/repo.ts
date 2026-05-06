import { randomUUID } from 'node:crypto';
import type { DB } from './schema.ts';

export interface Brand {
  id: string;
  name: string;
  workspace: string;
  brand_brief: string | null;
  brand_profile: string | null;
  brand_profile_updated_at: string | null;
  created_at: string;
  archived_at: string | null;
}

export interface Conversation {
  id: string;
  brand_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  tool_call_id: string | null;
  tool_calls_json: string | null;
  attachments_json: string | null;
  created_at: string;
}

export interface Attachment {
  id: string;
  conversation_id: string;
  message_id: string | null;
  kind: 'image' | 'file';
  mime: string;
  filename: string | null;
  data_base64: string;
  bytes: number;
  created_at: string;
}

export interface TaskRow {
  id: string;
  conversation_id: string;
  parent_id: string | null;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface MemoryRow {
  id: string;
  brand_id: string;
  key: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type ApprovalDecision = 'approved' | 'modified_rerun' | 'rejected';

export interface ApprovalRow {
  id: string;
  brand_id: string;
  skill_id: string;
  conversation_id: string | null;
  decision: ApprovalDecision;
  output_snapshot: string | null;
  note: string | null;
  created_at: string;
}

export class Repo {
  constructor(private db: DB) {}

  // ─── brands ──────────────────────────────────────────────────────────────

  createBrand(name: string, workspace: string, brand_brief?: string): Brand {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO brands (id, name, workspace, brand_brief) VALUES (?, ?, ?, ?)`,
      )
      .run(id, name, workspace, brand_brief ?? null);
    return this.getBrand(id)!;
  }

  getBrand(id: string): Brand | null {
    return (this.db.prepare(`SELECT * FROM brands WHERE id = ?`).get(id) as Brand) ?? null;
  }

  listBrands(): Brand[] {
    return this.db
      .prepare(`SELECT * FROM brands WHERE archived_at IS NULL ORDER BY created_at DESC`)
      .all() as Brand[];
  }

  updateBrand(id: string, fields: Partial<Pick<Brand, 'name' | 'workspace' | 'brand_brief'>>): Brand | null {
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(fields)) {
      sets.push(`${k} = ?`);
      values.push(v);
    }
    if (sets.length === 0) return this.getBrand(id);
    values.push(id);
    this.db.prepare(`UPDATE brands SET ${sets.join(', ')} WHERE id = ?`).run(...(values as never[]));
    return this.getBrand(id);
  }

  archiveBrand(id: string): void {
    this.db
      .prepare(`UPDATE brands SET archived_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`)
      .run(id);
  }

  // ─── conversations ───────────────────────────────────────────────────────

  createConversation(brand_id: string, title?: string): Conversation {
    const id = randomUUID();
    this.db
      .prepare(`INSERT INTO conversations (id, brand_id, title) VALUES (?, ?, ?)`)
      .run(id, brand_id, title ?? 'New conversation');
    return this.getConversation(id)!;
  }

  getConversation(id: string): Conversation | null {
    return (this.db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(id) as Conversation) ?? null;
  }

  listConversations(brand_id: string): Conversation[] {
    return this.db
      .prepare(
        `SELECT * FROM conversations WHERE brand_id = ? AND archived_at IS NULL ORDER BY updated_at DESC`,
      )
      .all(brand_id) as Conversation[];
  }

  renameConversation(id: string, title: string): void {
    this.db
      .prepare(
        `UPDATE conversations SET title = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
      )
      .run(title, id);
  }

  touchConversation(id: string): void {
    this.db
      .prepare(`UPDATE conversations SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`)
      .run(id);
  }

  archiveConversation(id: string): void {
    this.db
      .prepare(`UPDATE conversations SET archived_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`)
      .run(id);
  }

  // ─── messages ────────────────────────────────────────────────────────────

  appendMessage(m: {
    conversation_id: string;
    role: Message['role'];
    content?: string;
    tool_call_id?: string;
    tool_calls?: unknown;
    attachments?: string[];
  }): Message {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO messages (id, conversation_id, role, content, tool_call_id, tool_calls_json, attachments_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        m.conversation_id,
        m.role,
        m.content ?? '',
        m.tool_call_id ?? null,
        m.tool_calls ? JSON.stringify(m.tool_calls) : null,
        m.attachments && m.attachments.length ? JSON.stringify(m.attachments) : null,
      );
    this.touchConversation(m.conversation_id);
    return this.getMessage(id)!;
  }

  getMessage(id: string): Message | null {
    return (this.db.prepare(`SELECT * FROM messages WHERE id = ?`).get(id) as Message) ?? null;
  }

  listMessages(conversation_id: string, limit = 200): Message[] {
    return this.db
      .prepare(
        `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, rowid ASC LIMIT ?`,
      )
      .all(conversation_id, limit) as Message[];
  }

  // ─── attachments ─────────────────────────────────────────────────────────

  saveAttachment(a: Omit<Attachment, 'id' | 'created_at'>): Attachment {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO attachments (id, conversation_id, message_id, kind, mime, filename, data_base64, bytes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        a.conversation_id,
        a.message_id ?? null,
        a.kind,
        a.mime,
        a.filename ?? null,
        a.data_base64,
        a.bytes,
      );
    return this.getAttachment(id)!;
  }

  getAttachment(id: string): Attachment | null {
    return (this.db.prepare(`SELECT * FROM attachments WHERE id = ?`).get(id) as Attachment) ?? null;
  }

  listAttachmentsForConversation(conversation_id: string): Attachment[] {
    return this.db
      .prepare(`SELECT * FROM attachments WHERE conversation_id = ? ORDER BY created_at`)
      .all(conversation_id) as Attachment[];
  }

  // ─── tasks ───────────────────────────────────────────────────────────────

  createTask(t: { conversation_id: string; title: string; parent_id?: string; notes?: string }): TaskRow {
    const id = randomUUID();
    const position = (this.db
      .prepare(
        `SELECT COALESCE(MAX(position), 0) + 1 AS p FROM tasks WHERE conversation_id = ? AND (parent_id IS ? OR parent_id = ?)`,
      )
      .get(t.conversation_id, t.parent_id ?? null, t.parent_id ?? null) as { p: number }).p;
    this.db
      .prepare(
        `INSERT INTO tasks (id, conversation_id, parent_id, title, notes, position) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(id, t.conversation_id, t.parent_id ?? null, t.title, t.notes ?? null, position);
    return this.getTask(id)!;
  }

  getTask(id: string): TaskRow | null {
    return (this.db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as TaskRow) ?? null;
  }

  updateTask(id: string, fields: Partial<Pick<TaskRow, 'title' | 'status' | 'notes'>>): TaskRow | null {
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(fields)) {
      sets.push(`${k} = ?`);
      values.push(v);
    }
    if (sets.length === 0) return this.getTask(id);
    sets.push(`updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`);
    values.push(id);
    this.db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...(values as never[]));
    return this.getTask(id);
  }

  listTasks(conversation_id: string): TaskRow[] {
    return this.db
      .prepare(
        `SELECT * FROM tasks WHERE conversation_id = ? ORDER BY parent_id NULLS FIRST, position`,
      )
      .all(conversation_id) as TaskRow[];
  }

  deleteTask(id: string): void {
    this.db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id);
  }

  // ─── memories ────────────────────────────────────────────────────────────

  saveMemory(brand_id: string, key: string, content: string): MemoryRow {
    this.db
      .prepare(
        `INSERT INTO memories (id, brand_id, key, content) VALUES (?, ?, ?, ?)
         ON CONFLICT(brand_id, key) DO UPDATE SET content = excluded.content,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
      )
      .run(randomUUID(), brand_id, key, content);
    return this.db
      .prepare(`SELECT * FROM memories WHERE brand_id = ? AND key = ?`)
      .get(brand_id, key) as MemoryRow;
  }

  listMemories(brand_id: string): MemoryRow[] {
    return this.db
      .prepare(`SELECT * FROM memories WHERE brand_id = ? ORDER BY updated_at DESC`)
      .all(brand_id) as MemoryRow[];
  }

  searchMemories(brand_id: string, query: string, limit = 10): MemoryRow[] {
    const q = `%${query.replace(/[%_]/g, '\\$&')}%`;
    return this.db
      .prepare(
        `SELECT * FROM memories
         WHERE brand_id = ? AND (key LIKE ? ESCAPE '\\' OR content LIKE ? ESCAPE '\\')
         ORDER BY updated_at DESC LIMIT ?`,
      )
      .all(brand_id, q, q, limit) as MemoryRow[];
  }

  deleteMemory(id: string): void {
    this.db.prepare(`DELETE FROM memories WHERE id = ?`).run(id);
  }

  // ─── brand profile (L3 distilled long-term knowledge) ────────────────────

  getBrandProfile(brand_id: string): { profile: string; updated_at: string } | null {
    const row = this.db
      .prepare(
        `SELECT brand_profile, brand_profile_updated_at FROM brands WHERE id = ?`,
      )
      .get(brand_id) as
      | { brand_profile: string | null; brand_profile_updated_at: string | null }
      | undefined;
    if (!row || !row.brand_profile || !row.brand_profile_updated_at) return null;
    return { profile: row.brand_profile, updated_at: row.brand_profile_updated_at };
  }

  setBrandProfile(brand_id: string, profile: string): void {
    this.db
      .prepare(
        `UPDATE brands
         SET brand_profile = ?,
             brand_profile_updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
         WHERE id = ?`,
      )
      .run(profile, brand_id);
  }

  // ─── approvals ───────────────────────────────────────────────────────────

  appendApproval(input: {
    brand_id: string;
    skill_id: string;
    conversation_id?: string | null;
    decision: ApprovalDecision;
    output_snapshot?: string | null;
    note?: string | null;
  }): ApprovalRow {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO approvals (id, brand_id, skill_id, conversation_id, decision, output_snapshot, note)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.brand_id,
        input.skill_id,
        input.conversation_id ?? null,
        input.decision,
        input.output_snapshot ?? null,
        input.note ?? null,
      );
    return this.db.prepare(`SELECT * FROM approvals WHERE id = ?`).get(id) as ApprovalRow;
  }

  listApprovals(brand_id: string, skill_id?: string): ApprovalRow[] {
    if (skill_id) {
      return this.db
        .prepare(
          `SELECT * FROM approvals WHERE brand_id = ? AND skill_id = ? ORDER BY created_at DESC`,
        )
        .all(brand_id, skill_id) as ApprovalRow[];
    }
    return this.db
      .prepare(`SELECT * FROM approvals WHERE brand_id = ? ORDER BY created_at DESC`)
      .all(brand_id) as ApprovalRow[];
  }

  latestApproval(brand_id: string, skill_id: string): ApprovalRow | null {
    return (
      (this.db
        .prepare(
          `SELECT * FROM approvals WHERE brand_id = ? AND skill_id = ? ORDER BY created_at DESC LIMIT 1`,
        )
        .get(brand_id, skill_id) as ApprovalRow | undefined) ?? null
    );
  }
}
