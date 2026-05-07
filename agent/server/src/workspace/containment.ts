import { resolve, relative, isAbsolute } from 'node:path';

/**
 * Resolve `path` against the filesystem and assert that it lies inside `repoRoot`.
 *
 * Throws on any path that:
 *   - resolves to `repoRoot` itself (no useful brand workspace can live there)
 *   - escapes via `..`
 *   - escapes by being absolute and outside the tree
 */
export function ensureInsideRepo(path: string, repoRoot: string): string {
  const abs = resolve(path);
  const root = resolve(repoRoot);
  const rel = relative(root, abs);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`path must be inside REPO_ROOT (${root}); got ${abs}`);
  }
  return abs;
}
