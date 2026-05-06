import Link from 'next/link';
import type { Metadata } from 'next';
import ProductCard from '@/components/ProductCard';
import { SKUS } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search Roborock products, blog posts, and help articles.',
  robots: { index: false, follow: true }
};

const ALGOLIA_READY = Boolean(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID && process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
);

function rankSkus(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return SKUS
    .map((sku) => {
      const haystack = [sku.name, sku.shortName, sku.tagline, sku.description, ...sku.features].join(' ').toLowerCase();
      const score = haystack.includes(q) ? 1 : 0;
      return { sku, score };
    })
    .filter((m) => m.score > 0)
    .map((m) => m.sku);
}

type SearchParams = { q?: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const matches = rankSkus(q);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <nav className="text-xs text-brand-neutral-1 mb-6 flex gap-2">
        <Link href="/" className="hover:underline">Home</Link><span>/</span>
        <span>Search</span>
      </nav>
      <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Search</h1>
      <p className="text-sm text-brand-neutral-1 mb-8">
        {ALGOLIA_READY
          ? 'Powered by Algolia.'
          : 'Algolia keys not yet configured — showing a local fallback over product catalog only.'}
      </p>

      {q === '' ? (
        <p className="text-brand-neutral-1 text-sm italic">
          Type a query in the header search box.
        </p>
      ) : matches.length === 0 ? (
        <p className="text-brand-neutral-1">
          No products match <strong>{q}</strong>.{' '}
          <Link href="/collections/all" className="text-brand-accent hover:underline">Browse all robots →</Link>
        </p>
      ) : (
        <>
          <p className="text-sm text-brand-neutral-1 mb-6">
            {matches.length} result{matches.length === 1 ? '' : 's'} for <strong>{q}</strong>
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {matches.map((sku) => <ProductCard key={sku.id} sku={sku} />)}
          </div>
        </>
      )}
    </div>
  );
}
