import type { Metadata } from 'next';
import Link from 'next/link';
import SmartImage from '@/components/SmartImage';
import { BRAND, FOUNDERS, TIMELINE, VALUES } from '@/lib/brand';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'About Roborock — Engineered for the messy weeks',
  description:
    "We measured every brush, mop, and lidar map so you don't have to. Read the story of how Roborock got built — and why we still answer every support email ourselves.",
  alternates: { canonical: `${SITE_URL}/about` }
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'About', item: `${SITE_URL}/about` }
  ]
};

const aboutPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  url: `${SITE_URL}/about`,
  about: {
    '@type': 'Organization',
    name: BRAND.name,
    description: BRAND.mission
  }
};

const brandJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Brand',
  name: BRAND.name,
  slogan: BRAND.tagline,
  description: BRAND.storyShort,
  url: SITE_URL,
  founder: FOUNDERS.map((f) => ({
    '@type': 'Person',
    name: f.name,
    jobTitle: f.role
  }))
};

export default function AboutPage() {
  const sortedTimeline = [...TIMELINE].sort((a, b) => a.year - b.year);

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(brandJsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-10">
          <p className="uppercase tracking-widest text-xs text-brand-accent font-semibold mb-3">
            Our story
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-4">
            {BRAND.tagline}
          </h1>
          <p className="text-lg text-brand-neutral-1 leading-relaxed">{BRAND.mission}</p>
        </header>

        <SmartImage
          assetId="asset_002"
          ratio="16:9"
          variant="navy"
          label="EDITORIAL · Roborock in the wild"
          sizes="(min-width: 768px) 768px, 100vw"
        />

        <section className="mt-10 space-y-6 text-base leading-relaxed text-brand-neutral-1">
          <p>{BRAND.storyShort}</p>
          <p>
            We measure things so you don&apos;t have to. Every spec on every product page is one we
            tested in a real living room with real pet hair, not a showroom. If a number isn&apos;t
            on our spec sheet, it&apos;s because we didn&apos;t have a way to prove it.
          </p>
          <p>
            We answer every support email — usually within the hour, always with a real human. If
            something breaks in the first two years, we replace it; if it breaks after, we sell the
            part. That&apos;s the whole policy.
          </p>
        </section>

        <section className="mt-12 grid sm:grid-cols-3 gap-4 text-center">
          <div className="border border-brand-neutral-3 rounded-lg p-5">
            <div className="text-3xl font-display font-bold text-brand-accent mb-1">10,000 Pa</div>
            <p className="text-xs text-brand-neutral-1">suction we actually measured</p>
          </div>
          <div className="border border-brand-neutral-3 rounded-lg p-5">
            <div className="text-3xl font-display font-bold text-brand-accent mb-1">2 yr</div>
            <p className="text-xs text-brand-neutral-1">warranty on robots</p>
          </div>
          <div className="border border-brand-neutral-3 rounded-lg p-5">
            <div className="text-3xl font-display font-bold text-brand-accent mb-1">60 day</div>
            <p className="text-xs text-brand-neutral-1">no-questions returns</p>
          </div>
        </section>

        <section className="mt-16">
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

        <section className="mt-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">Our timeline</h2>
          <ol className="border-l-2 border-brand-neutral-3 pl-6 space-y-5">
            {sortedTimeline.map((t) => (
              <li key={t.year} className="relative">
                <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-brand-accent border-4 border-white" />
                <div className="font-display font-bold text-brand-primary mb-1">{t.year}</div>
                <p className="text-sm text-brand-neutral-1 leading-relaxed">{t.milestone}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-16 flex flex-wrap gap-3">
          <Link href="/team" className="btn-outline">
            Meet the team
          </Link>
          <Link href="/sustainability" className="btn-outline">
            Sustainability
          </Link>
          <Link href="/press" className="btn-outline">
            Press
          </Link>
          <Link href="/collections/all" className="btn-accent">
            See our robots
          </Link>
        </div>
      </article>
    </>
  );
}
