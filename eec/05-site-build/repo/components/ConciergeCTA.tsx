'use client';

import { track } from '@/lib/gtm';
import type { Sku } from '@/lib/products';

export default function ConciergeCTA({ sku }: { sku: Sku }) {
  function onClick() {
    void track('concierge_cta_click', {
      item_id: sku.id,
      item_name: sku.name,
      placement: 'pdp_post_cart'
    });
  }

  return (
    <a
      href={`mailto:concierge@roborock.example.com?subject=${encodeURIComponent(`Specialist help — ${sku.shortName}`)}&body=${encodeURIComponent(`Hi — I'm considering the ${sku.name} and have a few questions:\n\n`)}`}
      onClick={onClick}
      className="mt-4 flex items-center gap-3 border border-brand-neutral-3 rounded-lg p-4 bg-brand-secondary/40 hover:bg-brand-secondary transition"
    >
      <div className="w-10 h-10 rounded-full bg-brand-primary text-brand-secondary flex items-center justify-center text-lg" aria-hidden="true">
        ☎
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">Talk to a specialist before you buy</p>
        <p className="text-xs text-brand-neutral-1 leading-relaxed">
          Real human, robotics-trained, replies within one business day. Free for {sku.shortName} buyers.
        </p>
      </div>
      <span className="text-brand-accent font-semibold text-sm" aria-hidden="true">→</span>
    </a>
  );
}
