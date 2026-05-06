import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ProductCard from '@/components/ProductCard';
import { COLLECTIONS, getSkuById } from '@/lib/products';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export function generateStaticParams() {
  return Object.keys(COLLECTIONS).map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const collection = COLLECTIONS[handle];
  if (!collection) return { title: 'Not found' };
  return {
    title: collection.title,
    description: collection.description,
    alternates: { canonical: `${SITE_URL}/collections/${handle}` }
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const collection = COLLECTIONS[handle];
  if (!collection) notFound();

  const skus = collection.skuIds.map((id) => getSkuById(id)).filter((s): s is NonNullable<typeof s> => Boolean(s));

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.title,
    description: collection.description,
    url: `${SITE_URL}/collections/${handle}`
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">{collection.title}</h1>
        <p className="text-brand-neutral-1 mb-8 max-w-2xl leading-relaxed">{collection.description}</p>
        <div className="grid md:grid-cols-3 gap-5">
          {skus.map((sku) => <ProductCard key={sku.id} sku={sku} />)}
        </div>
      </div>
    </>
  );
}
