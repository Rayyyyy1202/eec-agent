import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { marked } from 'marked';
import SmartImage from '@/components/SmartImage';
import AddToCartButton from '@/components/AddToCartButton';
import PdpTabs from '@/components/PdpTabs';
import ReviewWidget from '@/components/ReviewWidget';
import WishlistButton from '@/components/WishlistButton';
import NotifyInStock from '@/components/NotifyInStock';
import SubscribeAndSave from '@/components/SubscribeAndSave';
import ConciergeCTA from '@/components/ConciergeCTA';
import Bundles from '@/components/Bundles';
import PaymentMessaging from '@/components/PaymentMessaging';
import ComingSoonTemplate from '@/components/ComingSoonTemplate';
import ViewItemTracker from './ViewItemTracker';
import { getSkuBySlug, SKUS, type SetupStep, type SpecRow } from '@/lib/products';
import {
  getReviewsForSku,
  getAggregateForSku,
  AGGREGATE_RATING_MIN
} from '@/lib/social-proof';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const variantBySku: Record<string, 'navy' | 'orange' | 'cream'> = {
  sku_001: 'navy',
  sku_002: 'cream',
  sku_003: 'orange'
};

const heroAssetBySku: Record<string, string> = {
  sku_001: 'asset_001',
  sku_002: 'asset_006',
  sku_003: 'asset_008'
};

const galleryAssetsBySku: Record<string, [string, string, string]> = {
  sku_001: ['asset_002', 'asset_003', 'asset_005'],
  sku_002: ['asset_006', 'asset_007', 'asset_006'],
  sku_003: ['asset_008', 'asset_008', 'asset_008']
};

export function generateStaticParams() {
  return SKUS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sku = getSkuBySlug(slug);
  if (!sku) return { title: 'Not found' };
  const titlePrefix =
    sku.launchStatus === 'pre_order'
      ? 'Coming Soon: '
      : sku.launchStatus === 'archived'
        ? 'Archived: '
        : '';
  return {
    title: `${titlePrefix}${sku.name}`,
    description: sku.description,
    alternates: { canonical: `${SITE_URL}${sku.routePath}` },
    robots: sku.launchStatus === 'pre_order' ? { index: false, follow: true } : undefined
  };
}

function groupSpecs(rows: SpecRow[]): { group: string; rows: SpecRow[] }[] {
  const order: string[] = [];
  const map = new Map<string, SpecRow[]>();
  for (const row of rows) {
    if (!map.has(row.group)) {
      map.set(row.group, []);
      order.push(row.group);
    }
    map.get(row.group)!.push(row);
  }
  return order.map((group) => ({ group, rows: map.get(group)! }));
}

function totalSetupSeconds(steps: SetupStep[]): number {
  return steps.reduce((s, step) => s + (step.estimatedSeconds ?? 0), 0);
}

