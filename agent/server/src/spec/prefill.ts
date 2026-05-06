import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FieldEnvelope, NavItem, Route, Section, SiteSpec, Source } from './store.ts';
import { newEmptySpec } from './store.ts';

interface UpstreamOutputs {
  s02?: any;
  s03?: any;
  s04?: any;
}

function readJsonIfExists(path: string): any | undefined {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return undefined;
  }
}

function loadOutputs(workspaceRoot: string): UpstreamOutputs {
  const eec = join(workspaceRoot, 'eec');
  return {
    s02: readJsonIfExists(join(eec, '02-product-selection', 'output.json')),
    s03: readJsonIfExists(join(eec, '03-brand-identity', 'output.json')),
    s04: readJsonIfExists(join(eec, '04-creative-factory', 'output.json')),
  };
}

/**
 * Decide whether a field can be overwritten by prefill. We never touch
 * fields the user has locked, and never overwrite an existing user-sourced
 * value with an upstream value.
 */
function canFill<T>(env: FieldEnvelope<T> | undefined): boolean {
  if (!env) return true;
  if (env.locked) return false;
  if (env.source === 'user') return false;
  return env.value == null || (typeof env.value === 'string' && env.value === '');
}

function setField<T>(target: FieldEnvelope<T>, value: T | null, source: Source): void {
  if (!canFill(target)) return;
  target.value = value;
  target.source = source;
}

function paletteFromBrand(s03: any): string[] | null {
  const p = s03?.visual_system?.palette;
  if (!p) return null;
  const out: string[] = [];
  if (typeof p.primary === 'string') out.push(p.primary);
  if (typeof p.secondary === 'string') out.push(p.secondary);
  if (typeof p.accent === 'string') out.push(p.accent);
  if (Array.isArray(p.neutrals)) for (const n of p.neutrals) if (typeof n === 'string') out.push(n);
  return out.length > 0 ? out : null;
}

