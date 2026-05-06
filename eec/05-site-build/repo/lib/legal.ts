// Mirrors eec/03b-legal-pack/output.json. Loaded by app/pages/[slug]/page.tsx + Footer Legal column.
// When 03b skill re-runs, the values here change but the shape stays stable.

export type CookieCategory = {
  id: 'strictly_necessary' | 'functional' | 'analytics' | 'marketing' | 'personalization';
  label: string;
  purpose: string;
  defaultState: 'granted' | 'denied';
  examples: string[];
  retentionDays?: number;
};

export type AccessibilityKnownIssue = { description: string; remediationEta: string };

export type WarrantyPerSku = {
  skuId: string;
  durationMonths: number;
  covers: string[];
  excludes: string[];
  transferable: boolean;
};

export type FooterLink = { label: string; routePath: string };

export type LegalDoc = {
  slug: string;
  title: string;
  description: string;
  bodyMd: string;
};

export const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'strictly_necessary',
    label: 'Strictly necessary',
    purpose:
      'Required for the site to function: maintaining your shopping cart, keeping you signed in, and protecting against cross-site request forgery. These cannot be disabled.',
    defaultState: 'granted',
    examples: ['session_id', 'csrf_token', 'cart_v1'],
    retentionDays: 30
  },
  {
    id: 'functional',
    label: 'Functional',
    purpose:
      'Remember your preferences across visits — currency, language, saved wishlist, last-viewed product. Disabling these still lets you shop, but the site forgets your preferences each visit.',
    defaultState: 'granted',
    examples: ['roborock_wishlist_v2', 'currency_pref'],
    retentionDays: 365
  },
  {
    id: 'analytics',
    label: 'Analytics',
    purpose:
      'Help us understand which pages and products people use, so we can fix what is broken and build what is missing. We use Google Analytics 4 with IP anonymization. No raw IP is stored.',
    defaultState: 'denied',
    examples: ['_ga', '_ga_*', '_gid'],
    retentionDays: 730
  },
  {
    id: 'marketing',
    label: 'Marketing',
    purpose:
      'Show you Roborock ads on Meta, TikTok, and Google after you have visited our site. We share hashed (SHA-256) email and phone with these networks for matching — never the raw values.',
    defaultState: 'denied',
    examples: ['_fbp', '_ttp', '_gcl_au'],
    retentionDays: 365
  },
  {
    id: 'personalization',
    label: 'Personalization',
    purpose:
      'Tailor the homepage hero and product recommendations to what you have looked at. Disabling these means you see the default catalog ordering.',
    defaultState: 'denied',
    examples: ['reco_seed', 'ab_variant'],
    retentionDays: 90
  }
];

export const ACCESSIBILITY = {
  wcagLevel: 'AA' as const,
  wcagVersion: '2.2',
  axeScore: { pass: 142, violations: 3, measuredAt: '2026-04-15' },
  conformanceStatus: 'partial' as 'full' | 'partial' | 'non_compliant',
  knownIssues: [
    {
      description:
        'Cookie consent banner color contrast on hover state falls below 4.5:1 against the brand-secondary background — affects WCAG 1.4.3.',
      remediationEta: '2026-05-30'
    },
    {
      description:
        'Product gallery thumbnails lack visible focus indicator when tabbed in Safari 17 — affects WCAG 2.4.7.',
      remediationEta: '2026-05-15'
    },
    {
      description:
        'Footer newsletter form input does not announce error state to NVDA screen reader on submit failure — affects WCAG 4.1.3.',
      remediationEta: '2026-06-15'
    }
  ] as AccessibilityKnownIssue[],
  contactEmail: 'accessibility@roborock.us'
};

export const CCPA_DO_NOT_SELL = {
  routePath: '/pages/ccpa-do-not-sell',
  headerLabel: 'Do Not Sell My Info',
  footerLabel: 'Do Not Sell My Info'
};

