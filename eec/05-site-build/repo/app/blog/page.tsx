import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPostsSorted } from '@/lib/blog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Roborock Blog — Tests, comparisons, fixes',
  description:
    'Hands-on robot vacuum reviews, sub-$500 lidar comparisons, and the troubleshooting list our support team uses daily.',
  alternates: { canonical: `${SITE_URL}/blog` }
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` }
  ]
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default function BlogIndexPage() {
  const posts = getAllPostsSorted();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-12 max-w-3xl">
          <p className="uppercase tracking-widest text-xs text-brand-accent font-semibold mb-3">
            Blog
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-4">
            Tests, teardowns, and the troubleshooting our support team uses.
          </h1>
          <p className="text-lg text-brand-neutral-1 leading-relaxed">
            We measure things in real homes — twelve weeks with a shedding pet, sub-$500 lidar
            comparisons, and the seven things that cause 90% of stuck-up tickets. Pick your
            problem.
          </p>
        </header>

        <ul className="space-y-6">
          {posts.map((p) => (
            <li
              key={p.slug}
              className="border border-brand-neutral-3 rounded-lg p-6 bg-white hover:border-brand-accent transition"
            >
              <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
                <p className="text-xs text-brand-neutral-1">{formatDate(p.publishedAt)}</p>
                <p className="text-xs text-brand-neutral-1">
                  {p.estimatedReadingTimeMin} min read
                </p>
              </div>
              <Link
                href={`/blog/${p.slug}`}
                className="block font-display text-xl md:text-2xl font-bold leading-tight mb-2 hover:text-brand-accent transition"
              >
                {p.title}
              </Link>
              <p className="text-sm text-brand-neutral-1 leading-relaxed mb-3">{p.excerpt}</p>
              <Link
                href={`/blog/${p.slug}`}
                className="text-sm font-semibold text-brand-accent hover:underline"
              >
                Read the post →
              </Link>
            </li>
          ))}
        </ul>
      </article>
    </>
  );
}
