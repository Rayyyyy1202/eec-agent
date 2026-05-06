import type { Metadata } from 'next';
import Link from 'next/link';
import HelpNav from '@/components/HelpNav';
import { PARTS_FINDER } from '@/lib/customer-service';
import { getSkuById } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Parts &amp; replacements',
  description: 'Find the right replacement parts for your Roborock — filters, brushes, mop pads.'
};

export default function PartsPage() {
  const parents = Array.from(new Set(PARTS_FINDER.map((p) => p.parentSkuId)));

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-bold mb-3">Parts &amp; replacements</h1>
      <p className="text-brand-neutral-1 mb-2 leading-relaxed">
        Pick the model you own to see what fits. The 6-month Replenish Kit covers everything that wears out — set it on
        subscription and forget about it.
      </p>
      <HelpNav active="/help/parts" />

      <div className="space-y-8">
        {parents.map((parentId) => {
          const parent = getSkuById(parentId);
          const parts = PARTS_FINDER.filter((p) => p.parentSkuId === parentId);
          return (
            <section key={parentId}>
              <h2 className="font-display text-lg font-bold mb-3">
                For: <span className="text-brand-primary">{parent?.name || parentId}</span>
              </h2>
              <div className="space-y-3">
                {parts.map((p, idx) => {
                  const replacement = getSkuById(p.replacementSkuId);
                  return (
                    <article
                      key={idx}
                      className="border border-brand-neutral-3 rounded-lg p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <h3 className="font-semibold">{replacement?.name || p.replacementSkuId}</h3>
                          {p.partType && (
                            <span className="text-xs uppercase tracking-wider text-brand-neutral-1 bg-brand-secondary px-2 py-0.5 rounded">
                              {p.partType}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-brand-neutral-1 leading-relaxed">{p.fitmentNote}</p>
                        {p.replacementIntervalDays && (
                          <p className="text-xs text-brand-neutral-1 mt-2">
                            Replace every <strong>{p.replacementIntervalDays} days</strong> for typical use.
                          </p>
                        )}
                      </div>
                      {replacement && (
                        <Link href={`/products/${replacement.slug}`} className="btn-accent text-sm shrink-0">
                          Shop {replacement.name}
                        </Link>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
