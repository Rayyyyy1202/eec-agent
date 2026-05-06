import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scheduled maintenance',
  description: 'We are performing scheduled maintenance and will be back shortly.',
  robots: { index: false, follow: false }
};

export default function MaintenancePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <p className="text-xs uppercase tracking-widest text-brand-accent font-semibold mb-4">
        Scheduled maintenance
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
        We&rsquo;ll be right back.
      </h1>
      <p className="text-brand-neutral-1 leading-relaxed mb-8">
        We&rsquo;re performing planned maintenance to make the site faster.
        This usually takes 15–30 minutes. Existing orders are not affected.
      </p>
      <div className="border border-brand-neutral-3 rounded-lg p-6 bg-white text-left text-sm">
        <p className="font-semibold mb-2">Need help right now?</p>
        <ul className="space-y-1 text-brand-neutral-1">
          <li>
            Email <a href="mailto:support@roborock-mock.com" className="text-brand-accent hover:underline">support@roborock-mock.com</a>
          </li>
          <li>Existing orders ship and track on the original schedule.</li>
        </ul>
      </div>
    </div>
  );
}