function logoBriefSummary(s03: any): string | null {
  const lb = s03?.visual_system?.logo_brief;
  if (!lb) return null;
  const parts: string[] = [];
  if (lb.mark_concept) parts.push(`mark: ${lb.mark_concept}`);
  if (lb.wordmark_treatment) parts.push(`wordmark: ${lb.wordmark_treatment}`);
  if (lb.motif) parts.push(`motif: ${lb.motif}`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function voiceToneSummary(s03: any): string | null {
  const t = s03?.tone;
  if (!t) return null;
  const desc = Array.isArray(t.voice_descriptors) ? t.voice_descriptors.join(', ') : '';
  const arch = t.persona_archetype ? ` (${t.persona_archetype})` : '';
  return desc ? `${desc}${arch}` : null;
}

function navHeaderFromSkus(s02: any): NavItem[] | null {
  const skus = s02?.skus;
  if (!Array.isArray(skus) || skus.length === 0) return null;
  const items: NavItem[] = [{ label: 'Shop', route: '/products' }];
  const cats = new Set<string>();
  for (const sku of skus) {
    if (typeof sku.category === 'string') cats.add(sku.category);
  }
  for (const c of Array.from(cats).slice(0, 3)) {
    items.push({ label: c, route: `/collections/${slugify(c)}` });
  }
  items.push({ label: 'About', route: '/about' });
  return items;
}

function navFooterDefault(): NavItem[] {
  return [
    { label: 'Privacy', route: '/privacy' },
    { label: 'Terms', route: '/terms' },
    { label: 'Contact', route: '/contact' },
  ];
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pickHeroAsset(s04: any, skuId?: string): string | null {
  const assets = s04?.assets;
  if (!Array.isArray(assets)) return null;
  const hero = assets.find(
    (a: any) => a?.purpose === 'hero' && (skuId ? a.sku_id === skuId : true),
  );
  return hero?.id ?? null;
}

function pickProductAsset(s04: any, skuId: string): string | null {
  const assets = s04?.assets;
  if (!Array.isArray(assets)) return null;
  const a = assets.find(
    (x: any) =>
      x?.sku_id === skuId && (x.purpose === 'product' || x.purpose === 'hero' || x.purpose === 'lifestyle'),
  );
  return a?.id ?? null;
}

function pickCopyBlock(s04: any, purpose: string, skuId?: string): string | null {
  const cbs = s04?.copy_blocks;
  if (!Array.isArray(cbs)) return null;
  const cb = cbs.find(
    (c: any) => c?.purpose === purpose && (skuId ? c.sku_id === skuId : true),
  );
  return cb?.id ?? null;
}

function pickFeatureCopyBlocks(s04: any, max = 3): string[] {
  const cbs = s04?.copy_blocks;
  if (!Array.isArray(cbs)) return [];
  return cbs
    .filter((c: any) => c?.purpose === 'feature_block')
    .slice(0, max)
    .map((c: any) => c.id as string);
}

function buildHomeRoute(out: UpstreamOutputs): Route {
  const heroAsset = pickHeroAsset(out.s04);
  const heroCopy = pickCopyBlock(out.s04, 'hero_banner');
  const featCopies = pickFeatureCopyBlocks(out.s04);
  const sections: Section[] = [
    {
      id: 'hero',
      variant: 'hero-split-image-right',
      asset_id: heroAsset,
      copy_block_id: heroCopy,
      cta: { label: 'Shop now', route: '/products' },
      source: heroAsset || heroCopy ? '04+03' : 'empty',
      required: true,
    },
    {
      id: 'features',
      variant: 'features-three-column',
      copy_block_ids: featCopies,
      source: featCopies.length > 0 ? '04' : 'empty',
    },
    {
      id: 'social-proof',
      variant: 'social-proof-logo-strip',
      asset_ids: [],
      source: 'empty',
    },
    {
      id: 'cta',
      variant: 'cta-banner',
      copy_block_id: null,
      cta: { label: 'Shop the collection', route: '/products' },
      source: 'empty',
    },
    { id: 'footer', variant: 'footer-standard', source: 'empty' },
  ];
  const collectAssets = sections
    .flatMap((s) => [s.asset_id, ...(s.asset_ids ?? [])])
    .filter((x): x is string => Boolean(x));
  const collectCopies = sections
    .flatMap((s) => [s.copy_block_id, ...(s.copy_block_ids ?? [])])
    .filter((x): x is string => Boolean(x));
  return {
    path: '/',
    title: 'Home',
    seo_intent: 'Brand discovery + flagship product convert',
    sections,
    sku_ids: [],
    asset_ids: collectAssets,
    copy_block_ids: collectCopies,
    source: '04+03',
  };
}

function buildProductsRoute(out: UpstreamOutputs): Route {
  const skus = (out.s02?.skus ?? []) as any[];
  return {
    path: '/products',
    title: 'All products',
    seo_intent: 'Category landing — all SKUs grid',
    sections: [
      { id: 'header', variant: 'rich-text', headline: 'All products', source: 'derived' },
      {
        id: 'grid',
        variant: 'product-grid',
        sku_ids: skus.map((s) => s.id as string),
        source: skus.length > 0 ? '02' : 'empty',
        required: true,
      },
      { id: 'footer', variant: 'footer-standard', source: 'empty' },
    ],
    sku_ids: skus.map((s) => s.id as string),
    source: '02',
  };
}

function buildPdpRoute(out: UpstreamOutputs): Route {
  return {
    path: '/products/[slug]',
    title: 'Product detail',
    sku_template: true,
    seo_intent: 'PDP — convert',
    sections: [
      {
        id: 'pdp-hero',
        variant: 'product-detail-classic',
        asset_id: null,
        copy_block_id: null,
        source: 'empty',
        required: true,
      },
      {
        id: 'features',
        variant: 'features-grid',
        source: 'empty',
      },
      { id: 'faq', variant: 'faq-accordion', source: 'empty' },
      { id: 'footer', variant: 'footer-standard', source: 'empty' },
    ],
    source: '02',
  };
}

function buildAboutRoute(out: UpstreamOutputs): Route {
  const mission = out.s03?.mission ?? null;
  return {
    path: '/about',
    title: 'About',
    seo_intent: 'Brand storytelling',
    sections: [
      {
        id: 'mission',
        variant: 'rich-text',
        headline: 'Our mission',
        body: mission,
        source: mission ? '03' : 'empty',
      },
      { id: 'footer', variant: 'footer-standard', source: 'empty' },
    ],
    source: mission ? '03' : 'empty',
  };
}

/**
 * Pre-fill a fresh spec or merge into an existing one. Idempotent: locked
 * or user-edited fields are preserved; route list is only filled in when
 * empty (we don't auto-add routes the user has chosen to remove).
 */
export function prefillSpec(workspaceRoot: string, existing: SiteSpec): SiteSpec {
  const out = loadOutputs(workspaceRoot);
  const next: SiteSpec = JSON.parse(JSON.stringify(existing));

  // Global
  if (out.s03) {
    setField(next.global.brand_name, out.s03.brand_name ?? null, '03');
    setField(next.global.tagline, out.s03.tagline ?? null, '03');
    setField(next.global.mission, out.s03.mission ?? null, '03');
    setField(next.global.primary_palette, paletteFromBrand(out.s03), '03');
    setField(next.global.logo_brief, logoBriefSummary(out.s03), '03');
    setField(next.global.voice_tone, voiceToneSummary(out.s03), '03');
  }
  // tech_stack default — only if empty
  if (canFill(next.global.tech_stack)) {
    next.global.tech_stack.value = 'Next.js 15 + Tailwind';
    next.global.tech_stack.source = 'derived';
  }

  // Navigation
  if (canFill(next.navigation.header)) {
    const hdr = navHeaderFromSkus(out.s02);
    if (hdr) {
      next.navigation.header.value = hdr;
      next.navigation.header.source = '02';
    }
  }
  if (canFill(next.navigation.footer)) {
    next.navigation.footer.value = navFooterDefault();
    next.navigation.footer.source = 'derived';
  }

  // Routes — only auto-populate when the user has none yet
  if (next.routes.length === 0) {
    next.routes = [
      buildHomeRoute(out),
      buildProductsRoute(out),
      buildPdpRoute(out),
      buildAboutRoute(out),
    ];
  }

  return next;
}

/**
 * Convenience: load (or seed) + prefill in one call. Used at server boot
 * and any time the user clicks "refresh from sources".
 */
export function freshPrefill(workspaceRoot: string, brandId: string): SiteSpec {
  return prefillSpec(workspaceRoot, newEmptySpec(brandId));
}
