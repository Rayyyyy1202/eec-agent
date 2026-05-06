import type { Metadata } from 'next';
import HelpNav from '@/components/HelpNav';

export const metadata: Metadata = {
  title: 'Help Center — Setup, Maps, Troubleshooting',
  description: "Setup guides, app troubleshooting, replacement parts. Reply to any email and we'll help."
};

const FAQ = [
  {
    q: 'How do I set up my Roborock the first time?',
    a: 'Plug the dock into a wall outlet against a flat wall with 1m clearance on each side. Open the Roborock app, scan the QR code on the robot, and follow the in-app pairing flow. First map takes ~25 minutes — let it finish before starting a clean.'
  },
  {
    q: 'Why does my robot keep getting stuck?',
    a: 'Most stuck-ups are: cable spaghetti under desks, dark or high-pile rugs (cliff-sensor false-positive), 1.5cm threshold strips, or chair legs in the under-3cm clearance zone. See our full troubleshooting article for the seven common causes.'
  },
  {
    q: 'How often should I replace the brush, filter, and mop pads?',
    a: 'Filter: 60–90 days (30–45 with pets). Main brush: 6–12 months. Side brushes: 3–6 months. Mop pads: every 50 washes or when fraying. Our 6-month replenish kit covers all of it on schedule.'
  },
  {
    q: 'My app says "device offline" — what now?',
    a: "Check that the robot is on 2.4GHz Wi-Fi (not 5GHz). Restart the dock by holding the power button for 10 seconds. If still offline, factory-reset (hold home + dock for 8 seconds) and re-pair."
  },
  {
    q: 'Will the auto-mop work on my carpet?',
    a: 'The S-Series Pro lifts mop pads 10mm when wheels detect carpet, so it dry-vacuums carpet and only mops hard floors. The E-Series uses a vibrating mop without auto-lift — you would manually remove the mop module before carpet rooms.'
  },
  {
    q: 'What is the return policy?',
    a: '60 days from delivery for robots, 30 days for accessories. Original packaging not required. Refund processed within 5 business days of receipt.'
  }
];

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a }
  }))
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Help', item: `${SITE_URL}/help` }
  ]
};

export default function HelpPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">Help center</h1>
        <p className="text-brand-neutral-1 mb-2 leading-relaxed">
          Setup guides, app troubleshooting, replacement parts. Stuck? Reply to any of our emails and a human will help — usually within an hour.
        </p>
        <HelpNav active="/help" />
        <h2 className="font-display text-xl font-bold mb-4">Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQ.map((item, i) => (
            <details key={i} className="border border-brand-neutral-3 rounded-lg p-5 bg-white group">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                {item.q}
                <span className="text-brand-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-brand-neutral-1 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
