'use client';

import { useEffect, useState } from 'react';
import { isWishlisted, toggleWishlist } from '@/lib/wishlist';
import { track } from '@/lib/gtm';
import type { Sku } from '@/lib/products';

export default function WishlistButton({ sku }: { sku: Sku }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isWishlisted(sku.id));
    const refresh = () => setActive(isWishlisted(sku.id));
    window.addEventListener('wishlist:updated', refresh);
    return () => window.removeEventListener('wishlist:updated', refresh);
  }, [sku.id]);

  function onClick() {
    const nowActive = toggleWishlist(sku.id);
    setActive(nowActive);
    void track(nowActive ? 'add_to_wishlist' : 'remove_from_wishlist', {
      item_id: sku.id,
      item_name: sku.name,
      value: sku.price.amount,
      currency: sku.price.currency
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`mt-3 w-full md:w-auto inline-flex items-center justify-center gap-2 text-sm font-medium border border-brand-neutral-3 rounded-md px-4 py-2 transition ${
        active ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white hover:bg-brand-secondary'
      }`}
    >
      <span aria-hidden="true">{active ? '♥' : '♡'}</span>
      {active ? 'Saved to wishlist' : 'Save to wishlist'}
    </button>
  );
}
