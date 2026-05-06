import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { marked } from 'marked';
import { getLegalDoc, getAllLegalSlugs } from '@/lib/legal';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export function generateStaticParams() {
  return getAllLegalSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) return { title: 'Not found' };
  return {
    title: `${doc.title} — Roborock`,
    description: doc.description,
    alternates: { canonical: `${SITE_URL}/pages/${slug}` }
  };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) notFound();

  const html = marked.parse(doc.bodyMd, { gfm: true, breaks: false, async: false }) as string;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <p className="text-xs uppercase tracking-wider text-brand-neutral-1 mb-2">Legal</p>
      <p className="text-brand-neutral-1 mb-8 italic text-sm">{doc.description}</p>
      <article
        className="prose-blog text-base text-brand-neutral-1"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
