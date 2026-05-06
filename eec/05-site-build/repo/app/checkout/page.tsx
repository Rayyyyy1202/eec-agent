'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { resolveCart, clearCart } from '@/lib/cart';
import type { ResolvedLine } from '@/lib/cart';
import { track } from '@/lib/gtm';

const STRIPE_LIVE = process.env.NEXT_PUBLIC_STRIPE_LIVE === 'true';

export default function CheckoutPage() {
  const [lines, setLines] = useState<ResolvedLine[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ orderId: string; total: number } | null>(null);

  useEffect(() => {
    const c = resolveCart();
    setLines(c.lines);
    setSubtotal(c.subtotal);
    if (c.lines.length > 0) {
      track('begin_checkout', {
        value: c.subtotal,
        currency: c.currency,
        items: c.lines.map((l) => ({
          item_id: l.sku.id,
          item_name: l.sku.name,
          quantity: l.quantity,
          price: l.sku.price.amount
        }))
      });
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;
    setSubmitting(true);

    if (STRIPE_LIVE) {
      // Real path: POST /api/checkout → Stripe session → redirect.
      // Stub: never executes when STRIPE_PUBLIC_KEY=TBD.
      const res = await fetch('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ email, lines })
      });
      const { url } = await res.json();
      window.location.href = url;
      return;
    }

    // Stub mode: simulate Stripe payment_intent.succeeded → fire purchase event.
    await new Promise((r) => setTimeout(r, 1200));
    const orderId = `ord_stub_${Date.now()}`;
    const shipping = 0;
    const tax = Math.round(subtotal * 0.0825 * 100) / 100;
    const total = subtotal + shipping + tax;

    await track('purchase', {
      transaction_id: orderId,
      value: total,
      currency: 'USD',
      items: lines.map((l) => ({
        item_id: l.sku.id,
        item_name: l.sku.name,
        quantity: l.quantity,
        price: l.sku.price.amount
      })),
      shipping,
      tax,
      customer_email_hash: email,
      shipping_address_hash: 'stub_address',
      is_first_purchase: true
    });

    clearCart();
    setDone({ orderId, total });
    setSubmitting(false);
  }

  if (done) {
    return (
      <>
        <head><meta name="robots" content="noindex,follow" /></head>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Thanks — your order is in.</h1>
          <p className="text-brand-neutral-1 mb-2">Order ID: <code className="font-mono">{done.orderId}</code></p>
          <p className="text-brand-neutral-1 mb-8">Total charged (stub): ${done.total.toLocaleString()}</p>
          <p className="text-xs text-brand-neutral-1 max-w-md mx-auto mb-8 leading-relaxed">
            <strong>Stub mode:</strong> No card was charged. When STRIPE_PUBLIC_KEY is set in <code>.env.local</code>,
            this flow redirects to a real Stripe checkout session.
          </p>
          <Link href="/" className="btn-accent inline-block">Back to home</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <head><meta name="robots" content="noindex,follow" /></head>
      <div className="max-w-4xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-10">
        <form onSubmit={onSubmit} className="space-y-4">
          <h1 className="font-display text-3xl font-bold mb-4">Checkout</h1>

          {!STRIPE_LIVE && (
            <div className="bg-brand-neutral-3 text-brand-primary text-xs p-3 rounded">
              <strong>Stub mode active.</strong> Stripe keys are <code>TBD</code> in <code>.env.local</code>.
              Submitting will simulate a successful payment and fire the <code>purchase</code> dataLayer event
              (per eec-06-tracking) without charging anything.
            </div>
          )}

          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-brand-neutral-3 rounded"
              placeholder="you@example.com"
            />
          </label>

          {(['Full name', 'Address line 1', 'City', 'ZIP'] as const).map((label) => (
            <label key={label} className="block">
              <span className="text-sm font-medium">{label}</span>
              <input
                type="text"
                required
                className="w-full mt-1 px-3 py-2 border border-brand-neutral-3 rounded"
              />
            </label>
          ))}

          <div className="border-t border-brand-neutral-3 pt-4">
            <p className="text-sm text-brand-neutral-1 mb-3">Payment</p>
            <div className="space-y-2">
              {['Card', 'Apple Pay', 'Google Pay', 'PayPal', 'Klarna'].map((m) => (
                <div key={m} className="flex items-center gap-2 p-3 border border-brand-neutral-3 rounded text-sm opacity-60">
                  <input type="radio" name="pm" disabled />
                  <span>{m}</span>
                  <span className="text-xs ml-auto">stub</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || lines.length === 0}
            className="btn-accent w-full"
          >
            {submitting ? 'Processing…' : `Pay $${(subtotal + Math.round(subtotal * 0.0825 * 100) / 100).toLocaleString()}`}
          </button>
        </form>

        <aside className="bg-white border border-brand-neutral-3 rounded-lg p-6 h-fit">
          <h2 className="font-semibold mb-3">Order summary</h2>
          {lines.length === 0 ? (
            <p className="text-sm text-brand-neutral-1">Cart is empty. <Link href="/collections/all" className="underline">Shop robots</Link>.</p>
          ) : (
            <>
              {lines.map((l) => (
                <div key={l.skuId} className="flex justify-between text-sm py-2 border-b border-brand-neutral-3">
                  <span>{l.sku.shortName} × {l.quantity}</span>
                  <span>${(l.sku.price.amount * l.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-3"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span>Shipping</span><span>Free</span></div>
              <div className="flex justify-between text-sm"><span>Tax (est.)</span><span>${(Math.round(subtotal * 0.0825 * 100) / 100).toLocaleString()}</span></div>
              <div className="flex justify-between font-semibold pt-3 border-t border-brand-neutral-3 mt-3">
                <span>Total</span><span>${(subtotal + Math.round(subtotal * 0.0825 * 100) / 100).toLocaleString()}</span>
              </div>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
