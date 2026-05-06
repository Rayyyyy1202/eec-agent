'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  resolveWishlist,
  toggleWishlist,
  type ResolvedWishlistItem
} from '@/lib/wishlist';
import { addLine } from '@/lib/cart';
import { track } from '@/lib/gtm';
import SmartImage from '@/components/SmartImage';

const variantBySku: Record<string, 'navy' | 'orange' | 'cream'> = {
  sku_001: 'navy',
  sku_002: 'cream',
  sku_003: 'orange'
};

export default function WishlistPage() {
  const [items, setItems] = useState<ResolvedWishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(resolveWishlist());
    setHydrated(true);
    const refresh = () => setItems(resolveWishlist());
    window.addEventListener('wishlist:updated', refresh);
    return () => window.removeEventListener('wishlist:updated', refresh);
  }, []);

  function onRemove(skuId: string) {
    toggleWishlist(skuId);
  }

  function onAdd(item: ResolvedWishlistItem) {
    addLine(item.sku.id, 1);
    void track('add_to_cart', {
      item_id: item.sku.id,
      item_name: item.sku.name,
      quantity: 1,
      value: item.sku.price.amount,
      currency: item.sku.price.currency,
      source: 'wishlist'
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <nav className="text-xs text-brand-neutral-1 mb-6 flex gap-2">
        <Link href="/" className="hover:underline">Home</Link><span>/</span>
        <span>Wishlist</span>
      </nav>
      <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">Your wishlist</h1>
      <p className="text-brand-neutral-1 mb-8 leading-relaxed">
        Saved on this device. Sign in (coming with /eec-11-fulfillment) to sync across devices.
      </p>

      {!hydrated ? (
        <p className="text-sm text-brand-neutral-1">Loading…</p>
      ) : items.length === 0 ? (
        <div className="border border-brand-neutral-3 rounded-lg p-8 text-center">
          <p className="text-brand-neutral-1 mb-4">No saved items yet.</p>
          <Link href="/collections/all" className="btn-accent">Browse robots</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.skuId}
              className="border border-brand-neutral-3 rounded-lg p-4 bg-white flex items-center gap-4"
            >
              <div className="w-20 h-20 shrink-0 rounded overflow-hidden">
                <SmartImage
                  alt={item.sku.name}
                  ratio="1:1"
                  variant={variantBySku[item.sku.id] ?? 'navy'}
                  label={item.sku.shortName}
                  sizes="80px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={item.sku.routePath}
                  className="font-semibold text-sm hover:text-brand-accent transition"
                >
                  {item.sku.name}
                </Link>
                <p className="text-xs text-brand-neutral-1 mt-1">
                  ${item.sku.price.amount.toLocaleString()} {item.sku.price.currency}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onAdd(item)}
                  className="btn-accent text-xs"
                >
                  Add to cart
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item.skuId)}
                  className="text-xs text-brand-neutral-1 hover:text-brand-accent underline"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
