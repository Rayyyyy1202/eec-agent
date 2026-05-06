'use client';

import { useState } from 'react';
import { addLine } from '@/lib/cart';
import { track } from '@/lib/gtm';
import type { Sku } from '@/lib/products';

const DISCOUNT_PCT = 20;

export default function SubscribeAndSave({ sku }: { sku: Sku }) {
  const [mode, setMode] = useState<'one_time' | 'subscribe'>('subscribe');
  const [busy, setBusy] = useState(false);

  const subscribePrice = Math.round(sku.price.amount * (1 - DISCOUNT_PCT / 100) * 100) / 100;

  async function onAdd() {
    setBusy(true);
    addLine(sku.id, 1);
    await track('add_to_cart', {
      item_id: sku.id,
      item_name: sku.name,
      quantity: 1,
      value: mode === 'subscribe' ? subscribePrice : sku.price.amount,
      currency: sku.price.currency,
      purchase_mode: mode
    });
    if (mode === 'subscribe') {
      await track('subscription_optin', {
        item_id: sku.id,
        cadence_months: 6,
        discount_pct: DISCOUNT_PCT
      });
    }
    setBusy(false);
  }

  return (
    <div className="mt-6 border border-brand-neutral-3 rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setMode('subscribe')}
        className={`w-full text-left p-4 border-b border-brand-neutral-3 flex items-center gap-3 ${
          mode === 'subscribe' ? 'bg-brand-secondary' : ''
        }`}
        aria-pressed={mode === 'subscribe'}
      >
        <span
          className={`w-4 h-4 rounded-full border-2 ${
            mode === 'subscribe' ? 'border-brand-accent bg-brand-accent' : 'border-brand-neutral-3'
          }`}
          aria-hidden="true"
        />
        <span className="flex-1">
          <span className="block font-semibold text-sm">Subscribe & save {DISCOUNT_PCT}%</span>
          <span className="block text-xs text-brand-neutral-1">
            Auto-ship every 6 months. Cancel any time. ${subscribePrice.toFixed(2)} / box.
          </span>
        </span>
        <span className="text-sm font-semibold">${subscribePrice.toFixed(2)}</span>
      </button>
      <button
        type="button"
        onClick={() => setMode('one_time')}
        className={`w-full text-left p-4 flex items-center gap-3 ${
          mode === 'one_time' ? 'bg-brand-secondary' : ''
        }`}
        aria-pressed={mode === 'one_time'}
      >
        <span
          className={`w-4 h-4 rounded-full border-2 ${
            mode === 'one_time' ? 'border-brand-accent bg-brand-accent' : 'border-brand-neutral-3'
          }`}
          aria-hidden="true"
        />
        <span className="flex-1">
          <span className="block font-semibold text-sm">One-time purchase</span>
          <span className="block text-xs text-brand-neutral-1">No commitment. Pay full price today.</span>
        </span>
        <span className="text-sm font-semibold">${sku.price.amount.toLocaleString()}</span>
      </button>
      <div className="p-4 border-t border-brand-neutral-3">
        <button
          type="button"
          onClick={onAdd}
          disabled={busy}
          className="btn-accent w-full"
        >
          {busy
            ? 'Adding…'
            : mode === 'subscribe'
              ? `Subscribe — $${subscribePrice.toFixed(2)}`
              : `Add to cart — $${sku.price.amount.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}
