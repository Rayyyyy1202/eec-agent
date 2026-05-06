import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you were looking for could not be found.',
  robots: { index: false, follow: false }
};

const QUICK_LINKS = [
  { href: '/collections/all', label: 'Shop all robots' },
  { href: '/compare', label: 'Compare models' },
  { href: '/help', label: 'Help & support' },
  { href: '/contact', label: 'Contact us' },
  { href: '/sitemap-html', label: 'Site map' }
];

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-xs uppercase tracking-widest text-brand-accent font-semibold mb-4">
        404 — Page not found
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
        We can&rsquo;t find that page.
      </h1>
      <p className="text-brand-neutral-1 leading-relaxed mb-10 max-w-xl mx-auto">
        The link may be broken, the page may have moved, or the model may be archived.
        Try one of the popular destinations below — or head back home.
      </p>

      <div className="flex flex-wrap justify-center gap-3 mb-10">
        <Link href="/" className="btn-accent">Back to home</Link>
        <Link href="/collections/all" className="btn-outline">See all robots</Link>
      </div>

      <div className="border-t border-brand-neutral-3 pt-8">
        <p className="text-xs uppercase tracking-widest text-brand-neutral-1 font-semibold mb-4">
          Popular destinations
        </p>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          {QUICK_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-brand-accent hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
