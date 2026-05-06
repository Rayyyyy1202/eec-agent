'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { resolveCart, setQuantity, removeLine } from '@/lib/cart';
import type { ResolvedLine } from '@/lib/cart';

export default function CartPage() {
  const [lines, setLines] = useState<ResolvedLine[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    const refresh = () => {
      const c = resolveCart();
      setLines(c.lines);
      setSubtotal(c.subtotal);
      setCurrency(c.currency);
    };
    refresh();
    window.addEventListener('cart:updated', refresh);
    return () => window.removeEventListener('cart:updated', refresh);
  }, []);

  return (
    <>
      <head>
        <meta name="robots" content="noindex,follow" />
      </head>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="font-display text-3xl font-bold mb-6">Your cart</h1>

        {lines.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-brand-neutral-3 rounded-lg">
            <p className="text-brand-neutral-1 mb-4">Empty for now.</p>
            <Link href="/collections/all" className="btn-accent inline-block">Shop robots</Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {lines.map((line) => (
                <div key={line.skuId} className="flex items-center gap-4 p-4 border border-brand-neutral-3 rounded-lg bg-white">
                  <div className="flex-1">
                    <Link href={line.sku.routePath} className="font-semibold hover:text-brand-accent">
                      {line.sku.shortName}
                    </Link>
                    <p className="text-sm text-brand-neutral-1">${line.sku.price.amount.toLocaleString()} each</p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => setQuantity(line.skuId, parseInt(e.target.value, 10) || 1)}
                    className="w-16 px-2 py-1 border border-brand-neutral-3 rounded text-sm"
                  />
                  <span className="font-semibold w-24 text-right">
                    ${(line.sku.price.amount * line.quantity).toLocaleString()}
                  </span>
                  <button
                    onClick={() => removeLine(line.skuId)}
                    className="text-xs text-brand-neutral-1 hover:text-brand-accent transition"
                    aria-label={`Remove ${line.sku.shortName}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-brand-neutral-3 pt-6 flex justify-between items-end">
              <div>
                <p className="text-sm text-brand-neutral-1">Subtotal</p>
                <p className="text-2xl font-semibold">${subtotal.toLocaleString()} {currency}</p>
                <p className="text-xs text-brand-neutral-1 mt-1">Shipping + tax calculated at checkout</p>
              </div>
              <Link href="/checkout" className="btn-accent">
                Checkout →
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
