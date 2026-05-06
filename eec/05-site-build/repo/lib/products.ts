// Mirrors eec/02-product-selection/output.json. Real implementation would fetch from Medusa.
export type SpecRow = {
  group: string;
  label: string;
  value: string;
  unit?: string;
  compareKey?: string;
};

export type TechExplainer = {
  id: string;
  title: string;
  bodyMd: string;
  illustrativeAssetId?: string;
};

export type SetupStep = {
  stepNumber: number;
  title: string;
  instruction: string;
  estimatedSeconds?: number;
};

export type SkuCertification = {
  name: string;
  scopeNote?: string;
};

export type Sku = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  price: { amount: number; currency: string };
  compareAtPrice?: { amount: number; currency: string };
  audienceIds: string[];
  consumableAttachedSkus?: string[];
  subscriptionEligible: boolean;
  conciergeEligible: boolean;
  returnWindowDays: number;
  inventoryStatus: 'in_stock' | 'low' | 'out';
  launchStatus: 'pre_order' | 'live' | 'archived';
  launchDate?: string;
  features: string[];
  specs: { label: string; value: string }[];
  description: string;
  routePath: string;
  certifications?: SkuCertification[];
  specTable?: SpecRow[];
  techExplainers?: TechExplainer[];
  setupSteps?: SetupStep[];
};