export const WARRANTY_PER_SKU: WarrantyPerSku[] = [
  {
    skuId: 'sku_001',
    durationMonths: 24,
    covers: [
      'Manufacturing defects in materials and workmanship',
      'Motor and drive train failure under normal use',
      'Lidar sensor and navigation camera failure',
      'Battery capacity below 70% of rated capacity within warranty period',
      'Charging dock electronic failure'
    ],
    excludes: [
      'Accidental physical damage (drops, impacts, liquid spills)',
      'Damage from operating outside designed surfaces (wet floors, outdoor use, stairs)',
      'Consumables (brushes, filters, mop pads, dustbin liners)',
      'Damage from non-OEM parts or unauthorized service',
      'Cosmetic wear (scratches, scuffs) that does not affect function',
      'Lidar / camera lens damage from misuse (e.g., spraying with cleaner)',
      'Normal wear and tear'
    ],
    transferable: false
  },
  {
    skuId: 'sku_002',
    durationMonths: 24,
    covers: [
      'Manufacturing defects in materials and workmanship',
      'Motor and drive train failure under normal use',
      'Battery capacity below 70% of rated capacity within warranty period',
      'Charging dock electronic failure'
    ],
    excludes: [
      'Accidental physical damage',
      'Damage from operating outside designed surfaces',
      'Consumables (brushes, filters, dustbin liners)',
      'Damage from non-OEM parts or unauthorized service',
      'Cosmetic wear that does not affect function',
      'Normal wear and tear'
    ],
    transferable: false
  },
  {
    skuId: 'sku_003',
    durationMonths: 3,
    covers: ['Manufacturing defects in materials and workmanship (filter tearing, brush bristle loss in first month)'],
    excludes: [
      'Normal consumption — these are consumables and degrade with use',
      'Damage from cleaning with cleaners other than water',
      'Use beyond the recommended replacement interval (~6 months)'
    ],
    transferable: true
  }
];

export const FOOTER_LEGAL: { heading: string; links: FooterLink[] } = {
  heading: 'Legal',
  links: [
    { label: 'Privacy Notice', routePath: '/pages/privacy' },
    { label: 'Terms of Service', routePath: '/pages/terms' },
    { label: 'Cookies', routePath: '/pages/cookies' },
    { label: 'Accessibility', routePath: '/pages/accessibility' },
    { label: 'Do Not Sell My Info', routePath: '/pages/ccpa-do-not-sell' },
    { label: 'Prop 65 Warning', routePath: '/pages/prop65' },
    { label: 'Warranty', routePath: '/pages/warranty' },
    { label: 'GDPR Data Request', routePath: '/pages/gdpr-data-request' },
    { label: 'DMCA', routePath: '/pages/dmca' }
  ]
};

