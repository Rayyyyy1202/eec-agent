'use client';

import { useEffect, useState } from 'react';
import { updateConsent } from '@/lib/gtm';

const KEY = 'roborock_consent_v2';

export default function ConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.localStorage.getItem(KEY)) setOpen(true);
  }, []);

  function decide(grant: boolean) {
    const v: 'granted' | 'denied' = grant ? 'granted' : 'denied';
    updateConsent({
      ad_storage: v,
      analytics_storage: v,
      ad_user_data: v,
      ad_personalization: v
    });
    window.localStorage.setItem(KEY, grant ? 'granted' : 'denied');
    setOpen(false);
  }

  if (!open) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md bg-brand-primary text-brand-secondary rounded-lg shadow-2xl p-5 z-50 border border-brand-neutral-1">
      <h3 className="font-semibold mb-1">We use cookies.</h3>
      <p className="text-sm opacity-80 mb-4 leading-relaxed">
        Analytics + ads to understand what works. You can change this any time in our{' '}
        <a href="/pages/privacy" className="underline">privacy notice</a>.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => decide(true)}
          className="flex-1 bg-brand-accent text-white text-sm font-semibold py-2 rounded hover:opacity-95 transition"
        >
          Accept all
        </button>
        <button
          onClick={() => decide(false)}
          className="flex-1 border border-brand-neutral-2 text-sm font-medium py-2 rounded hover:bg-brand-neutral-1 transition"
        >
          Necessary only
        </button>
      </div>
    </div>
  );
}
