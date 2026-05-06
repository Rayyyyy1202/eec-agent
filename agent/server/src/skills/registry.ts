import type { SkillRecord } from './loader.ts';
import { loadSkillsFromRepo } from './loader.ts';

/**
 * Upstream dependency graph — extracted verbatim from
 * shared/data-contracts.md §2 (per-skill input/output contract).
 *
 * Side skills (03b/04b/05b/11b/13) are not in §2; their dependencies
 * are derived from their own SKILL.md "forced reads" sections.
 */
const UPSTREAM_REQUIRED: Record<string, string[]> = {
  '01': [],
  '02': ['01'],
  '03': ['01', '02'],
  '04': ['02', '03'],
  '05': ['02', '03', '04'],
  '06': ['05'],
  '07a': ['05', '06'],
  '07b': ['01', '02', '03'],
  '08': ['02', '03', '04', '06'],
  '09': ['06', '08'],
  // side
  '03b': ['03'],
  '04b': ['04'],
  '05b': ['05'],
  '11b': ['03'],
  '13': ['06'],
};

const UPSTREAM_OPTIONAL: Record<string, string[]> = {
  '04': ['01'],
  '06': ['02', '08'],
  '07b': ['07a'],
  '08': ['01', '05'],
  '09': ['01', '02', '03', '04', '05'],
};

export interface SkillNode extends SkillRecord {
  upstreamRequired: string[];
  upstreamOptional: string[];
}

export class SkillRegistry {
  private byId = new Map<string, SkillNode>();

  constructor(private repoRoot: string) {
    const records = loadSkillsFromRepo(repoRoot);
    for (const r of records) {
      this.byId.set(r.id, {
        ...r,
        upstreamRequired: UPSTREAM_REQUIRED[r.id] ?? [],
        upstreamOptional: UPSTREAM_OPTIONAL[r.id] ?? [],
      });
    }
  }

  list(): SkillNode[] {
    return [...this.byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  get(id: string): SkillNode | undefined {
    return this.byId.get(id);
  }

  get root(): string {
    return this.repoRoot;
  }
}
