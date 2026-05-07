import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WorkspaceFs } from './fs.ts';

describe('WorkspaceFs', () => {
  const ws = mkdtempSync(join(tmpdir(), 'ws-'));
  mkdirSync(join(ws, 'sub'), { recursive: true });
  writeFileSync(join(ws, 'hello.txt'), 'world');
  writeFileSync(join(ws, 'sub/nested.txt'), 'nested');
  const fs = new WorkspaceFs(ws);

  describe('readFile', () => {
    it('reads a relative path inside the workspace', () => {
      const r = fs.readFile('hello.txt');
      expect(r.ok).toBe(true);
      expect(r.content).toBe('world');
    });

    it('reads a nested relative path', () => {
      const r = fs.readFile('sub/nested.txt');
      expect(r.ok).toBe(true);
      expect(r.content).toBe('nested');
    });

    it('returns not-found error for a missing file', () => {
      const r = fs.readFile('nope.txt');
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/not found/);
    });

    it('rejects parent traversal', () => {
      const r = fs.readFile('../escape.txt');
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/escapes/);
    });

    it('rejects absolute path outside workspace', () => {
      const outside = mkdtempSync(join(tmpdir(), 'outside-'));
      writeFileSync(join(outside, 'leak.txt'), 'secret');
      const r = fs.readFile(join(outside, 'leak.txt'));
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/escapes/);
    });

    it('accepts an absolute path inside workspace', () => {
      const r = fs.readFile(join(ws, 'hello.txt'));
      expect(r.ok).toBe(true);
      expect(r.content).toBe('world');
    });
  });

  describe('writeFile', () => {
    it('writes a new file inside the workspace', () => {
      const r = fs.writeFile('out/created.txt', 'hi');
      expect(r.ok).toBe(true);
      expect(r.bytes).toBe(2);
      expect(fs.readFile('out/created.txt').content).toBe('hi');
    });

    it('rejects oversized content (> 2 MB)', () => {
      const big = 'x'.repeat(2 * 1024 * 1024 + 1);
      const r = fs.writeFile('big.txt', big);
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/too large/);
    });

    it('rejects parent traversal on write', () => {
      const r = fs.writeFile('../leak.txt', 'evil');
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/escapes/);
    });
  });

  describe('exists', () => {
    it('returns true for existing files', () => {
      expect(fs.exists('hello.txt')).toBe(true);
    });

    it('returns false for missing files', () => {
      expect(fs.exists('nope.txt')).toBe(false);
    });

    it('returns false (not throw) for traversal attempts', () => {
      expect(fs.exists('../escape.txt')).toBe(false);
    });
  });

  describe('listDir', () => {
    it('lists workspace root', () => {
      const r = fs.listDir('.');
      expect(r.ok).toBe(true);
      const names = (r.entries ?? []).map((e) => e.name).sort();
      expect(names).toContain('hello.txt');
      expect(names).toContain('sub');
    });

    it('returns empty entries for a missing path', () => {
      const r = fs.listDir('does-not-exist');
      expect(r.ok).toBe(true);
      expect(r.entries).toEqual([]);
    });

    it('rejects traversal', () => {
      const r = fs.listDir('../');
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/escapes/);
    });
  });
});