export const SKUS: Sku[] = [
  {
    id: 'sku_001',
    slug: 'roborock-s-series-pro',
    name: 'S-Series Pro — Lidar Robot + Auto-Mop Dock',
    shortName: 'S-Series Pro',
    tagline: 'Lidar + auto-mop dock',
    price: { amount: 1199, currency: 'USD' },
    audienceIds: ['audience_001', 'audience_002'],
    consumableAttachedSkus: ['sku_003'],
    subscriptionEligible: false,
    conciergeEligible: true,
    returnWindowDays: 60,
    inventoryStatus: 'in_stock',
    launchStatus: 'live',
    features: [
      '10,000 Pa suction',
      'Lidar SLAM mapping',
      'V-shape anti-tangle brush',
      'Auto-lifting mop pad (10mm clearance)',
      'Self-empty + self-wash dock'
    ],
    specs: [
      { label: 'Suction', value: '10,000 Pa' },
      { label: 'Battery', value: '5,200 mAh / 180 min' },
      { label: 'Dustbin (dock)', value: '2.5 L (60 days)' },
      { label: 'Mop tank', value: '4 L clean / 3.5 L dirty' },
      { label: 'Noise', value: '58 dB (quiet mode)' }
    ],
    description:
      'Set-and-forget for pet households. Auto-empties for ~60 days, washes its own mop pads, and the V-shape silicone brush refuses to wear pet hair.',
    routePath: '/products/roborock-s-series-pro',
    certifications: [
      { name: 'FCC Part 15' },
      { name: 'UL Listed' },
      { name: 'CE' },
      { name: 'RoHS' },
      { name: 'Energy Star', scopeNote: 'dock charging efficiency' },
      { name: 'FSC Packaging' }
    ],
    specTable: [
      { group: 'Suction', label: 'Max suction', value: '10000', unit: 'Pa', compareKey: 'suction_pa' },
      { group: 'Suction', label: 'Modes', value: 'Quiet · Standard · Turbo · Max', compareKey: 'suction_modes' },
      { group: 'Battery', label: 'Capacity', value: '5200', unit: 'mAh', compareKey: 'battery_mah' },
      { group: 'Battery', label: 'Runtime per charge', value: '180', unit: 'min', compareKey: 'battery_runtime_min' },
      { group: 'Battery', label: 'Recharge & resume', value: 'Yes', compareKey: 'recharge_resume' },
      { group: 'Mapping', label: 'Mapping tech', value: 'Real spinning lidar (PreciSense LDS)', compareKey: 'mapping_tech' },
      { group: 'Mapping', label: 'Multi-floor maps', value: 'Up to 3 floors', compareKey: 'multi_floor' },
      { group: 'Mapping', label: 'Obstacle avoidance', value: '3D Reactive (30+ object classes)', compareKey: 'obstacle_avoid' },
      { group: 'Mop', label: 'Mop type', value: 'Auto-lifting (10mm clearance)', compareKey: 'mop_type' },
      { group: 'Mop', label: 'Self-wash dock', value: 'Heated wash + hot-air dry', compareKey: 'mop_dock' },
      { group: 'Dock', label: 'Auto-empty bin', value: '2.5', unit: 'L (≈60 days)', compareKey: 'auto_empty_bin' },
      { group: 'Dock', label: 'Mop tank capacity', value: '4 L clean / 3.5 L dirty', compareKey: 'mop_tank' },
      { group: 'Brush', label: 'Brush design', value: 'V-shape silicone anti-tangle', compareKey: 'brush_design' },
      { group: 'Filter', label: 'Filter rating', value: 'HEPA H13 (washable)', compareKey: 'filter_rating' },
      { group: 'Acoustics', label: 'Quiet mode', value: '58', unit: 'dB', compareKey: 'noise_db' },
      { group: 'Connectivity', label: 'Smart home', value: 'Matter · Alexa · Google Home', compareKey: 'smart_home' },
      { group: 'Warranty', label: 'Robot warranty', value: '2', unit: 'years', compareKey: 'warranty_years' }
    ],
    techExplainers: [
      {
        id: 'tech_001',
        title: 'PreciSense lidar SLAM, in plain language',
        bodyMd:
          'A spinning laser on top of the puck shoots ~5,000 distance measurements per second. Software stitches those into a centimeter-resolution map and tracks where the robot is on that map in real time. Two practical wins: it works in pitch dark (cameras don’t), and the map doesn’t drift across weeks of runs (gyro nav does). Result: the robot follows the same efficient path every cycle, instead of re-running spots it already cleaned.'
      },
      {
        id: 'tech_002',
        title: 'Why the V-shape brush doesn’t wrap pet hair',
        bodyMd:
          'A bristle roller catches hair on the bristle root, then friction wraps the whole roller. The V-shape silicone fins do the opposite — hair slides along the fin toward the centerline and into the suction port. Twelve weeks with a golden retriever: zero untanglings. (We made a video.)'
      },
      {
        id: 'tech_003',
        title: 'Auto-mop dock — what it actually does between cycles',
        bodyMd:
          'After every cycle the robot returns to the dock. The dock pumps clean water through the mop pads, scrubs them against ridged plates, vacuums the dirty water into a separate tank, and finishes with a 60-minute hot-air dry. Net effect: mop pads stay clean enough to use for 6 months without replacement, and the dock never smells like a wet rag.'
      },
      {
        id: 'tech_004',
        title: 'Reactive 3D obstacle avoidance, honestly',
        bodyMd:
          'A structured-light projector + camera maps small objects in real time. The model recognizes 30+ classes — cables, socks, phone chargers, pet waste, slippers, kid’s toys, weighing scales. It routes around them instead of pushing them. It’s not perfect (it’ll occasionally miss a black cable on a black floor), but the failure mode is "stop and ask in the app," not "eat the cable."'
      }
    ],
    setupSteps: [
      { stepNumber: 1, title: 'Unbox and place the dock', instruction: 'Place the dock against a wall with at least 0.5m clear on each side and 1.5m in front. Plug it in. The status light pulses white when ready.', estimatedSeconds: 120 },
      { stepNumber: 2, title: 'Sit the robot on the dock', instruction: 'Lift the robot onto the dock. The metal contacts on the back of the robot align with the dock pins. The robot beeps once and the dock light turns solid white when seated.', estimatedSeconds: 30 },
      { stepNumber: 3, title: 'Install the Roborock app', instruction: 'Download "Roborock" from the App Store or Google Play. Create an account or sign in. Tap "+" to add a new device. Select S-Series Pro from the list.', estimatedSeconds: 120 },
      { stepNumber: 4, title: 'Connect to Wi-Fi', instruction: 'The app asks for your home Wi-Fi (2.4 GHz only — the robot does not connect to 5 GHz). Enter the password. The robot beeps three times when connected. This step takes ~2 minutes.', estimatedSeconds: 180 },
      { stepNumber: 5, title: 'Run the first mapping cycle', instruction: 'In the app, tap "Map your home." The robot leaves the dock and runs a single mapping pass — no suction, no mop, just lidar. For a 1,200 sq ft home this takes 25–35 minutes. Stay out of its way; you’ll get a clean map.', estimatedSeconds: 1800 },
      { stepNumber: 6, title: 'Edit the map (optional)', instruction: 'When mapping finishes, the app shows the map. Drag walls to split rooms, name them, and mark no-go zones (under-bed, in front of pet bowls, etc.). Saved maps persist forever — you only do this once.', estimatedSeconds: 240 },
      { stepNumber: 7, title: 'Schedule your first real clean', instruction: 'Set a daily schedule (we recommend 9 a.m. weekdays — most people are out). Pick rooms, suction power, and whether to mop. Tap "Save." You’re done.', estimatedSeconds: 120 }
    ]
  },
  {
    id: 'sku_002',
    slug: 'roborock-e-series-essential',
    name: 'E-Series Essential — Real Lidar Under $500',
    shortName: 'E-Series Essential',
    tagline: 'Real lidar, value price',
    price: { amount: 449, currency: 'USD' },
    audienceIds: ['audience_001', 'audience_004'],
    consumableAttachedSkus: ['sku_003'],
    subscriptionEligible: false,
    conciergeEligible: false,
    returnWindowDays: 60,
    inventoryStatus: 'low',
    launchStatus: 'live',
    features: [
      '5,500 Pa suction',
      'Real lidar mapping (not gyro)',
      'Anti-tangle brush',
      'Optional auto-empty dock add-on'
    ],
    specs: [
      { label: 'Suction', value: '5,500 Pa' },
      { label: 'Battery', value: '3,200 mAh / 130 min' },
      { label: 'Dustbin', value: '470 mL onboard' },
      { label: 'Mop', value: 'Vibrating (no auto-lift)' },
      { label: 'Noise', value: '62 dB' }
    ],
    description:
      'Lidar mapping that actually works at the apartment-friendly price. The robot vacuum your last one was supposed to be.',
    routePath: '/products/roborock-e-series-essential',
    certifications: [
      { name: 'FCC Part 15' },
      { name: 'UL Listed' },
      { name: 'CE' },
      { name: 'RoHS' },
      { name: 'FSC Packaging' }
    ],
    specTable: [
      { group: 'Suction', label: 'Max suction', value: '5500', unit: 'Pa', compareKey: 'suction_pa' },
      { group: 'Suction', label: 'Modes', value: 'Quiet · Standard · Turbo', compareKey: 'suction_modes' },
      { group: 'Battery', label: 'Capacity', value: '3200', unit: 'mAh', compareKey: 'battery_mah' },
      { group: 'Battery', label: 'Runtime per charge', value: '130', unit: 'min', compareKey: 'battery_runtime_min' },
      { group: 'Battery', label: 'Recharge & resume', value: 'Yes', compareKey: 'recharge_resume' },
      { group: 'Mapping', label: 'Mapping tech', value: 'Real spinning lidar', compareKey: 'mapping_tech' },
      { group: 'Mapping', label: 'Multi-floor maps', value: 'Up to 2 floors', compareKey: 'multi_floor' },
      { group: 'Mapping', label: 'Obstacle avoidance', value: 'Bumper + IR cliff', compareKey: 'obstacle_avoid' },
      { group: 'Mop', label: 'Mop type', value: 'Vibrating pad (no auto-lift)', compareKey: 'mop_type' },
      { group: 'Mop', label: 'Self-wash dock', value: '—', compareKey: 'mop_dock' },
      { group: 'Dock', label: 'Auto-empty bin', value: 'Optional add-on', compareKey: 'auto_empty_bin' },
      { group: 'Dock', label: 'Mop tank capacity', value: '300 mL onboard', compareKey: 'mop_tank' },
      { group: 'Brush', label: 'Brush design', value: 'V-shape silicone anti-tangle', compareKey: 'brush_design' },
      { group: 'Filter', label: 'Filter rating', value: 'HEPA-grade (washable)', compareKey: 'filter_rating' },
      { group: 'Acoustics', label: 'Quiet mode', value: '62', unit: 'dB', compareKey: 'noise_db' },
      { group: 'Connectivity', label: 'Smart home', value: 'Alexa · Google Home', compareKey: 'smart_home' },
      { group: 'Warranty', label: 'Robot warranty', value: '2', unit: 'years', compareKey: 'warranty_years' }
    ],
    techExplainers: [
      {
        id: 'tech_005',
        title: 'Real lidar — not "lidar-assist"',
        bodyMd:
          'Some sub-$500 robots claim "lidar-assist" but actually run gyro navigation with a single-point lidar dot for assist. The E-Series uses the same spinning lidar puck as our flagship — slightly cheaper module, same SLAM math. The map doesn’t drift, doesn’t need a re-train each week, and works in the dark.'
      },
      {
        id: 'tech_006',
        title: 'Why we kept the anti-tangle brush at this price',
        bodyMd:
          'The brush is the most-asked-about part on PDP. Cheaper bristle rollers wrap pet hair and need weekly cleaning. We carried the V-shape silicone design from the Pro because it’s cheap to manufacture once tooled, and it’s the single biggest day-to-day quality-of-life difference for pet households.'
      },
      {
        id: 'tech_007',
        title: 'What the optional dock add-on does',
        bodyMd:
          'The base bot ships without an auto-empty dock. The $129 add-on slides into the same charging spot and gives you ~45 days of bin capacity instead of 4–5 days. Most apartment owners skip it. Most pet households add it within 60 days.'
      }
    ],
    setupSteps: [
      { stepNumber: 1, title: 'Charge the robot for 90 minutes', instruction: 'Plug in the included charging contact. The robot ships at ~30% — give it a full charge before the first mapping run. The light goes solid white when full.', estimatedSeconds: 5400 },
      { stepNumber: 2, title: 'Install the Roborock app and sign in', instruction: 'Download "Roborock" from your app store. Create an account. Tap "+", select "E-Series Essential" from the device list.', estimatedSeconds: 120 },
      { stepNumber: 3, title: 'Connect to 2.4 GHz Wi-Fi', instruction: 'Enter your home Wi-Fi credentials. The robot connects only on 2.4 GHz (not 5 GHz). Two beeps = connected.', estimatedSeconds: 180 },
      { stepNumber: 4, title: 'Run the first mapping pass', instruction: 'Tap "Map your home." The robot lidar-scans without cleaning. ~25 minutes for a typical apartment. Don’t move it during this pass.', estimatedSeconds: 1500 },
      { stepNumber: 5, title: 'Schedule your first clean', instruction: 'Pick a daily time, choose rooms, and tap save. We recommend running it once a day in pet households, twice a week otherwise.', estimatedSeconds: 90 }
    ]
  },
  {
    id: 'sku_003',
    slug: 'roborock-replenish-6mo',
    name: '6-Month Replenish Kit — Brush, Filter, Mop Pads',
    shortName: 'Replenish Kit (6 mo)',
    tagline: '6 months of consumables, one box',
    price: { amount: 79, currency: 'USD' },
    compareAtPrice: { amount: 99, currency: 'USD' },
    audienceIds: ['audience_001', 'audience_002', 'audience_004'],
    subscriptionEligible: true,
    conciergeEligible: false,
    returnWindowDays: 30,
    inventoryStatus: 'in_stock',
    launchStatus: 'live',
    features: [
      '1× V-shape main brush',
      '4× side brushes',
      '4× HEPA filters',
      '6× microfiber mop pads',
      'Fits S-Series Pro and E-Series Essential'
    ],
    specs: [
      { label: 'Coverage', value: '6 months for typical home' },
      { label: 'Compatibility', value: 'sku_001, sku_002' },
      { label: 'Subscribe & save', value: '20% off recurring' }
    ],
    description:
      'One kit, six months. Subscribe & save 20%. Ships when your robot tells the app it needs replacements.',
    routePath: '/products/roborock-replenish-6mo',
    certifications: [{ name: 'FSC Packaging' }],
    specTable: [
      { group: 'Compatibility', label: 'Fits', value: 'S-Series Pro · E-Series Essential', compareKey: 'fits_models' },
      { group: 'Contents', label: 'Main brush', value: '1', unit: '× V-shape silicone', compareKey: 'kit_main_brush' },
      { group: 'Contents', label: 'Side brushes', value: '4', unit: '× pack', compareKey: 'kit_side_brush' },
      { group: 'Contents', label: 'HEPA filters', value: '4', unit: '× pack', compareKey: 'kit_filter' },
      { group: 'Contents', label: 'Mop pads', value: '8', unit: '× pack', compareKey: 'kit_mop' },
      { group: 'Lifecycle', label: 'Coverage', value: '~6 months for typical home', compareKey: 'kit_coverage' },
      { group: 'Subscribe', label: 'Subscribe & save', value: '20', unit: '% off + auto-ship every 6 months', compareKey: 'kit_subscribe' }
    ],
    techExplainers: [
      {
        id: 'tech_008',
        title: 'Why we ship a 6-month bundle (not individual parts)',
        bodyMd:
          'Owners forget the brush before they forget the filter, and the filter before they forget the mop pads. We grouped them in one kit on the same 6-month cadence so "replenish" is one decision, not five Amazon searches. Subscribe and we ship before you notice; cancel any time.'
      },
      {
        id: 'tech_009',
        title: 'How long parts actually last (in a pet household)',
        bodyMd:
          'The pessimistic version: brush 4–5 months, filter 6–8 weeks, mop pad 3 months. The kit gives you headroom on all three for a 6-month cycle in a 2-pet, 1,200 sq ft home. If you don’t have pets, the kit lasts 9–12 months — many subscribers skip every other shipment.'
      }
    ]
  }
];

