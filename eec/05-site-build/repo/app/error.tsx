'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined' && Array.isArray((window as { dataLayer?: unknown[] }).dataLayer)) {
      (window as { dataLayer: Record<string, unknown>[] }).dataLayer.push({
        event: 'application_error',
        error_message: error.message,
        error_digest: error.digest ?? null
      });
    }
  }, [error]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-xs uppercase tracking-widest text-brand-accent font-semibold mb-4">
        500 — Something went wrong
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
        That&rsquo;s on us, not you.
      </h1>
      <p className="text-brand-neutral-1 leading-relaxed mb-10 max-w-xl mx-auto">
        Our system hit an unexpected error. You can retry the page, or head back home and try another route.
        If this keeps happening, our team would love to know.
      </p>

      <div className="flex flex-wrap justify-center gap-3 mb-10">
        <button type="button" onClick={() => reset()} className="btn-accent">
          Try again
        </button>
        <Link href="/" className="btn-outline">Back to home</Link>
        <Link href="/contact" className="btn-outline">Report this issue</Link>
      </div>

      {error.digest && (
        <p className="text-xs text-brand-neutral-1 font-mono">
          Reference: {error.digest}
        </p>
      )}
    </div>
  );
}
