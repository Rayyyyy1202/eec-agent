import Link from 'next/link';
import SmartImage from './SmartImage';
import type { Sku } from '@/lib/products';

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

export default function ProductCard({ sku }: { sku: Sku }) {
  return (
    <Link
      href={sku.routePath}
      className="block group rounded-lg overflow-hidden bg-white border border-brand-neutral-3 hover:border-brand-primary transition-all duration-300 ease-brand"
    >
      <SmartImage
        assetId={heroAssetBySku[sku.id]}
        ratio="1:1"
        variant={variantBySku[sku.id] || 'navy'}
        label={sku.shortName}
        sizes="(min-width: 768px) 33vw, 100vw"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg leading-tight mb-1">{sku.shortName}</h3>
        <p className="text-sm text-brand-neutral-1 mb-3">{sku.tagline}</p>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-brand-primary">
            ${sku.price.amount.toLocaleString()}
          </span>
          {sku.compareAtPrice && (
            <span className="text-sm text-brand-neutral-2 line-through">
              ${sku.compareAtPrice.amount.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
