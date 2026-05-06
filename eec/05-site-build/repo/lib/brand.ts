// Mirrors eec/03-brand-identity/output.json. Inline so 05's repo stays self-contained
// and Server Components can render at build time without filesystem access.
// Re-source from JSON when 03 schema stabilizes.

export type Founder = {
  id: string;
  name: string;
  role: string;
  bio: string;
  quote?: string;
  linkedinUrl?: string;
  photoAssetId?: string;
};

export type Value = {
  id: string;
  title: string;
  body: string;
};

export type SustainabilityPillar = {
  title: string;
  body: string;
  metric?: string;
};

export type SustainabilityStatement = {
  summary?: string;
  pillars: SustainabilityPillar[];
  certificationsReferenced?: string[];
  reportUrl?: string;
};

export type Certification = {
  name: string;
  issuedBy: string;
  url?: string;
  scope?: string;
};

export type PressMention = {
  outlet: string;
  headline: string;
  url: string;
  publishedAt: string;
  pullQuote?: string;
};

export type Award = {
  name: string;
  year: number;
  body: string;
  category?: string;
  url?: string;
};

export type TimelineEntry = {
  year: number;
  milestone: string;
};

export const BRAND = {
  name: 'Roborock',
  handle: 'roborock_us',
  tagline: 'Cleaning, perfected — so you don’t have to.',
  mission:
    'Free people from the cycle of cleaning so they can spend that time with the things — and people — they love.',
  storyShort:
    'Roborock was started by engineers who got tired of the gap between robot-vacuum marketing and reality. We obsessed over the brushes that wrap pet hair, the maps that lose track on day three, and the mops that just push dirt around. Today our lidar-mapped, auto-washing, pet-hair-eating robots do the cleaning so you get your evenings back.'
} as const;

export const FOUNDERS: Founder[] = [
  {
    id: 'founder_001',
    name: 'Richard Chang',
    role: 'Co-founder & CEO',
    bio: 'Spent eight years at iRobot before getting fed up with the gap between what robot vacuums claimed and what they actually did in his own apartment with two cats. Started Roborock in 2014 to build the robot he wanted to own. Still does the weekly hardware review himself.',
    quote:
      'If a number isn’t on our spec sheet, it’s because we couldn’t prove it in a real living room.',
    linkedinUrl: 'https://www.linkedin.com/in/richard-chang-roborock-example'
  },
  {
    id: 'founder_002',
    name: 'Mei Lin',
    role: 'Co-founder & CTO',
    bio: 'PhD in robotics from CMU. Led the SLAM team at a self-driving company before realizing the same lidar techniques could solve the boring problem of mapping a one-bedroom flat. Owns the entire navigation stack at Roborock.',
    quote: 'Lidar is just one sensor. Knowing what to ignore is the actual work.'
  },
  {
    id: 'founder_003',
    name: 'Daniel Wei',
    role: 'Head of Customer',
    bio: 'Joined in 2017 from a DTC mattress brand to make sure support stayed something a human did. Personally answers the first 50 escalations every week. Set the policy that we replace anything that breaks in year one, no questions.',
    quote: 'Returns aren’t a cost center. They’re the cheapest market research we get.'
  }
];

export const VALUES: Value[] = [
  {
    id: 'value_001',
    title: 'Measure twice, claim once',
    body: 'Every spec on every product page comes from a test in a real living room with real pet hair. If we couldn’t measure it, we don’t say it.'
  },
  {
    id: 'value_002',
    title: 'Engineered for the messy weeks',
    body: 'We design for the third week with a shedding golden retriever, not the showroom photo on day one. The boring case is the case that matters.'
  },
  {
    id: 'value_003',
    title: 'A human answers',
    body: 'Every support email gets a human reply, usually within the hour. No chat-bots that loop you. No “per our policy” deflection.'
  },
  {
    id: 'value_004',
    title: 'We sell the part',
    body: 'Two-year warranty on robots, 90-day on accessories. After that we sell every part — brushes, filters, mop pads, batteries. Throwaway tech is not a clean home.'
  },
  {
    id: 'value_005',
    title: 'Quiet on principle',
    body: 'No revolutionary AI. No game-changing breakthroughs. We do the unglamorous work of making the same thing 5% better every quarter. The cumulative compound is the product.'
  }
];

export const SUSTAINABILITY: SustainabilityStatement = {
  summary:
    'We build robots designed to last and ship the parts to keep them running. The most sustainable robot vacuum is the one you don’t replace.',
  pillars: [
    {
      title: 'Repairable by design',
      body: 'Every consumable (brush, filter, mop pad, battery) is sold separately and field-replaceable with a screwdriver. We publish the manuals.',
      metric: '100% of consumable parts available for purchase ≥ 5 years post-launch'
    },
    {
      title: 'Recycled aluminum housing',
      body: 'The S-Series Pro chassis is 60% post-consumer recycled aluminum, FSC-certified packaging.',
      metric: '60% PCR aluminum (verified via UL ECVP)'
    },
    {
      title: 'Battery take-back',
      body: 'Mail us your dead lithium pack with a prepaid label and we partner with Call2Recycle for proper handling. No landfill.',
      metric: '0 batteries to landfill since 2022'
    },
    {
      title: 'Carbon-neutral shipping (US)',
      body: 'All US ground shipments are offset via verified Gold Standard reforestation projects. Not a perfect answer, but a real one.',
      metric: '12,400 tCO2e offset in 2025'
    }
  ],
  certificationsReferenced: ['UL Listed', 'Energy Star', 'FSC Packaging'],
  reportUrl: 'https://roborock-us.example.com/sustainability-2025.pdf'
};

