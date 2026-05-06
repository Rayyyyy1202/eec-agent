import Link from 'next/link';
import SmartImage from '@/components/SmartImage';
import WaitlistForm from '@/components/WaitlistForm';
import type { Sku } from '@/lib/products';

const variantBySku: Record<string, 'navy' | 'orange' | 'cream'> = {
  sku_001: 'navy',
  sku_002: 'cream',
  sku_003: 'orange'
};

function fmtCountdown(launchDate?: string): string | null {
  if (!launchDate) return null;
  const target = new Date(`${launchDate}T00:00:00Z`).getTime();
  if (Number.isNaN(target)) return null;
  const days = Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Launching today';
  if (days === 1) return 'Launches tomorrow';
  return `Launches in ${days} days`;
}

function fmtDateLong(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

export default function ComingSoonTemplate({ sku }: { sku: Sku }) {
  const countdown = fmtCountdown(sku.launchDate);
  const launchPretty = fmtDateLong(sku.launchDate);
  const variant = variantBySku[sku.id] ?? 'navy';

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <nav className="text-xs text-brand-neutral-1 mb-6 flex gap-2">
        <Link href="/" className="hover:underline">Home</Link><span>/</span>
        <Link href="/collections/all" className="hover:underline">Shop</Link><span>/</span>
        <span>{sku.shortName}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10 items-start">
        <div>
          <SmartImage
            assetId={`waitlist_${sku.id}`}
            alt={`${sku.name} — coming soon`}
            ratio="4:5"
            variant={variant}
            label={`${sku.shortName} — coming soon`}
            sizes="(min-width: 768px) 50vw, 100vw"
            priority
          />
        </div>

        <div>
          <span className="inline-block text-[11px] uppercase tracking-widest font-semibold text-brand-accent border border-brand-accent rounded-full px-3 py-1 mb-4">
            {countdown ?? 'Coming soon'}
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3 leading-tight">
            {sku.name}
          </h1>
          <p className="text-brand-neutral-1 leading-relaxed mb-6">{sku.description}</p>

          {launchPretty && (
            <p className="text-sm text-brand-primary mb-6">
              <span className="font-semibold">Launch date:</span> {launchPretty}
            </p>
          )}

          <ul className="space-y-2 mb-8">
            {sku.features.slice(0, 5).map((f) => (
              <li key={f} className="flex gap-2 text-sm">
                <span className="text-brand-accent">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <WaitlistForm sku={sku} />

          <p className="text-xs text-brand-neutral-1 mt-4">
            Pre-order pricing locks at <span className="font-semibold">${sku.price.amount.toLocaleString()} {sku.price.currency}</span>.
            No charge today — we&rsquo;ll email a checkout link when units ship.
          </p>

          <div className="mt-8 pt-6 border-t border-brand-neutral-3 text-sm">
            <p className="text-brand-neutral-1 mb-2">Looking for something today?</p>
            <Link href="/collections/all" className="text-brand-accent hover:underline font-semibold">
              See what&rsquo;s in stock now →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
