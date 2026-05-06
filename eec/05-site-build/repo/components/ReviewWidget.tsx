import Link from 'next/link';
import Stars from '@/components/Stars';
import {
  getReviewsForSku,
  getAggregateForSku,
  AGGREGATE_RATING_MIN
} from '@/lib/social-proof';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ReviewWidget({ skuId, limit = 4 }: { skuId: string; limit?: number }) {
  const agg = getAggregateForSku(skuId);
  const reviews = getReviewsForSku(skuId).slice(0, limit);
  const totalForSku = getReviewsForSku(skuId).length;

  if (!agg || agg.reviewCount === 0) {
    return (
      <div className="border border-brand-neutral-3 rounded-lg p-6 text-center text-sm text-brand-neutral-1">
        No reviews yet — be the first.
      </div>
    );
  }

  const showAggregateBadge = agg.reviewCount >= AGGREGATE_RATING_MIN;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-baseline gap-3">
          <Stars rating={agg.ratingAverage} size="lg" />
          <span className="font-display text-2xl font-semibold">{agg.ratingAverage.toFixed(1)}</span>
          <span className="text-sm text-brand-neutral-1">({agg.reviewCount} reviews)</span>
          {!showAggregateBadge && (
            <span className="text-xs text-brand-neutral-1 italic">
              · star summary appears once {AGGREGATE_RATING_MIN - agg.reviewCount} more land
            </span>
          )}
        </div>
        <Link href={`/reviews?sku=${skuId}`} className="text-sm font-semibold text-brand-accent hover:underline">
          See all {totalForSku} reviews →
        </Link>
      </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <article key={r.id} className="border border-brand-neutral-3 rounded-lg p-5 bg-white">
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
            <p className="text-sm text-brand-neutral-1 leading-relaxed">{r.body}</p>
            {r.merchantResponse && (
              <div className="mt-3 ml-4 pl-4 border-l-2 border-brand-accent">
                <p className="text-xs uppercase tracking-widest text-brand-accent font-semibold mb-1">
                  Roborock response · {formatDate(r.merchantResponse.respondedAt)}
                </p>
                <p className="text-sm text-brand-neutral-1 leading-relaxed">{r.merchantResponse.body}</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
