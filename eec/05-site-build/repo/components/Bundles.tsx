import Link from 'next/link';
import { getBundlesForSku, getSkuById } from '@/lib/products';

export default function Bundles({ skuId }: { skuId: string }) {
  const bundles = getBundlesForSku(skuId);
  if (bundles.length === 0) return null;

  return (
    <section className="mt-12 border-t border-brand-neutral-3 pt-8">
      <h2 className="font-display text-xl font-semibold mb-1">Save more — bundle it</h2>
      <p className="text-sm text-brand-neutral-1 mb-6">
        Discounts apply automatically when both items are in your cart at checkout.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        {bundles.map((b) => {
          const items = b.skuIds.map((id) => getSkuById(id)).filter((s) => s !== undefined);
          const subtotal = items.reduce((s, sku) => s + (sku?.price.amount ?? 0), 0);
          const discounted = Math.round(subtotal * (1 - b.discountPct / 100) * 100) / 100;
          return (
            <article key={b.name} className="border border-brand-neutral-3 rounded-lg p-5 bg-white">
              <header className="flex items-baseline justify-between mb-2 gap-2">
                <h3 className="font-semibold text-sm">{b.name}</h3>
                <span className="text-xs uppercase tracking-widest text-brand-accent font-semibold">
                  Save {b.discountPct}%
                </span>
              </header>
              <p className="text-xs text-brand-neutral-1 leading-relaxed mb-4">{b.rationale}</p>
              <ul className="space-y-2 mb-4 text-sm">
                {items.map((sku) =>
                  sku ? (
                    <li key={sku.id} className="flex justify-between gap-3">
                      <Link href={sku.routePath} className="hover:text-brand-accent transition truncate">
                        {sku.shortName}
                      </Link>
                      <span className="text-brand-neutral-1 shrink-0">
                        ${sku.price.amount.toLocaleString()}
                      </span>
                    </li>
                  ) : null
                )}
              </ul>
              <div className="flex items-baseline justify-between border-t border-brand-neutral-3 pt-3">
                <div>
                  <p className="text-xs text-brand-neutral-1 line-through">
                    ${subtotal.toLocaleString()}
                  </p>
                  <p className="font-display text-lg font-semibold">
                    ${discounted.toLocaleString()}
                  </p>
                </div>
                <Link
                  href={items[0]?.routePath ?? '#'}
                  className="text-sm font-semibold text-brand-accent hover:underline"
                >
                  Build bundle →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