export function getSkuBySlug(slug: string): Sku | undefined {
  return SKUS.find((s) => s.slug === slug);
}

export function getSkuById(id: string): Sku | undefined {
  return SKUS.find((s) => s.id === id);
}

// Mirrors eec/02-product-selection/output.json#/bundle_suggestions
export type BundleSuggestion = {
  name: string;
  skuIds: string[];
  discountPct: number;
  rationale: string;
};

export const BUNDLE_SUGGESTIONS: BundleSuggestion[] = [
  {
    name: 'Pet Household Starter',
    skuIds: ['sku_001', 'sku_003'],
    discountPct: 10,
    rationale: 'Hero robot + auto-ship consumable kit. One decision, six months handled.'
  },
  {
    name: 'Two-Floor Apartment',
    skuIds: ['sku_002', 'sku_003'],
    discountPct: 12,
    rationale: 'Value robot + replenish kit. Same coverage at the apartment-friendly price.'
  }
];

export function getBundlesForSku(skuId: string): BundleSuggestion[] {
  return BUNDLE_SUGGESTIONS.filter((b) => b.skuIds.includes(skuId));
}

export const COLLECTIONS: Record<string, { title: string; description: string; skuIds: string[] }> = {
  all: {
    title: 'Shop All Roborock',
    description: 'Every robot, every accessory.',
    skuIds: ['sku_001', 'sku_002', 'sku_003']
  },
  'pet-households': {
    title: 'Best Robot Vacuums for Pet Households',
    description: 'Anti-tangle brush + auto-washing mop. Engineered for long-haired pets.',
    skuIds: ['sku_001', 'sku_003']
  }
};