export const CERTIFICATIONS: Certification[] = [
  { name: 'FCC Part 15', issuedBy: 'US Federal Communications Commission', scope: 'all wireless products' },
  { name: 'UL Listed', issuedBy: 'Underwriters Laboratories', url: 'https://www.ul.com/', scope: 'all robots and dock chargers' },
  { name: 'CE', issuedBy: 'European Conformity', scope: 'all products sold in EU' },
  { name: 'RoHS', issuedBy: 'EU Directive 2011/65/EU', scope: 'restricts hazardous substances' },
  { name: 'Energy Star', issuedBy: 'US EPA', scope: 'S-Series Pro dock charging efficiency' },
  { name: 'FSC Packaging', issuedBy: 'Forest Stewardship Council', scope: 'all retail packaging' }
];

export const PRESS_MENTIONS: PressMention[] = [
  {
    outlet: 'Wirecutter',
    headline: 'The best robot vacuum for pet hair, after 200 hours of testing',
    url: 'https://www.nytimes.com/wirecutter/reviews/best-robot-vacuum/',
    publishedAt: '2025-11-14',
    pullQuote:
      'The Roborock S-Series Pro went 12 weeks without a single brush untangling — a result no other vacuum we tested came close to.'
  },
  {
    outlet: 'The Verge',
    headline: 'Roborock’s auto-wash dock is the upgrade I didn’t know I needed',
    url: 'https://www.theverge.com/example-roborock-review',
    publishedAt: '2025-09-22',
    pullQuote: 'It does the one thing every other robot vacuum forgets: it cleans itself.'
  },
  {
    outlet: 'Tom’s Guide',
    headline: 'Roborock S-Series Pro review: a robot vacuum worth the splurge',
    url: 'https://www.tomsguide.com/example-roborock',
    publishedAt: '2025-08-03',
    pullQuote: 'The lidar mapping is the best we’ve tested at any price.'
  },
  {
    outlet: 'Engadget',
    headline: 'Why Roborock’s E-Series is the budget robot vacuum to beat',
    url: 'https://www.engadget.com/example-roborock-e-series',
    publishedAt: '2026-02-11',
    pullQuote: 'Real lidar under $500 used to be impossible. Now it’s the floor.'
  },
  {
    outlet: 'Good Housekeeping',
    headline: 'GH Institute Test: Best Robot Vacuums for Pet Owners 2026',
    url: 'https://www.goodhousekeeping.com/example',
    publishedAt: '2026-01-08',
    pullQuote:
      'Roborock’s anti-tangle brush was the only one that didn’t need a single intervention across our 30-day test with two long-haired cats.'
  }
];

export const AWARDS: Award[] = [
  { name: 'CES Innovation Award', year: 2026, body: 'Consumer Technology Association', category: 'Smart Home — Cleaning' },
  { name: 'Wirecutter Pick', year: 2025, body: 'The New York Times — Wirecutter', category: 'Best Robot Vacuum for Pet Hair' },
  { name: 'Red Dot Design Award', year: 2024, body: 'Red Dot GmbH', category: 'Product Design — Household Appliances' },
  { name: 'Good Housekeeping Best Robot Vacuum', year: 2026, body: 'Good Housekeeping Institute' },
  { name: 'Reddit r/BuyItForLife Top 10', year: 2025, body: 'Community vote', category: 'Robot Vacuums' }
];

export const TIMELINE: TimelineEntry[] = [
  { year: 2014, milestone: 'Founded by Richard Chang and Mei Lin in Shenzhen — first prototype, no map, just bumper sensors' },
  { year: 2016, milestone: 'First lidar-equipped consumer robot ships — beats iRobot to consumer SLAM by 18 months' },
  { year: 2018, milestone: 'First million units shipped; opens US warehouse in Reno, NV' },
  { year: 2020, milestone: 'Auto-wash dock launches — invented the category, every competitor copied within 18 months' },
  { year: 2022, milestone: 'Battery take-back program goes live; zero packs to landfill since' },
  { year: 2023, milestone: 'Reactive 3D obstacle avoidance — recognizes 30+ object types including pet waste' },
  { year: 2024, milestone: 'Red Dot Design Award; opens repair-and-refurb center in Memphis, TN' },
  { year: 2025, milestone: 'S-Series Pro ships; Wirecutter top pick for pet households' },
  { year: 2026, milestone: 'CES Innovation Award; E-Series Essential brings real lidar under $500' }
];
