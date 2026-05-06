import Link from 'next/link';
import type { Metadata } from 'next';
import { SKUS, COLLECTIONS } from '@/lib/products';
import { POSTS } from '@/lib/blog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Site map',
  description: 'Every page on roborock-us, grouped by section. Use this if you can’t find what you’re looking for.',
  alternates: { canonical: `${SITE_URL}/sitemap-html` }
};

type Section = { title: string; links: { href: string; label: string }[] };

const STATIC_SECTIONS: Section[] = [
  {
    title: 'Brand',
    links: [
      { href: '/', label: 'Home' },
      { href: '/about', label: 'About' },
      { href: '/team', label: 'Team' },
      { href: '/sustainability', label: 'Sustainability' },
      { href: '/press', label: 'Press' }
    ]
  },
  {
    title: 'Help & support',
    links: [
      { href: '/help', label: 'Help center' },
      { href: '/help/setup-videos', label: 'Setup videos' },
      { href: '/help/manuals', label: 'Product manuals' },
      { href: '/help/parts', label: 'Parts finder' },
      { href: '/contact', label: 'Contact us' }
    ]
  },
  {
    title: 'Reviews & content',
    links: [
      { href: '/reviews', label: 'Customer reviews' },
      { href: '/blog', label: 'Blog' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { href: '/pages/privacy', label: 'Privacy policy' },
      { href: '/pages/terms', label: 'Terms of service' },
      { href: '/pages/shipping-returns', label: 'Shipping & returns' },
      { href: '/pages/cookies', label: 'Cookie policy' },
      { href: '/pages/accessibility', label: 'Accessibility statement' },
      { href: '/pages/ccpa-do-not-sell', label: 'CCPA — Do not sell my information' },
      { href: '/pages/prop65', label: 'California Prop 65 warning' },
      { href: '/pages/warranty', label: 'Warranty' },
      { href: '/pages/gdpr-data-request', label: 'GDPR data request' },
      { href: '/pages/dmca', label: 'DMCA notice' }
    ]
  }
];

export default function SitemapHtmlPage() {
  const productSection: Section = {
    title: 'Products',
    links: SKUS.filter((s) => s.launchStatus !== 'archived').map((s) => ({
      href: s.routePath,
      label: s.name
    }))
  };

  const collectionSection: Section = {
    title: 'Collections',
    links: [
      ...Object.entries(COLLECTIONS).map(([handle, c]) => ({
        href: `/collections/${handle}`,
        label: c.title
      })),
      { href: '/compare', label: 'Compare all models' }
    ]
  };

  const blogSection: Section = {
    title: 'Blog posts',
    links: POSTS.map((p) => ({
      href: `/blog/${p.slug}`,
      label: p.title
    }))
  };

  const sections: Section[] = [
    STATIC_SECTIONS[0],
    productSection,
    collectionSection,
    STATIC_SECTIONS[1],
    { ...STATIC_SECTIONS[2], links: STATIC_SECTIONS[2].links },
    blogSection,
    STATIC_SECTIONS[3]
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <nav className="text-xs text-brand-neutral-1 mb-6 flex gap-2">
        <Link href="/" className="hover:underline">Home</Link><span>/</span>
        <span>Site map</span>
      </nav>
      <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">Site map</h1>
      <p className="text-brand-neutral-1 leading-relaxed mb-10 max-w-2xl">
        Every indexable page on the site, grouped by section. Looking for something else?
        <Link href="/contact" className="text-brand-accent hover:underline ml-1">Contact us</Link>.
      </p>

      <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-xs uppercase tracking-widest text-brand-accent font-semibold mb-3">
              {s.title}
            </h2>
            <ul className="space-y-1.5">
              {s.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm hover:text-brand-accent transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
