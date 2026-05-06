// Loads 07b drafts at build time. Inline post metadata stays here for type safety;
// markdown bodies live at eec/07b-content-marketing/drafts/<contentId>.md and are
// resolved relative to the repo root via path.resolve(process.cwd(), ...).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type Post = {
  id: string;
  contentId: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  internalLinks: string[];
  ctaSkuId?: string;
  estimatedReadingTimeMin: number;
  bodyMdPath: string;
};

export const POSTS: Post[] = [
  {
    id: 'draft_001',
    contentId: 'content_001',
    slug: 'best-robot-vacuum-pet-hair-2026',
    title:
      'Best Robot Vacuums for Pet Hair (2026): Tested on 12 Weeks of Golden Retriever Shedding',
    excerpt:
      'Twelve weeks. One golden retriever. Three robots. We measured the brush untanglings, the surface area cleaned, and the sanity preserved. Here’s what won.',
    publishedAt: '2026-04-29',
    targetKeyword: 'best robot vacuum for pet hair',
    secondaryKeywords: [
      'anti tangle brush robot vacuum',
      'robot vacuum for golden retriever shedding',
      'best robot vacuum for long-haired cats'
    ],
    internalLinks: [
      '/products/roborock-s-series-pro',
      '/products/roborock-e-series-essential',
      '/collections/pet-households',
      '/products/roborock-replenish-6mo'
    ],
    ctaSkuId: 'sku_001',
    estimatedReadingTimeMin: 9,
    bodyMdPath: '../../07b-content-marketing/drafts/content_001.md'
  },
  {
    id: 'draft_002',
    contentId: 'content_002',
    slug: 'lidar-robot-vacuum-under-500',
    title: 'Lidar Robot Vacuums Under $500: What Actually Works',
    excerpt:
      'Real lidar — not gyro, not optical — used to mean spending $800+. In 2026 it’s a sub-$500 floor. Here are the three robots that clear the bar (and the one that doesn’t).',
    publishedAt: '2026-05-02',
    targetKeyword: 'lidar robot vacuum under 500',
    secondaryKeywords: [
      'cheapest lidar robot vacuum',
      'lidar vs camera robot vacuum',
      'best budget robot vacuum with mapping'
    ],
    internalLinks: ['/products/roborock-e-series-essential', '/collections/all'],
    ctaSkuId: 'sku_002',
    estimatedReadingTimeMin: 7,
    bodyMdPath: '../../07b-content-marketing/drafts/content_002.md'
  },
  {
    id: 'draft_003',
    contentId: 'content_003',
    slug: 'robot-vacuum-keeps-getting-stuck',
    title: 'Why Your Robot Vacuum Keeps Getting Stuck (and How to Fix It in 5 Minutes)',
    excerpt:
      'Seven things cause 90% of stuck-ups: cable spaghetti, dark rugs, threshold strips, bath mats, low-clearance chairs, stale maps, and brush tangles. Five-minute fix list.',
    publishedAt: '2026-05-06',
    targetKeyword: 'robot vacuum keeps getting stuck',
    secondaryKeywords: [
      'robot vacuum stuck under furniture fix',
      'why does my robot vacuum keep stopping'
    ],
    internalLinks: ['/help', '/products/roborock-replenish-6mo'],
    ctaSkuId: 'sku_003',
    estimatedReadingTimeMin: 5,
    bodyMdPath: '../../07b-content-marketing/drafts/content_003.md'
  },
  {
    id: 'draft_004',
    contentId: 'content_004',
    slug: 'how-often-replace-robot-vacuum-filter',
    title: 'How Often Should You Replace Your Robot Vacuum Filter? (Honest Answer)',
    excerpt:
      'Short answer: 60–90 days. With pets: 30–45. Here are the three signs you waited too long, and what’s on the same schedule (and what isn’t).',
    publishedAt: '2026-05-09',
    targetKeyword: 'how often replace robot vacuum filter',
    secondaryKeywords: [
      'robot vacuum filter replacement schedule',
      'roborock replacement parts'
    ],
    internalLinks: ['/products/roborock-replenish-6mo', '/help'],
    ctaSkuId: 'sku_003',
    estimatedReadingTimeMin: 4,
    bodyMdPath: '../../07b-content-marketing/drafts/content_004.md'
  }
];

export function getPostBySlug(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function loadPostMarkdown(post: Post): string {
  // Resolve from the Next.js cwd (the repo root: eec/05-site-build/repo).
  const absolute = resolve(process.cwd(), post.bodyMdPath);
  return readFileSync(absolute, 'utf-8');
}

export function getAllPostsSorted(): Post[] {
  return [...POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