// All 9 routes the [slug] page needs to render. Existing /pages/privacy + /terms +
// /shipping-returns are absorbed here so there's a single source of truth.
export const LEGAL_DOCS: Record<string, LegalDoc> = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy Notice',
    description: 'How Roborock collects, uses, and protects your data.',
    bodyMd: `# Privacy Notice

**Effective: 2026-04-22.**

Roborock Inc. ("Roborock", "we", "us") respects your privacy. This notice explains what we collect, why, and your choices.

## What we collect

- **You give us**: name, email, shipping address, billing address, order history.
- **Your browser sends us**: IP address (anonymized for analytics), pages visited, items viewed.
- **Payment data**: handled by Stripe — we never store full card numbers.

## How we use it

- Ship your orders and answer support emails.
- Send transactional emails (order confirmations, shipping updates).
- Improve the site and product based on aggregate usage.
- Run advertising — but only after you opt in via the cookie banner.

## Sharing

When you opt in to marketing cookies, we share **hashed (SHA-256)** email and phone with Meta, TikTok, and Google for ad matching. We never share raw values.

We use the following processors:

- **Stripe** — payments
- **Shippo** — carrier label generation
- **Google Analytics 4** — analytics (only after consent)
- **Klaviyo** — email marketing (only if you sign up)

## Your rights

- Access, correct, delete, or export your data.
- Opt out of advertising cookies any time via the **Cookie Settings** link in the footer.
- California residents: see [CCPA disclosure](/pages/ccpa-do-not-sell) for additional rights.
- EU/UK residents: see [GDPR data request](/pages/gdpr-data-request) for the GDPR-specific path.

## Retention

- **Order data**: 7 years (tax / accounting requirement)
- **Marketing email list**: until you unsubscribe
- **Analytics data**: 26 months (GA4 default)
- **Support tickets**: 3 years after resolution

## Contact

Email **privacy@roborock.us** — replies within 7 business days for general questions, 45 days for CCPA requests, 30 days for GDPR requests.`
  },
  terms: {
    slug: 'terms',
    title: 'Terms of Service',
    description: 'The rules for using roborock.us.',
    bodyMd: `# Terms of Service

**Effective: 2026-04-22.**

By using roborock.us, you agree to these terms.

## Orders

- Orders are subject to product availability and our right to refuse service for any reason permitted by law.
- Prices are in USD and exclude taxes. Sales tax is calculated at checkout based on your shipping address.
- Promotional codes have specific terms (minimum spend, single use, etc.) shown at checkout.

## Returns

- **Robots (sku_001, sku_002)**: 60 days from delivery, no questions asked. Reply to your order confirmation with "return" — we email a prepaid label.
- **Accessories / consumables (sku_003)**: 30 days, unopened only.
- Refund timing: 5 business days from when the return arrives at our warehouse.

## Warranty

See the [full warranty terms](/pages/warranty). Summary: **24 months** on robots, **3 months** on the Replenish Kit (defects only).

## Limitation of liability

To the extent permitted by law, our liability is capped at the amount you paid for the product.

## Governing law

These terms are governed by California law. Disputes are resolved in the courts of Santa Clara County, CA, except where you have a non-waivable right to arbitration or small claims.

## Changes

We may update these terms. Material changes will be posted to this page with the new effective date.`
  },
  cookies: {
    slug: 'cookies',
    title: 'Cookie Policy',
    description: 'What cookies we use and how you control them.',
    bodyMd: `# Cookie Policy

**Effective: 2026-04-22.**

This Cookie Policy explains how Roborock uses cookies on roborock.us. It complements our [Privacy Notice](/pages/privacy).

## What is a cookie?

A cookie is a small text file your browser stores when you visit a website. It lets the site remember things — that you are signed in, that your cart has 2 items, that your preferred language is English.

## How we use cookies

We group cookies into 5 categories. **Strictly necessary** and **functional** cookies are on by default. **Analytics**, **marketing**, and **personalization** are **off by default** and only turn on if you opt in via the cookie banner.

You can change your choices any time using the **Cookie Settings** link in the footer.

## Categories

| Category | Default | Examples | Retention |
|---|---|---|---|
| Strictly necessary | On | session_id, csrf_token, cart_v1 | 30 days |
| Functional | On | wishlist, currency_pref | 365 days |
| Analytics | Off | _ga, _gid (Google Analytics 4) | 730 days |
| Marketing | Off | _fbp (Meta), _ttp (TikTok), _gcl_au (Google Ads) | 365 days |
| Personalization | Off | reco_seed, ab_variant | 90 days |

## Third parties

When you opt in to analytics or marketing, the following third parties may receive data:

- **Google** (Analytics + Ads) — https://policies.google.com/privacy
- **Meta** (Facebook + Instagram) — https://www.facebook.com/policy.php
- **TikTok** — https://www.tiktok.com/legal/privacy-policy
- **Stripe** (always on, strictly necessary) — https://stripe.com/privacy

For marketing cookies, any email address or phone number we share is hashed with **SHA-256** before transmission.

## Contact

Questions? Email **privacy@roborock.us** and we respond within 7 business days.`
  },
  accessibility: {
    slug: 'accessibility',
    title: 'Accessibility Statement',
    description: 'Our commitment to WCAG 2.2 Level AA conformance.',
    bodyMd: `# Accessibility Statement

Roborock is committed to making roborock.us usable by everyone, including people with disabilities. We aim to conform to **WCAG 2.2 at Level AA**.

## Current status: partial conformance

Last tested **2026-04-15** using axe-core, manual keyboard navigation, and spot checks with NVDA (Windows) and VoiceOver (macOS).

- ✅ **142 automated checks pass**
- ⚠️ **3 violations identified** (listed below with remediation dates)

## Known issues and fix dates

1. **Cookie banner contrast on hover** — color contrast falls below 4.5:1. Fix by **2026-05-30**.
2. **Gallery focus indicator in Safari** — visible focus ring disappears for product thumbnails in Safari 17. Fix by **2026-05-15**.
3. **Newsletter form error announcement** — NVDA does not announce "invalid email" errors. Fix by **2026-06-15**.

## How we test

- **Automated**: \`axe-core\` runs in CI on every PR.
- **Manual**: keyboard-only navigation across all routes monthly.
- **Assistive tech**: NVDA + VoiceOver spot-checks on cart, checkout, and PDP routes quarterly.

## Need help right now?

If you encounter a barrier, email **accessibility@roborock.us** or call our support line. We respond within **5 business days** and can take orders by phone or email if the site is not working for you.

## Alternative formats

Product manuals are available in large-print PDF and audio narration on request. Email accessibility@roborock.us with the SKU and your preferred format.

## Standards

This statement is prepared in accordance with W3C WCAG-EM and the U.S. Department of Justice's interpretive guidance on web accessibility under the ADA.`
  },
  'ccpa-do-not-sell': {
    slug: 'ccpa-do-not-sell',
    title: 'Do Not Sell or Share My Personal Information',
    description: 'Your CCPA / CPRA rights as a California resident.',
    bodyMd: `# Do Not Sell or Share My Personal Information

**Effective: 2026-04-22.**

This page applies to **California residents** under the California Consumer Privacy Act (CCPA / CPRA).

## Opt out right now

To opt out of "sale" or "sharing" of your personal information for cross-context behavioral advertising:

1. Click **Reject all** in the cookie banner (or in **Cookie Settings** in the footer).
2. Submit a verifiable consumer request by emailing **privacy@roborock.us** with subject line **"CCPA Opt-Out"** and the email address associated with your account.

We honor opt-outs within **15 days** and apply them across all devices linked to your email.

## What we collect (last 12 months)

- **Identifiers**: name, email, shipping/billing address, IP address.
- **Commercial information**: order history, items viewed, items added to cart.
- **Internet activity**: pages visited, search terms, time on site.
- **Geolocation**: approximate location from IP — never precise GPS.
- **Inferences**: product affinity, household-type categorization.

We do **not** collect biometric data, sensory information, professional or employment data, or sensitive personal information categories defined by CPRA.

## Who we share with

- **Google** — Analytics + advertising. Hashed email/phone only.
- **Meta** — Advertising. Hashed email/phone only.
- **TikTok** — Advertising. Hashed email/phone only.
- **Stripe** — Payment processing. Name + billing address.
- **Shippo** — Carrier rate quoting and label generation. Name + shipping address.

## Your CCPA / CPRA rights

You have the right to:

1. **Know** what personal information we have about you.
2. **Delete** personal information we have collected.
3. **Correct** inaccurate personal information.
4. **Opt out** of "sale" or "sharing" for cross-context behavioral advertising.
5. **Limit** the use of sensitive personal information (we do not collect sensitive PI in the CPRA sense).
6. **Non-discrimination** — we will not deny you service or charge a different price if you exercise these rights.

## How to exercise

Email **privacy@roborock.us** with subject line **"CCPA Request"**. We respond within **45 days**.

## Authorized agents

You may designate an authorized agent. The agent must provide written permission signed by you, plus government-issued ID. We may verify directly with you before fulfilling.

## Contact

**privacy@roborock.us**`
  },
  prop65: {
    slug: 'prop65',
    title: 'California Proposition 65 Warning',
    description: 'Required disclosure for California consumers.',
    bodyMd: `# California Proposition 65 Warning

## ⚠️ WARNING

> This product can expose you to chemicals including **Bisphenol A (BPA)** and **Di(2-ethylhexyl) phthalate (DEHP)**, which are known to the State of California to cause cancer and birth defects or other reproductive harm. For more information go to **[www.P65Warnings.ca.gov](https://www.p65warnings.ca.gov)**.

## What this means

California's Proposition 65 requires businesses that sell products in California to warn customers about exposure to any of approximately 900 listed chemicals. Many of these chemicals are present in everyday products at levels well below what poses a health risk, but the warning is still required by California law.

## Specifically in our products

- **BPA**: present in trace amounts in the polycarbonate plastic of the charging dock housing on **sku_001 (S-Series Pro)** and **sku_002 (E-Series Essential)**. Exposure route: incidental skin contact when handling the dock. Estimated exposure is **below the No Significant Risk Level (NSRL)** for cancer and below the Maximum Allowable Daily Level (MADL) for reproductive harm under typical use.
- **DEHP**: present in the flexible PVC insulation of the AC charging cable on the same SKUs. Exposure route: skin contact when plugging in / unplugging the cable. Estimated exposure is **below the NSRL and MADL** under typical use.

## What is *not* affected

- **sku_003 (Replenish Kit)** does not contain any Prop 65 listed chemicals at reportable levels — no warning required.
- The robot bodies themselves do not contain Prop 65 listed chemicals at reportable levels.

## How to reduce exposure

- Wash hands after handling the charging dock or cable, particularly before eating.
- Avoid prolonged skin contact with the charging cable.
- Keep the charging assembly out of reach of small children and pets.

## More information

- California OEHHA: https://www.p65warnings.ca.gov/products/consumer-products
- BPA fact sheet: https://www.p65warnings.ca.gov/fact-sheets/bisphenol-bpa
- DEHP fact sheet: https://www.p65warnings.ca.gov/fact-sheets/di-2-ethylhexylphthalate-dehp

This warning is reviewed annually. Last review: 2026-04-22.`
  },
  warranty: {
    slug: 'warranty',
    title: 'Roborock Limited Warranty',
    description: '24 months on robots, 3 months on consumables. How to make a claim.',
    bodyMd: `# Roborock Limited Warranty

**Effective: 2026-04-22.**

Roborock Inc. warrants its products against defects in materials and workmanship under normal use for the periods stated below.

## Warranty periods

| Product | SKU | Warranty | Transferable |
|---|---|---|---|
| S-Series Pro robot vacuum + mop | sku_001 | **24 months** from delivery | No (original purchaser only) |
| E-Series Essential robot vacuum | sku_002 | **24 months** from delivery | No (original purchaser only) |
| Replenish Kit (consumables) | sku_003 | **3 months** from delivery (defects only) | Yes |

## What is covered

- Manufacturing defects in materials and workmanship
- Motor and drive train failure under normal use
- Lidar / navigation sensor failure (sku_001 only)
- Battery degradation below 70% of rated capacity within the warranty period
- Charging dock electronic failure

## What is not covered

- Accidental damage, drops, impacts, liquid spills (other than designed mop function)
- Operating outside designed surfaces (wet floors not on mop mode, outdoor use, falls down stairs)
- Consumables: brushes, filters, mop pads, dustbin liners
- Damage from non-OEM parts or unauthorized service
- Cosmetic wear that does not affect function
- Normal wear and tear

## How to make a warranty claim

1. **Email warranty@roborock.us** with: order number, SKU, photo or 30-second video showing the defect, brief description, and your shipping address.
2. **We reply within 3 business days** with a Return Merchandise Authorization (RMA) number and a prepaid UPS shipping label.
3. **Pack and ship** — no original box required for the robots. Tape the RMA to the outside.
4. **We inspect within 5 business days** of receipt.
5. **If covered**: a replacement unit ships within 7 business days, or you can request a full refund.
6. **If not covered**: we email you with the inspection result and an optional repair quote.

## Limitation of liability

In no event shall Roborock's liability exceed the amount you paid for the product, except where prohibited by law.

## State law

This warranty gives you specific legal rights, and you may also have other rights that vary from state to state.

## Contact

**warranty@roborock.us** — typical response within 3 business days.`
  },
  'gdpr-data-request': {
    slug: 'gdpr-data-request',
    title: 'GDPR Data Request',
    description: 'How EU/UK residents can exercise their GDPR rights.',
    bodyMd: `# GDPR Data Request

This page applies to residents of the **European Union**, **United Kingdom**, and other jurisdictions that have adopted GDPR-equivalent rules.

## Your rights under GDPR

You have the right to:

1. **Access** — request a copy of your personal data we hold.
2. **Rectification** — correct inaccurate data.
3. **Erasure** ("right to be forgotten") — delete your data, subject to legal retention requirements (e.g., tax records).
4. **Restriction** — limit how we process your data.
5. **Portability** — receive your data in a machine-readable format.
6. **Object** — object to processing, including for direct marketing.
7. **Withdraw consent** — for processing based on consent (e.g., marketing emails) at any time.

## How to make a request

Email **privacy@roborock.us** with subject line **"GDPR Request"** and:

- Your full name and email address on file
- A description of which right you wish to exercise
- Verification (we may ask for a recent order number or sign-in)

We respond within **30 days** (the GDPR statutory maximum). Complex requests may be extended by up to 60 additional days with written notice to you.

## Data protection contact

- **Email**: privacy@roborock.us
- **DPO**: Not formally designated — Roborock controller acts as data protection contact.

## Supervisory authority

We do not have an EU establishment. EU/UK residents may file complaints with their **local supervisory authority** (e.g., ICO in the UK, CNIL in France, Datatilsynet in Denmark). We cooperate with all EU supervisory authorities.

## Lawful bases

We process your data under the following GDPR Article 6 lawful bases:

- **Contract performance** — to fulfill your orders.
- **Legitimate interest** — to improve the site and run targeted advertising (you can object).
- **Consent** — for marketing emails and non-essential cookies (you can withdraw at any time).
- **Legal obligation** — for tax, accounting, and consumer protection records.

## International transfers

Your data is hosted in the United States. Transfers from the EU/UK are made under the **EU-US Data Privacy Framework** and **UK Extension** to the DPF. A copy of our Standard Contractual Clauses is available on request.`
  },
  dmca: {
    slug: 'dmca',
    title: 'DMCA Notice',
    description: 'Designated agent for copyright infringement notices.',
    bodyMd: `# DMCA Notice and Designated Agent

Roborock respects intellectual property rights. If you believe content on roborock.us infringes your copyright, please send a DMCA-compliant notice to our designated agent.

## Designated Agent

- **Name**: Roborock Inc., DMCA Designated Agent
- **Email**: dmca@roborock.us
- **Address**: 100 Roborock Way, Mountain View, CA 94043, United States
- **Phone**: +1 (650) 555-0142

This information is also registered with the U.S. Copyright Office under 17 U.S.C. § 512(c)(2).

## What to include in a DMCA notice

A valid DMCA notice must include:

1. A physical or electronic signature of the copyright owner (or a person authorized to act on their behalf).
2. Identification of the copyrighted work claimed to be infringed.
3. Identification of the material on roborock.us that is alleged to infringe, with sufficient detail to locate it (URL preferred).
4. Your contact information (name, address, phone, email).
5. A statement that you have a good-faith belief that the use is not authorized.
6. A statement, under penalty of perjury, that the information is accurate and that you are authorized to act for the copyright owner.

## Counter-notice

If you believe content was removed in error, you may submit a counter-notice including:

1. Your physical or electronic signature.
2. Identification of the removed content and the location it appeared.
3. A statement, under penalty of perjury, that you have a good-faith belief the content was removed by mistake or misidentification.
4. Your contact information and a statement consenting to the jurisdiction of the U.S. District Court for the Northern District of California.

## Repeat infringer policy

We terminate accounts of users who are repeat infringers in accordance with 17 U.S.C. § 512(i).`
  },
  'shipping-returns': {
    slug: 'shipping-returns',
    title: 'Shipping & Returns',
    description: 'Free US shipping. 60-day no-questions returns on robots.',
    bodyMd: `# Shipping & Returns

## Shipping

- **Free standard ground** in the contiguous US (3–5 business days).
- **Hawaii and Alaska**: add $25.
- **Same-day cutoff**: 2pm PT.
- **Tracking**: every order gets a tracking number by email within 24 hours.

## Returns on robots (sku_001, sku_002)

- **60 days** from delivery — no questions asked.
- Reply to your order confirmation email with **"return"** — we email a prepaid label.
- Original packaging is **not** required.

## Returns on accessories (sku_003 Replenish Kit)

- **30 days**, **unopened only**.

## Refund timing

- **5 business days** from when the return arrives at our warehouse.
- Refunded to original payment method.

## Damaged on arrival?

Email **support@roborock.us** within 7 days with a photo. We ship a replacement same-day.

## Lost in transit?

If tracking shows no movement for 7+ days, email **support@roborock.us**. We file the claim with the carrier and ship a replacement immediately — you do nothing.`
  }
};

export function getLegalDoc(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS[slug];
}

export function getAllLegalSlugs(): string[] {
  return Object.keys(LEGAL_DOCS);
}
