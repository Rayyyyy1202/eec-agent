import { getPublicUgc } from '@/lib/social-proof';

const platformLabel: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  reddit: 'Reddit',
  direct_upload: 'Submitted directly'
};

const variantBySku: Record<string, 'navy' | 'orange' | 'cream'> = {
  sku_001: 'navy',
  sku_002: 'cream',
  sku_003: 'orange'
};

const gradients: Record<'navy' | 'orange' | 'cream', string> = {
  navy: 'from-brand-primary to-brand-neutral-1',
  cream: 'from-brand-neutral-3 to-brand-secondary',
  orange: 'from-brand-accent to-brand-neutral-2'
};

export default function UgcCarousel() {
  const ugc = getPublicUgc();
  if (ugc.length === 0) return null;

  return (
    <section className="bg-brand-secondary border-y border-brand-neutral-3 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="uppercase tracking-widest text-xs text-brand-accent font-semibold mb-1">
              From real homes
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-semibold">
              Customers, not staged photo shoots.
            </h2>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
          {ugc.map((u) => {
            const variant = u.linkedSkuId ? variantBySku[u.linkedSkuId] ?? 'navy' : 'navy';
            return (
              <figure
                key={u.id}
                className="snap-start shrink-0 w-64 border border-brand-neutral-3 rounded-lg overflow-hidden bg-white"
              >
                <div
                  className={`aspect-square bg-gradient-to-br ${gradients[variant]} flex items-center justify-center text-brand-secondary text-xs uppercase tracking-widest opacity-90`}
                >
                  {u.type === 'video' ? '▶ Video' : 'UGC'}
                </div>
                <figcaption className="p-3 text-xs">
                  <p className="text-brand-neutral-1 leading-relaxed mb-2 line-clamp-3">{u.caption}</p>
                  <p className="text-brand-neutral-1 opacity-70">
                    {u.authorHandle} · {platformLabel[u.authorPlatform] ?? u.authorPlatform}
                  </p>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
