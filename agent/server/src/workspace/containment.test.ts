import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { ensureInsideRepo } from './containment.ts';

describe('ensureInsideRepo', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'containment-'));

  it('accepts a path inside the repo', () => {
    const child = join(repoRoot, 'workspace');
    mkdirSync(child, { recursive: true });
    expect(ensureInsideRepo(child, repoRoot)).toBe(resolve(child));
  });

  it('accepts a deeply nested path', () => {
    const deep = join(repoRoot, 'a', 'b', 'c');
    expect(ensureInsideRepo(deep, repoRoot)).toBe(resolve(deep));
  });

  it('rejects the repo root itself', () => {
    expect(() => ensureInsideRepo(repoRoot, repoRoot)).toThrow(/must be inside/);
  });

  it('rejects parent traversal', () => {
    expect(() => ensureInsideRepo(join(repoRoot, '..'), repoRoot)).toThrow(/must be inside/);
  });

  it('rejects an absolute path outside the repo', () => {
    const outside = mkdtempSync(join(tmpdir(), 'outside-'));
    expect(() => ensureInsideRepo(outside, repoRoot)).toThrow(/must be inside/);
  });

  it('normalizes a relative path against cwd before checking', () => {
    expect(() => ensureInsideRepo('not-inside-anything', repoRoot)).toThrow(/must be inside/);
  });
});
