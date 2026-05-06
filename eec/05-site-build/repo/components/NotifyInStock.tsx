'use client';

import { useState } from 'react';
import { track } from '@/lib/gtm';
import type { Sku } from '@/lib/products';

export default function NotifyInStock({ sku }: { sku: Sku }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isLow = sku.inventoryStatus === 'low';
  const isOut = sku.inventoryStatus === 'out';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    await track('back_in_stock_signup', {
      item_id: sku.id,
      item_name: sku.name,
      email,
      inventory_status: sku.inventoryStatus
    });
    setSubmitting(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="mt-4 border border-brand-accent/40 bg-white rounded-lg p-4 text-sm text-brand-neutral-1">
        ✓ We&rsquo;ll email you the moment the {sku.shortName} is back. No marketing — just this one alert.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 border border-brand-neutral-3 bg-white rounded-lg p-4">
      <p className="text-sm font-semibold mb-1">
        {isOut ? 'Sold out — get notified' : isLow ? 'Low stock — reserve a spot' : 'Notify me'}
      </p>
      <p className="text-xs text-brand-neutral-1 mb-3 leading-relaxed">
        One email when the {sku.shortName} is restocked. Unsubscribed by default after delivery.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email for back-in-stock notification"
          className="flex-1 text-sm border border-brand-neutral-3 rounded-md px-3 py-2 focus:outline-none focus:border-brand-accent"
        />
        <button
          type="submit"
          disabled={submitting}
          className="btn-accent text-sm"
        >
          {submitting ? '…' : 'Notify me'}
        </button>
      </div>
      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
    </form>
  );
}
