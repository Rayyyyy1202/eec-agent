import Link from 'next/link';
import SmartImage from '@/components/SmartImage';
import ProductCard from '@/components/ProductCard';
import UgcCarousel from '@/components/UgcCarousel';
import { SKUS } from '@/lib/products';

export const metadata = {
  title: 'Roborock — Lidar-Mapped Robot Vacuums',
  description: "Robot vacuums engineered for the messy weeks, not the showroom. Lidar mapping, anti-tangle brush, auto-washing dock. Free shipping in the US."
};

export default function HomePage() {
  return (
    <div>
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4">
            Cleaning, perfected — so you don&apos;t have to.
          </h1>
          <p className="text-lg text-brand-neutral-1 mb-6 leading-relaxed">
            Lidar-mapped. Anti-tangle. Auto-washing. The robot vacuum that earns its place in your home.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/products/roborock-s-series-pro" className="btn-accent">
              Shop S-Series Pro
            </Link>
            <Link href="/collections/all" className="btn-outline">
              See all robots
            </Link>
          </div>
          <p className="mt-6 text-sm text-brand-neutral-1 opacity-80">
            Free shipping in the US · 60-day returns · 2-year warranty
          </p>
        </div>
        <SmartImage
          assetId="asset_001"
          ratio="4:5"
          variant="navy"
          label="HERO · S-Series Pro in dock"
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
        />
      </section>

      <section className="bg-white border-y border-brand-neutral-3 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display text-2xl font-semibold mb-6">Built different — measurably.</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { h: '10,000 Pa', s: 'Twice the suction of "premium" competitors.' },
              { h: 'V-shape brush', s: '12 weeks of golden retriever, zero brush cleanings.' },
              { h: 'Auto-wash dock', s: 'Mops itself between rooms. You don&apos;t even watch.' }
            ].map((f, i) => (
              <div key={i} className="p-5 border border-brand-neutral-3 rounded-lg">
                <div className="text-2xl font-semibold mb-2 text-brand-accent">{f.h}</div>
                <p className="text-sm text-brand-neutral-1" dangerouslySetInnerHTML={{ __html: f.s }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl font-semibold">Pick your robot.</h2>
          <Link href="/collections/all" className="text-sm font-medium hover:text-brand-accent transition">See all →</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {SKUS.map((sku) => <ProductCard key={sku.id} sku={sku} />)}
        </div>
      </section>

      <UgcCarousel />

      <section className="bg-brand-primary text-brand-secondary py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-xl md:text-2xl font-display leading-relaxed">
            &ldquo;Three robots in two years. The first one that actually doesn&apos;t get stuck.&rdquo;
          </p>
          <p className="mt-4 text-sm opacity-70">— Sarah, pet parent (verified review)</p>
        </div>
      </section>
    </div>
  );
}
