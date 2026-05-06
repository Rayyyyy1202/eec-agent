'use client';

import { useState } from 'react';
import { addLine } from '@/lib/cart';
import { track } from '@/lib/gtm';
import type { Sku } from '@/lib/products';

export default function AddToCartButton({ sku }: { sku: Sku }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onClick() {
    setBusy(true);
    addLine(sku.id, 1);
    await track('add_to_cart', {
      item_id: sku.id,
      item_name: sku.name,
      quantity: 1,
      value: sku.price.amount,
      currency: sku.price.currency
    });
    setDone(true);
    setBusy(false);
    setTimeout(() => setDone(false), 1500);
  }

  return (
    <button
      onClick={onClick}
      disabled={busy || sku.inventoryStatus === 'out'}
      className="btn-accent w-full md:w-auto"
    >
      {sku.inventoryStatus === 'out'
        ? 'Sold out'
        : done
          ? '✓ Added'
          : busy
            ? 'Adding…'
            : `Add to cart — $${sku.price.amount.toLocaleString()}`}
    </button>
  );
}
