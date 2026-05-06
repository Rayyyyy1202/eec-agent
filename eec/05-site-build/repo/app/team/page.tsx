import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND, FOUNDERS, VALUES } from '@/lib/brand';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Team & Founders — Roborock',
  description:
    'Meet the engineers behind Roborock — ex-iRobot, ex-self-driving SLAM, and the head of customer who still answers the first 50 escalations a week.',
  alternates: { canonical: `${SITE_URL}/team` }
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'About', item: `${SITE_URL}/about` },
    { '@type': 'ListItem', position: 3, name: 'Team', item: `${SITE_URL}/team` }
  ]
};

const personJsonLd = FOUNDERS.map((f) => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: f.name,
  jobTitle: f.role,
  worksFor: { '@type': 'Organization', name: BRAND.name },
  description: f.bio,
  ...(f.linkedinUrl ? { sameAs: [f.linkedinUrl] } : {})
}));

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function TeamPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {personJsonLd.map((p, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(p) }}
        />
      ))}

      <article className="max-w-5xl mx-auto px-4 py-12">
        <header className="mb-12 max-w-3xl">
          <p className="uppercase tracking-widest text-xs text-brand-accent font-semibold mb-3">
            People
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-4">
            The engineers behind the robot.
          </h1>
          <p className="text-lg text-brand-neutral-1 leading-relaxed">
            Three people built the first prototype. The team is bigger now, but the same three still
            sign off on every spec, every feature, and every escalated support ticket.
          </p>
        </header>

        <section className="grid gap-8 md:grid-cols-3 mb-16">
          {FOUNDERS.map((f) => (
            <div
              key={f.id}
              className="border border-brand-neutral-3 rounded-lg p-6 bg-white flex flex-col"
            >
              <div className="w-20 h-20 rounded-full bg-brand-primary text-brand-secondary font-display text-2xl font-bold flex items-center justify-center mb-4">
                {initials(f.name)}
              </div>
              <h2 className="font-display text-xl font-bold leading-tight mb-1">{f.name}</h2>
              <p className="text-xs uppercase tracking-wider text-brand-accent font-semibold mb-3">
                {f.role}
              </p>
              <p className="text-sm text-brand-neutral-1 leading-relaxed mb-4">{f.bio}</p>
              {f.quote && (
                <blockquote className="mt-auto pt-4 border-t border-brand-neutral-3 text-sm italic text-brand-neutral-1">
                  &ldquo;{f.quote}&rdquo;
                </blockquote>
              )}
              {f.linkedinUrl && (
                <a
                  href={f.linkedinUrl}
                  className="text-xs text-brand-accent hover:underline mt-3"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn →
                </a>
              )}
            </div>
          ))}
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">What we believe</h2>
          <ul className="space-y-5">
            {VALUES.map((v) => (
              <li key={v.id} className="border-l-4 border-brand-accent pl-5 py-1">
                <h3 className="font-display text-lg font-bold mb-1">{v.title}</h3>
                <p className="text-sm text-brand-neutral-1 leading-relaxed">{v.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/about" className="btn-outline">
            Read the story
          </Link>
          <Link href="/sustainability" className="btn-outline">
            Sustainability
          </Link>
          <Link href="/press" className="btn-outline">
            Press
          </Link>
        </div>
      </article>
    </>
  );
}
