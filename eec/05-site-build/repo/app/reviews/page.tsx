import Link from 'next/link';
import type { Metadata } from 'next';
import Stars from '@/components/Stars';
import { SKUS } from '@/lib/products';
import {
  REVIEWS,
  AGGREGATE_RATINGS,
  AGGREGATE_RATING_MIN,
  type Review
} from '@/lib/social-proof';

export const metadata: Metadata = {
  title: 'Customer Reviews',
  description: 'All verified customer reviews across the Roborock catalog. Filter by product or star rating.'
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const skuName = (id: string): string => SKUS.find((s) => s.id === id)?.shortName ?? id;
const skuRoute = (id: string): string => SKUS.find((s) => s.id === id)?.routePath ?? '#';

function filterReviews(reviews: Review[], skuFilter: string | undefined, ratingFilter: number | undefined): Review[] {
  return reviews
    .filter((r) => (skuFilter ? r.skuId === skuFilter : true))
    .filter((r) => (ratingFilter ? r.rating === ratingFilter : true))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

type SearchParams = { sku?: string; rating?: string };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const skuFilter = sp.sku && SKUS.some((s) => s.id === sp.sku) ? sp.sku : undefined;
  const ratingFilterRaw = sp.rating ? parseInt(sp.rating, 10) : NaN;
  const ratingFilter = Number.isInteger(ratingFilterRaw) && ratingFilterRaw >= 1 && ratingFilterRaw <= 5
    ? ratingFilterRaw
    : undefined;

  const filtered = filterReviews(REVIEWS, skuFilter, ratingFilter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <nav className="text-xs text-brand-neutral-1 mb-6 flex gap-2">
        <Link href="/" className="hover:underline">Home</Link><span>/</span>
        <span>Reviews</span>
      </nav>

      <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">Customer reviews</h1>
      <p className="text-brand-neutral-1 mb-8 leading-relaxed">
        {REVIEWS.length} reviews across {AGGREGATE_RATINGS.length} products.
        AggregateRating star summary requires {AGGREGATE_RATING_MIN}+ reviews per Google policy — products with fewer show
        the raw count instead.
      </p>

      <div className="border border-brand-neutral-3 rounded-lg p-4 mb-8 bg-brand-secondary/40">
        <p className="text-xs uppercase tracking-widest text-brand-neutral-1 font-semibold mb-3">Filter</p>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/reviews"
            className={`px-3 py-1 rounded-full border ${!skuFilter ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-neutral-3 hover:bg-white'}`}
          >
            All products
          </Link>
          {SKUS.map((s) => {
            const params = new URLSearchParams();
            params.set('sku', s.id);
            if (ratingFilter) params.set('rating', String(ratingFilter));
            return (
              <Link
                key={s.id}
                href={`/reviews?${params.toString()}`}
                className={`px-3 py-1 rounded-full border ${skuFilter === s.id ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-neutral-3 hover:bg-white'}`}
              >
                {s.shortName}
              </Link>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 text-sm mt-3">
          <Link
            href={skuFilter ? `/reviews?sku=${skuFilter}` : '/reviews'}
            className={`px-3 py-1 rounded-full border ${!ratingFilter ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-neutral-3 hover:bg-white'}`}
          >
            All stars
          </Link>
          {[5, 4, 3, 2, 1].map((star) => {
            const params = new URLSearchParams();
            if (skuFilter) params.set('sku', skuFilter);
            params.set('rating', String(star));
            return (
              <Link
                key={star}
                href={`/reviews?${params.toString()}`}
                className={`px-3 py-1 rounded-full border ${ratingFilter === star ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-neutral-3 hover:bg-white'}`}
              >
                {star} star
              </Link>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-brand-neutral-1 text-sm italic">No reviews match these filters.</p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((r) => (
            <li
              key={r.id}
              className="border border-brand-neutral-3 rounded-lg p-5 bg-white"
            >
              <header className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-baseline gap-3">
                  <Stars rating={r.rating} size="sm" />
                  <span className="font-semibold text-sm">{r.title}</span>
                </div>
                <span className="text-xs text-brand-neutral-1">
                  {r.authorName}
                  {r.authorLocation ? ` · ${r.authorLocation}` : ''} · {formatDate(r.publishedAt)}
                  {r.verifiedPurchase && (
                    <span className="ml-2 text-brand-accent font-medium">✓ Verified</span>
                  )}
                </span>
              </header>
              <p className="text-sm text-brand-neutral-1 leading-relaxed mb-3">{r.body}</p>
              <Link
                href={skuRoute(r.skuId)}
                className="text-xs text-brand-accent font-semibold hover:underline"
              >
                On {skuName(r.skuId)} →
              </Link>
              {r.merchantResponse && (
                <div className="mt-3 ml-4 pl-4 border-l-2 border-brand-accent">
                  <p className="text-xs uppercase tracking-widest text-brand-accent font-semibold mb-1">
                    Roborock response · {formatDate(r.merchantResponse.respondedAt)}
                  </p>
                  <p className="text-sm text-brand-neutral-1 leading-relaxed">{r.merchantResponse.body}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
