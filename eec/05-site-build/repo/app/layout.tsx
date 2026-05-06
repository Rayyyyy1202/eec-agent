import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrustBar from '@/components/TrustBar';
import ConsentBanner from '@/components/ConsentBanner';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Roborock — Lidar-Mapped Robot Vacuums', template: '%s | Roborock' },
  description: "Robot vacuums engineered for the messy weeks, not the showroom. Lidar mapping, anti-tangle brush, auto-washing dock.",
  openGraph: { type: 'website', siteName: 'Roborock' }
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Roborock',
  url: SITE_URL,
  logo: `${SITE_URL}/og/logo.png`,
  sameAs: ['https://www.instagram.com/roborock_us', 'https://www.tiktok.com/@roborock_us']
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <head>
        {/* Consent Mode v2 default-denied — MUST fire before GTM, per eec-06-tracking */}
        <Script id="consent-default" strategy="beforeInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            ad_storage: 'denied',
            analytics_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            functionality_storage: 'granted',
            wait_for_update: 500
          });
        `}</Script>
        {GTM_ID && (
          <Script id="gtm" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');
          `}</Script>
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </head>
      <body>
        {GTM_ID && (
          <noscript>
            <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
          </noscript>
        )}
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <TrustBar />
        <Footer />
        <ConsentBanner />
      </body>
    </html>
  );
}