function isoDuration(seconds: number): string {
  if (!seconds) return 'PT0S';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let out = 'PT';
  if (h) out += `${h}H`;
  if (m) out += `${m}M`;
  if (s) out += `${s}S`;
  return out === 'PT' ? 'PT0S' : out;
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sku = getSkuBySlug(slug);
  if (!sku) notFound();

  if (sku.launchStatus === 'pre_order') {
    return <ComingSoonTemplate sku={sku} />;
  }

  if (sku.launchStatus === 'archived') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <nav className="text-xs text-brand-neutral-1 mb-6 flex gap-2 justify-center">
          <Link href="/" className="hover:underline">Home</Link><span>/</span>
          <Link href="/collections/all" className="hover:underline">Shop</Link><span>/</span>
          <span>{sku.shortName}</span>
        </nav>
        <span className="inline-block text-[11px] uppercase tracking-widest font-semibold text-brand-neutral-1 border border-brand-neutral-3 rounded-full px-3 py-1 mb-4">
          Archived
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">{sku.name}</h1>
        <p className="text-brand-neutral-1 leading-relaxed mb-8">
          This model has been retired and is no longer available. Replacement parts may still ship while supplies last.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/collections/all" className="btn-accent">See current models</Link>
          <Link href="/help/parts" className="btn-outline">Find replacement parts</Link>
        </div>
      </div>
    );
  }

  const aggregate = getAggregateForSku(sku.id);
  const reviews = getReviewsForSku(sku.id);
  const showAggregateJsonLd = aggregate ? aggregate.reviewCount >= AGGREGATE_RATING_MIN : false;

  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: sku.name,
    description: sku.description,
    sku: sku.id,
    brand: { '@type': 'Brand', name: 'Roborock' },
    image: `${SITE_URL}/og/${sku.id}.jpg`,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}${sku.routePath}`,
      priceCurrency: sku.price.currency,
      price: sku.price.amount,
      availability:
        sku.inventoryStatus === 'in_stock'
          ? 'https://schema.org/InStock'
          : sku.inventoryStatus === 'low'
            ? 'https://schema.org/LimitedAvailability'
            : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition'
    }
  };

  if (showAggregateJsonLd && aggregate) {
    productJsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregate.ratingAverage,
      reviewCount: aggregate.reviewCount,
      bestRating: 5,
      worstRating: 1
    };
    productJsonLd.review = reviews.slice(0, 10).map((r) => ({
      '@type': 'Review',
      name: r.title,
      reviewBody: r.body,
      datePublished: r.publishedAt,
      author: { '@type': 'Person', name: r.authorName },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 }
    }));
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/collections/all` },
      { '@type': 'ListItem', position: 3, name: sku.shortName, item: `${SITE_URL}${sku.routePath}` }
    ]
  };

  const howToJsonLd = sku.setupSteps && sku.setupSteps.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: `Set up your ${sku.shortName}`,
        description: `Step-by-step setup for the ${sku.name}.`,
        totalTime: isoDuration(totalSetupSeconds(sku.setupSteps)),
        step: sku.setupSteps.map((s) => ({
          '@type': 'HowToStep',
          position: s.stepNumber,
          name: s.title,
          text: s.instruction
        }))
      }
    : null;

  const groupedSpecs = sku.specTable ? groupSpecs(sku.specTable) : [];

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="max-w-3xl">
          <p className="text-brand-neutral-1 leading-relaxed mb-6">{sku.description}</p>
          <h3 className="font-display text-lg font-semibold mb-3">In the box / What you get</h3>
          <ul className="space-y-2 mb-6">
            {sku.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm">
                <span className="text-brand-accent">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    }
  ];

  if (groupedSpecs.length > 0) {
    tabs.push({
      id: 'specs',
      label: 'Specs',
      content: (
        <div className="max-w-3xl space-y-8">
          {groupedSpecs.map((g) => (
            <div key={g.group}>
              <h3 className="text-xs uppercase tracking-widest text-brand-accent font-semibold mb-2">
                {g.group}
              </h3>
              <dl className="border-t border-brand-neutral-3">
                {g.rows.map((r) => (
                  <div
                    key={`${r.group}-${r.label}`}
                    className="grid grid-cols-2 py-3 border-b border-brand-neutral-3 text-sm"
                  >
                    <dt className="text-brand-neutral-1">{r.label}</dt>
                    <dd className="font-medium">
                      {r.value}
                      {r.unit ? <span className="text-brand-neutral-1"> {r.unit}</span> : null}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )
    });
  }

  if (sku.techExplainers && sku.techExplainers.length > 0) {
    tabs.push({
      id: 'tech',
      label: 'Tech',
      content: (
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
          {sku.techExplainers.map((t) => (
            <article
              key={t.id}
              className="border border-brand-neutral-3 rounded-lg p-6 bg-white"
            >
              <h3 className="font-display text-lg font-semibold mb-2">{t.title}</h3>
              <div
                className="prose-blog text-sm text-brand-neutral-1"
                dangerouslySetInnerHTML={{ __html: marked.parse(t.bodyMd, { gfm: true, breaks: false }) as string }}
              />
            </article>
          ))}
        </div>
      )
    });
  }

  if (sku.setupSteps && sku.setupSteps.length > 0) {
    tabs.push({
      id: 'setup',
      label: 'Setup',
      content: (
        <ol className="max-w-3xl space-y-4">
          {sku.setupSteps.map((s) => (
            <li
              key={s.stepNumber}
              className="border border-brand-neutral-3 rounded-lg p-5 bg-white flex gap-4"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-brand-accent text-white text-sm font-semibold flex items-center justify-center">
                {s.stepNumber}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-brand-neutral-1 leading-relaxed">{s.instruction}</p>
                {s.estimatedSeconds ? (
                  <p className="text-xs text-brand-neutral-1 mt-2 opacity-70">
                    ~{Math.max(1, Math.round(s.estimatedSeconds / 60))} min
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )
    });
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {howToJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      )}
      <ViewItemTracker
        skuId={sku.id}
        name={sku.name}
        category={sku.id === 'sku_003' ? 'accessory' : 'robot_vacuum'}
        price={sku.price.amount}
        currency={sku.price.currency}
      />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <nav className="text-xs text-brand-neutral-1 mb-6 flex gap-2">
          <a href="/" className="hover:underline">Home</a><span>/</span>
          <a href="/collections/all" className="hover:underline">Shop</a><span>/</span>
          <a href="/compare" className="hover:underline">Compare</a><span>/</span>
          <span>{sku.shortName}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <SmartImage
              assetId={heroAssetBySku[sku.id]}
              ratio="1:1"
              variant={variantBySku[sku.id]}
              label={`${sku.shortName} · hero`}
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
            />
            <div className="grid grid-cols-3 gap-2">
              <SmartImage assetId={galleryAssetsBySku[sku.id][0]} ratio="1:1" variant="cream" label="angle" sizes="(min-width: 768px) 16vw, 33vw" />
              <SmartImage assetId={galleryAssetsBySku[sku.id][1]} ratio="1:1" variant="navy" label="detail" sizes="(min-width: 768px) 16vw, 33vw" />
              <SmartImage assetId={galleryAssetsBySku[sku.id][2]} ratio="1:1" variant="orange" label="in use" sizes="(min-width: 768px) 16vw, 33vw" />
            </div>
          </div>

          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-2">{sku.name}</h1>
            <p className="text-brand-neutral-1 text-lg mb-4">{sku.tagline}</p>
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-3xl font-semibold">${sku.price.amount.toLocaleString()}</span>
              {sku.compareAtPrice && (
                <span className="text-lg text-brand-neutral-2 line-through">
                  ${sku.compareAtPrice.amount.toLocaleString()}
                </span>
              )}
              {sku.subscriptionEligible && (
                <span className="text-xs uppercase tracking-wider bg-brand-accent text-white px-2 py-1 rounded">
                  Subscribe & save 20%
                </span>
              )}
            </div>
            <PaymentMessaging amount={sku.price.amount} currency={sku.price.currency} />

            <p className="text-brand-neutral-1 mt-6 mb-6 leading-relaxed">{sku.description}</p>

            <ul className="space-y-2 mb-6">
              {sku.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm">
                  <span className="text-brand-accent">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {sku.subscriptionEligible ? <SubscribeAndSave sku={sku} /> : <AddToCartButton sku={sku} />}
            <WishlistButton sku={sku} />
            {sku.inventoryStatus !== 'in_stock' && <NotifyInStock sku={sku} />}
            {sku.conciergeEligible && <ConciergeCTA sku={sku} />}

            {sku.certifications && sku.certifications.length > 0 && (
              <div className="mt-6 border-t border-brand-neutral-3 pt-4">
                <p className="text-xs uppercase tracking-widest text-brand-neutral-1 mb-2">
                  Certifications
                </p>
                <div className="flex flex-wrap gap-2">
                  {sku.certifications.map((c) => (
                    <span
                      key={c.name}
                      title={c.scopeNote}
                      className="text-xs border border-brand-neutral-3 rounded-full px-3 py-1 bg-white"
                    >
                      {c.name}
                      {c.scopeNote ? <span className="text-brand-neutral-1"> · {c.scopeNote}</span> : null}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-brand-neutral-1">
              <div>✓ Free US shipping</div>
              <div>✓ {sku.returnWindowDays}-day returns</div>
              <div>✓ 2-year warranty</div>
              <div>✓ Reply-to-any-email support</div>
            </div>
          </div>
        </div>

        <section className="mt-16">
          <PdpTabs tabs={tabs} defaultId="overview" />
        </section>

        <Bundles skuId={sku.id} />

        <section className="mt-16" id="reviews">
          <h2 className="font-display text-2xl font-semibold mb-6">Reviews</h2>
          <ReviewWidget skuId={sku.id} limit={4} />
        </section>

        <section className="mt-12 border-t border-brand-neutral-3 pt-8 text-sm text-brand-neutral-1">
          Comparing models? See our <a href="/compare" className="text-brand-accent font-semibold hover:underline">side-by-side comparison →</a>
        </section>
      </div>
    </>
  );
}
