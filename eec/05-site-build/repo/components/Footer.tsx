'use client';

import Link from 'next/link';
import { useState } from 'react';
import { track } from '@/lib/gtm';
import { FOOTER_LEGAL } from '@/lib/legal';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sent'>('idle');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    await track('email_signup', {
      source: 'footer',
      email_hash: email,
      consent_categories_granted: ['analytics']
    });
    setStatus('sent');
    setEmail('');
  }

  return (
    <footer className="bg-brand-primary text-brand-secondary mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-5 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full border-2 border-brand-secondary relative">
              <div className="absolute inset-1 rounded-full border border-brand-secondary opacity-50" />
            </div>
            <span className="font-semibold text-lg">Roborock</span>
          </div>
          <p className="text-sm opacity-80 leading-relaxed">
            Cleaning, perfected — so you don&apos;t have to.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider opacity-70">Shop</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/collections/all" className="hover:text-brand-accent transition">All robots</Link></li>
            <li><Link href="/products/roborock-s-series-pro" className="hover:text-brand-accent transition">S-Series Pro</Link></li>
            <li><Link href="/products/roborock-e-series-essential" className="hover:text-brand-accent transition">E-Series Essential</Link></li>
            <li><Link href="/products/roborock-replenish-6mo" className="hover:text-brand-accent transition">Replenish kit</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider opacity-70">Help</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/help" className="hover:text-brand-accent transition">Help center</Link></li>
            <li><Link href="/pages/shipping-returns" className="hover:text-brand-accent transition">Shipping &amp; returns</Link></li>
            <li><Link href="/blog" className="hover:text-brand-accent transition">Blog</Link></li>
            <li><Link href="/reviews" className="hover:text-brand-accent transition">Reviews</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider opacity-70">{FOOTER_LEGAL.heading}</h3>
          <ul className="space-y-2 text-sm">
            {FOOTER_LEGAL.links.map((link) => (
              <li key={link.routePath}>
                <Link href={link.routePath} className="hover:text-brand-accent transition">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider opacity-70">Newsletter</h3>
          {status === 'sent' ? (
            <p className="text-sm opacity-80">Thanks — your 10% code is on its way.</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address for newsletter"
                className="w-full px-3 py-2 rounded text-sm bg-brand-neutral-1 border border-brand-neutral-1 text-brand-secondary placeholder:text-brand-neutral-2 focus:outline-none focus:border-brand-accent"
              />
              <button type="submit" className="text-sm font-semibold text-brand-accent hover:underline">
                Get 10% off →
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="border-t border-brand-neutral-1">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs opacity-60 flex flex-col md:flex-row justify-between gap-2">
          <span>© 2026 Roborock — 100 Roborock Way, Mountain View, CA 94043</span>
          <span>— The Roborock team. Reply to any email — we read every one.</span>
        </div>
      </div>
    </footer>
  );
}
