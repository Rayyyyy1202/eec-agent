import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND, CERTIFICATIONS, SUSTAINABILITY } from '@/lib/brand';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Sustainability — Roborock',
  description:
    'Repairable by design. 60% recycled aluminum. Battery take-back since 2022. Read the four pillars (and the metrics behind them).',
  alternates: { canonical: `${SITE_URL}/sustainability` }
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'About', item: `${SITE_URL}/about` },
    { '@type': 'ListItem', position: 3, name: 'Sustainability', item: `${SITE_URL}/sustainability` }
  ]
};

const aboutPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  url: `${SITE_URL}/sustainability`,
  about: {
    '@type': 'Organization',
    name: BRAND.name,
    description: SUSTAINABILITY.summary
  }
};

const referencedCerts = new Set(SUSTAINABILITY.certificationsReferenced ?? []);

export default function SustainabilityPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageJsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-10">
          <p className="uppercase tracking-widest text-xs text-brand-accent font-semibold mb-3">
            Sustainability
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-4">
            Built to last. Sold by the part.
          </h1>
          {SUSTAINABILITY.summary && (
            <p className="text-lg text-brand-neutral-1 leading-relaxed">{SUSTAINABILITY.summary}</p>
          )}
        </header>

        <section className="space-y-6 mb-12">
          {SUSTAINABILITY.pillars.map((p) => (
            <div
              key={p.title}
              className="border border-brand-neutral-3 rounded-lg p-6 bg-white"
            >
              <h2 className="font-display text-xl font-bold mb-2">{p.title}</h2>
              <p className="text-sm text-brand-neutral-1 leading-relaxed mb-3">{p.body}</p>
              {p.metric && (
                <p className="inline-block bg-brand-secondary text-brand-primary px-3 py-1 rounded text-xs font-mono">
                  {p.metric}
                </p>
              )}
            </div>
          ))}
        </section>

        {referencedCerts.size > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-2xl font-bold mb-4">Verified by</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {CERTIFICATIONS.filter((c) => referencedCerts.has(c.name)).map((c) => (
                <li
                  key={c.name}
                  className="border border-brand-neutral-3 rounded-md p-4 bg-white"
                >
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs text-brand-neutral-1 mt-1">{c.issuedBy}</p>
                  {c.scope && (
                    <p className="text-xs text-brand-neutral-1 mt-1 italic">Scope: {c.scope}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {SUSTAINABILITY.reportUrl && (
          <aside className="p-6 bg-brand-secondary rounded-lg border-l-4 border-brand-accent mb-12">
            <p className="text-sm font-semibold mb-2">Read the full 2025 report</p>
            <p className="text-sm text-brand-neutral-1 mb-3">
              Methodology, third-party verification, and the metrics that didn’t hit — all in
              one PDF.
            </p>
            <a
              href={SUSTAINABILITY.reportUrl}
              className="text-sm text-brand-accent font-semibold hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download the report →
            </a>
          </aside>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href="/about" className="btn-outline">
            Our story
          </Link>
          <Link href="/team" className="btn-outline">
            The team
          </Link>
          <Link href="/collections/all" className="btn-accent">
            Shop the line
          </Link>
        </div>
      </article>
    </>
  );
}
