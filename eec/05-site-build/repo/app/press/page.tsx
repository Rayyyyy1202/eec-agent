import type { Metadata } from 'next';
import Link from 'next/link';
import { AWARDS, PRESS_MENTIONS } from '@/lib/brand';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Press & Awards — Roborock',
  description:
    'What Wirecutter, The Verge, Tom’s Guide, Engadget, and Good Housekeeping have said about Roborock — plus the awards that came with the reviews.',
  alternates: { canonical: `${SITE_URL}/press` }
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'About', item: `${SITE_URL}/about` },
    { '@type': 'ListItem', position: 3, name: 'Press', item: `${SITE_URL}/press` }
  ]
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function PressPage() {
  const sortedPress = [...PRESS_MENTIONS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  const sortedAwards = [...AWARDS].sort((a, b) => b.year - a.year);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-12 max-w-3xl">
          <p className="uppercase tracking-widest text-xs text-brand-accent font-semibold mb-3">
            Press
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-4">
            What other people have said.
          </h1>
          <p className="text-lg text-brand-neutral-1 leading-relaxed">
            We can tell you the brushes don’t tangle. It’s more useful when Wirecutter
            does.
          </p>
        </header>

        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-6">Recent coverage</h2>
          <ul className="space-y-6">
            {sortedPress.map((p) => (
              <li
                key={p.url}
                className="border border-brand-neutral-3 rounded-lg p-6 bg-white"
              >
                <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
                  <p className="font-display font-bold text-base">{p.outlet}</p>
                  <p className="text-xs text-brand-neutral-1">{formatDate(p.publishedAt)}</p>
                </div>
                <a
                  href={p.url}
                  className="block text-lg font-semibold mb-3 hover:text-brand-accent transition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {p.headline} ↗
                </a>
                {p.pullQuote && (
                  <blockquote className="text-sm italic text-brand-neutral-1 border-l-2 border-brand-accent pl-4">
                    &ldquo;{p.pullQuote}&rdquo;
                  </blockquote>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold mb-6">Awards</h2>
          <ul className="grid sm:grid-cols-2 gap-4">
            {sortedAwards.map((a) => (
              <li
                key={`${a.name}-${a.year}`}
                className="border border-brand-neutral-3 rounded-lg p-5 bg-white"
              >
                <div className="text-3xl font-display font-bold text-brand-accent mb-2">
                  {a.year}
                </div>
                <p className="font-semibold text-sm mb-1">{a.name}</p>
                <p className="text-xs text-brand-neutral-1">{a.body}</p>
                {a.category && (
                  <p className="text-xs text-brand-neutral-1 mt-1 italic">{a.category}</p>
                )}
              </li>
            ))}
          </ul>
        </section>

        <aside className="p-6 bg-brand-secondary rounded-lg border-l-4 border-brand-accent mb-12">
          <p className="text-sm font-semibold mb-2">Press inquiries</p>
          <p className="text-sm text-brand-neutral-1">
            For review units, embargo timelines, or interview requests: email{' '}
            <a className="text-brand-accent hover:underline" href="mailto:press@roborock-us.example.com">
              press@roborock-us.example.com
            </a>
            . We reply within one business day.
          </p>
        </aside>

        <div className="flex flex-wrap gap-3">
          <Link href="/about" className="btn-outline">
            Our story
          </Link>
          <Link href="/team" className="btn-outline">
            The team
          </Link>
        </div>
      </article>
    </>
  );
}
