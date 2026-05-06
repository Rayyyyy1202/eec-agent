'use client';

import { useState } from 'react';
import { track } from '@/lib/gtm';
import type { Sku } from '@/lib/products';

export default function WaitlistForm({ sku }: { sku: Sku }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    await track('waitlist_signup', {
      item_id: sku.id,
      item_name: sku.name,
      email,
      launch_status: sku.launchStatus,
      launch_date: sku.launchDate ?? ''
    });
    setSubmitting(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="border border-brand-accent/40 bg-white rounded-lg p-5 text-sm text-brand-neutral-1">
        <p className="font-semibold text-brand-primary mb-1">You&rsquo;re on the list.</p>
        We&rsquo;ll send one email the day the {sku.shortName} ships. No drip campaigns, no upsells in the meantime.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="border border-brand-neutral-3 bg-white rounded-lg p-5">
      <label htmlFor="waitlist-email" className="block text-sm font-semibold mb-2">
        Get an email the day it ships
      </label>
      <p className="text-xs text-brand-neutral-1 mb-3 leading-relaxed">
        First-300 waitlist gets priority allocation and a $50 launch credit.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="waitlist-email"
          type="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label={`Email to join the ${sku.shortName} waitlist`}
          className="flex-1 text-sm border border-brand-neutral-3 rounded-md px-3 py-2 focus:outline-none focus:border-brand-accent"
        />
        <button type="submit" disabled={submitting} className="btn-accent text-sm">
          {submitting ? '…' : 'Join waitlist'}
        </button>
      </div>
      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
    </form>
  );
}
