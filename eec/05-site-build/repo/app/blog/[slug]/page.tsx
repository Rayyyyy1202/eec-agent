import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { BRAND } from '@/lib/brand';
import { POSTS, getPostBySlug, loadPostMarkdown } from '@/lib/blog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post not found — Roborock Blog' };
  return {
    title: `${post.title} — Roborock`,
    description: post.excerpt,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      url: `${SITE_URL}/blog/${post.slug}`
    }
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default async function BlogPostPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const md = loadPostMarkdown(post);
  const html = marked.parse(md, { gfm: true, breaks: false }) as string;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${SITE_URL}/blog/${post.slug}`
      }
    ]
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    keywords: [post.targetKeyword, ...post.secondaryKeywords].join(', '),
    author: { '@type': 'Organization', name: BRAND.name },
    publisher: {
      '@type': 'Organization',
      name: BRAND.name,
      url: SITE_URL
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 py-12">
        <nav className="text-xs text-brand-neutral-1 mb-6">
          <Link href="/blog" className="hover:text-brand-accent">
            ← All posts
          </Link>
        </nav>

        <header className="mb-8">
          <div className="flex items-baseline gap-3 text-xs text-brand-neutral-1 mb-3">
            <span>{formatDate(post.publishedAt)}</span>
            <span aria-hidden>·</span>
            <span>{post.estimatedReadingTimeMin} min read</span>
          </div>
        </header>

        <div
          className="prose-blog text-base leading-relaxed text-brand-neutral-1"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <aside className="mt-12 p-6 bg-brand-secondary rounded-lg border-l-4 border-brand-accent">
          <p className="text-sm font-semibold mb-2">Reply with questions</p>
          <p className="text-sm text-brand-neutral-1 mb-3">
            Every email gets a human reply, usually within the hour. The{' '}
            <Link href="/help" className="text-brand-accent hover:underline">
              Help Center
            </Link>{' '}
            has the troubleshooting tree if you want to start there.
          </p>
        </aside>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/blog" className="btn-outline">
            More posts
          </Link>
          <Link href="/collections/all" className="btn-accent">
            Shop the line
          </Link>
        </div>
      </article>
    </>
  );
}
