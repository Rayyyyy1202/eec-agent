import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Repo } from './repo.ts';

/**
 * If the brands table is empty AND a workspace path is supplied + populated,
 * seed a default brand. Returns the resulting brand id (or null when nothing
 * to seed).
 */
export function seedDefaultBrand(repo: Repo, workspacePath?: string, name = 'Petropolitian'): string | null {
  const existing = repo.listBrands();
  if (existing.length > 0) return existing[0]!.id;

  if (!workspacePath) return null;
  const abs = resolve(workspacePath);
  if (!existsSync(abs)) return null;

  const brand = repo.createBrand(name, abs, undefined);
  return brand.id;
}
