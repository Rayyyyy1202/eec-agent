import { PRESS_LOGOS, PRESS_DISPLAY_MODE } from '@/lib/social-proof';

export default function TrustBar() {
  if (PRESS_LOGOS.length === 0) return null;
  const featured = PRESS_LOGOS[0];

  return (
    <section className="bg-white border-t border-brand-neutral-3 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <p className="uppercase tracking-widest text-xs text-brand-neutral-1 font-semibold text-center mb-6">
          As reviewed in
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {PRESS_LOGOS.map((p) => (
            <a
              key={p.outlet}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-lg text-brand-neutral-1 hover:text-brand-primary transition opacity-70 hover:opacity-100"
              title={p.pullQuote}
            >
              {p.outlet}
            </a>
          ))}
        </div>
        {PRESS_DISPLAY_MODE === 'logos_with_quote' && featured?.pullQuote && (
          <blockquote className="max-w-2xl mx-auto mt-6 text-center text-sm text-brand-neutral-1 italic">
            “{featured.pullQuote}” —{' '}
            <a href={featured.url} className="not-italic font-semibold hover:underline" target="_blank" rel="noopener noreferrer">
              {featured.outlet}
            </a>
          </blockquote>
        )}
      </div>
    </section>
  );
}
