// Mirrors eec/04b-social-proof/output.json. MVP self-hosted; switch to provider via 04b skill rerun.
export type Review = {
  id: string;
  skuId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  authorName: string;
  authorLocation?: string;
  publishedAt: string;
  verifiedPurchase: boolean;
  synthetic: boolean;
  helpfulCount?: number;
  merchantResponse?: { body: string; respondedAt: string };
};

export type AggregateRating = {
  skuId: string;
  ratingAverage: number;
  reviewCount: number;
  ratingDistribution: Record<'1' | '2' | '3' | '4' | '5', number>;
};

export type UgcAsset = {
  id: string;
  type: 'photo' | 'video';
  caption: string;
  authorHandle: string;
  authorPlatform: 'instagram' | 'tiktok' | 'youtube' | 'reddit' | 'direct_upload';
  consentStatus: 'granted' | 'pending' | 'expired';
  linkedSkuId?: string;
  assetPath?: string;
  synthetic?: boolean;
};

export type CaseStudy = {
  id: string;
  headline: string;
  summary: string;
  linkedSkuIds: string[];
  metricHighlights?: { label: string; value: string }[];
};

export type PressLogo = { outlet: string; url: string; pullQuote?: string; logoAssetId?: string };

export const REVIEW_PROVIDER = {
  mode: 'self_hosted' as const,
  stubUntil: 'never' as const
};

export const REVIEWS: Review[] = [
  { id: 'review_001', skuId: 'sku_001', rating: 5, title: 'Two pets, three weeks, one untangling', body: "We have a golden retriever and a long-haired cat in a 1,400 sq ft house. Three weeks in, I've cleaned the brush exactly once — and that was the recommended weekly maintenance, not because it was wrapped. Auto-wash dock is the killer feature; I never have to look at a wet mop pad. The lidar map locked on the first run and hasn't drifted since.", authorName: 'Kim L.', authorLocation: 'Brooklyn, NY', publishedAt: '2026-03-08', verifiedPurchase: true, synthetic: true, helpfulCount: 41 },
  { id: 'review_002', skuId: 'sku_001', rating: 5, title: 'Worth the $1,199', body: "I held off on a flagship robot vacuum for years thinking they were overpriced toys. The S-Series Pro changed my mind. The 'set the schedule and forget' part is real — I haven't touched the dock in 50 days, the bin auto-empties into the dock and I take it out maybe every 6 weeks. The 60-day return window made the price feel risk-free.", authorName: 'Marcus T.', authorLocation: 'Austin, TX', publishedAt: '2026-03-12', verifiedPurchase: true, synthetic: true, helpfulCount: 28 },
  { id: 'review_003', skuId: 'sku_001', rating: 5, title: 'App connection took longer than expected, otherwise flawless', body: "First Wi-Fi setup took me about 8 minutes (their docs say 2). Once it was on the network, everything worked. The 3D obstacle avoidance correctly identified my kid's Lego pile as 'an obstacle' instead of vacuuming over it — the previous robot would have eaten it. Map editing is the most polished I've seen in this category.", authorName: 'Priya R.', authorLocation: 'San Jose, CA', publishedAt: '2026-03-19', verifiedPurchase: true, synthetic: true, helpfulCount: 19 },
  { id: 'review_004', skuId: 'sku_001', rating: 4, title: 'Great robot, dock smells slightly after first month', body: "Performance is everything I hoped for. Knocking off one star because the auto-wash dock developed a faint mildew smell after about 4 weeks. I cleaned the wash plates per the manual and it cleared up; would have been 5 stars if maintenance was clearer in the setup flow. Customer support replied within a day with the cleaning steps.", authorName: 'Jordan B.', authorLocation: 'Seattle, WA', publishedAt: '2026-03-22', verifiedPurchase: true, synthetic: true, helpfulCount: 14, merchantResponse: { body: "Thanks for the catch, Jordan. We're updating the in-app onboarding to include the wash-plate rinse step on day 14. Until then, anyone with the same issue can DM us 'wash plates' and we'll send the 60-second cleaning video.", respondedAt: '2026-03-23' } },
  { id: 'review_005', skuId: 'sku_001', rating: 5, title: 'The brush actually does not tangle', body: "I've owned three robot vacuums in the last decade. All needed weekly hair-untangling on the brush. This one, after 6 weeks with two long-haired pets, has zero tangles. Whatever they did with the V-shape silicone is real engineering, not marketing.", authorName: 'Maya O.', authorLocation: 'Portland, OR', publishedAt: '2026-03-28', verifiedPurchase: false, synthetic: true, helpfulCount: 33 },
  { id: 'review_006', skuId: 'sku_001', rating: 3, title: 'Excellent on hard floors, struggles on shag', body: "Marking down because we have one shag area rug and the robot occasionally gets stuck on it (about 1 in 10 runs). On hard floors and low-pile, it's perfect. We marked the shag rug as a no-go zone in the app and that solved it, but you should know if you have shag rugs.", authorName: 'Daniel K.', authorLocation: 'Chicago, IL', publishedAt: '2026-04-02', verifiedPurchase: true, synthetic: true, helpfulCount: 22, merchantResponse: { body: 'This is good feedback — shag avoidance is on our roadmap for the next firmware. Glad the no-go zone worked as a workaround.', respondedAt: '2026-04-03' } },
  { id: 'review_007', skuId: 'sku_001', rating: 5, title: "Quietest robot we've owned", body: 'Bought specifically because it advertised 58 dB in quiet mode. We measured 60 dB with our phone, which is close enough. Runs during morning meetings without anyone on the call noticing. Previous robot was 70+.', authorName: 'Alex W.', authorLocation: 'Boston, MA', publishedAt: '2026-04-08', verifiedPurchase: true, synthetic: true, helpfulCount: 11 },
  { id: 'review_008', skuId: 'sku_002', rating: 5, title: 'Real lidar at $449 — I had to double-check the spec sheet', body: "I bought a 'lidar-assisted' robot last year for $300 and it was a disaster — the map drifted every week and rooms got missed. The E-Series has actual spinning lidar at not much more money. Mapping was a one-shot, the bot follows the same path every cycle, and it covers my 850 sq ft 1-bed in under 40 minutes.", authorName: 'Sofia G.', authorLocation: 'Miami, FL', publishedAt: '2026-03-14', verifiedPurchase: true, synthetic: true, helpfulCount: 38 },
  { id: 'review_009', skuId: 'sku_002', rating: 4, title: 'Great value, missed the auto-empty dock from my old one', body: "Coming from a flagship, I knew I'd lose features at this price. The bin is small (~470 mL) and I empty it every 4 days. Suction and mapping are surprisingly close to the flagship. If you can swing the optional dock add-on later, do — otherwise this is the best $449 in the category.", authorName: 'Liam P.', authorLocation: 'Denver, CO', publishedAt: '2026-03-25', verifiedPurchase: true, synthetic: true, helpfulCount: 17 },
  { id: 'review_010', skuId: 'sku_002', rating: 5, title: 'Set it up in 15 minutes, just works', body: "Apartment setup. Plugged in, downloaded app, ran the mapping cycle (~25 minutes), set a daily 9am schedule. That was it. No drama, no firmware fiasco, no Wi-Fi reset loop. The brush handles my partner's hair without tangling. Would buy again.", authorName: 'Maria S.', authorLocation: 'Philadelphia, PA', publishedAt: '2026-04-04', verifiedPurchase: false, synthetic: true, helpfulCount: 9 },
  { id: 'review_011', skuId: 'sku_002', rating: 2, title: 'Mine arrived with a damaged side brush — replaced quickly', body: "First impressions were bad — the box arrived dented and one of the side brushes was snapped. Customer support replaced the whole unit in 4 days, no questions asked. Two stars for the bad first experience; the replacement unit is 5-star but I'm leaving the original review for transparency.", authorName: 'Kevin H.', authorLocation: 'Phoenix, AZ', publishedAt: '2026-04-10', verifiedPurchase: true, synthetic: true, helpfulCount: 25, merchantResponse: { body: "Kevin, thanks for the patience. We're auditing the courier on the Phoenix routes — that's the second damaged-box report from the same lane this month. The replacement should arrive in better packaging; let us know if not.", respondedAt: '2026-04-11' } },
  { id: 'review_012', skuId: 'sku_003', rating: 5, title: 'Subscribe-and-save means I never think about parts', body: 'Set the kit on auto-ship every 6 months. Replaced everything in 10 minutes following the in-app guide. The fact that the brush, filter, and mop pads all show up in one box is the entire point.', authorName: 'Emma C.', authorLocation: 'Minneapolis, MN', publishedAt: '2026-04-01', verifiedPurchase: true, synthetic: true, helpfulCount: 12 }
];

export const AGGREGATE_RATINGS: AggregateRating[] = [
  { skuId: 'sku_001', ratingAverage: 4.6, reviewCount: 7, ratingDistribution: { '1': 0, '2': 0, '3': 1, '4': 1, '5': 5 } },
  { skuId: 'sku_002', ratingAverage: 4.0, reviewCount: 4, ratingDistribution: { '1': 0, '2': 1, '3': 0, '4': 1, '5': 2 } },
  { skuId: 'sku_003', ratingAverage: 5.0, reviewCount: 1, ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 1 } }
];

export const UGC_ASSETS: UgcAsset[] = [
  { id: 'ugc_001', type: 'photo', caption: 'Day 22 with our shedding golden — bin contents after one cycle.', authorHandle: '@maya.o', authorPlatform: 'instagram', consentStatus: 'granted', linkedSkuId: 'sku_001', synthetic: true },
  { id: 'ugc_002', type: 'photo', caption: 'Before / after on a high-traffic hallway. Same robot, two passes.', authorHandle: '@daniel.k', authorPlatform: 'reddit', consentStatus: 'granted', linkedSkuId: 'sku_001', synthetic: true },
  { id: 'ugc_003', type: 'video', caption: 'Time-lapse: my apartment getting mapped in 25 minutes.', authorHandle: '@sofia.g', authorPlatform: 'tiktok', consentStatus: 'granted', linkedSkuId: 'sku_002', synthetic: true },
  { id: 'ugc_004', type: 'photo', caption: 'Replenish kit unboxing — everything labeled, no guessing.', authorHandle: '@emma.c', authorPlatform: 'instagram', consentStatus: 'granted', linkedSkuId: 'sku_003', synthetic: true },
  { id: 'ugc_005', type: 'photo', caption: 'Brush after 6 weeks with two pets. Zero hair wrap.', authorHandle: '@kim.l', authorPlatform: 'direct_upload', consentStatus: 'granted', linkedSkuId: 'sku_001', synthetic: true },
  { id: 'ugc_006', type: 'photo', caption: 'Map editor view of a 3-floor townhouse. Each floor is its own saved map.', authorHandle: '@marcus.t', authorPlatform: 'reddit', consentStatus: 'pending', linkedSkuId: 'sku_001', synthetic: true }
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'case_001',
    headline: '12 weeks with two long-haired pets and the S-Series Pro',
    summary: 'We sent the S-Series Pro to a household with a golden retriever and a Maine Coon for 84 days. Tracked: brush untangling events, dock smell, map drift, support tickets. Result: zero untanglings, dock cleaned twice (proactively), map zero drift across 3 firmware updates, zero support tickets needed.',
    linkedSkuIds: ['sku_001', 'sku_003'],
    metricHighlights: [
      { label: 'Brush untanglings (84 days)', value: '0' },
      { label: 'Map drift events', value: '0' },
      { label: 'Support tickets opened', value: '0' },
      { label: 'Owner intervention time / week', value: '~3 min' }
    ]
  }
];

export const PRESS_LOGOS: PressLogo[] = [
  { outlet: 'Wirecutter', url: 'https://www.nytimes.com/wirecutter/reviews/best-robot-vacuum/', pullQuote: 'The best robot vacuum for pet hair, after 200 hours of testing.' },
  { outlet: 'The Verge', url: 'https://www.theverge.com/example-roborock-review', pullQuote: "The auto-wash dock is the upgrade I didn't know I needed." },
  { outlet: "Tom's Guide", url: 'https://www.tomsguide.com/example-roborock', pullQuote: 'A robot vacuum worth the splurge.' },
  { outlet: 'Engadget', url: 'https://www.engadget.com/example-roborock-e-series', pullQuote: 'The budget robot vacuum to beat.' },
  { outlet: 'Good Housekeeping', url: 'https://www.goodhousekeeping.com/example', pullQuote: 'GH Institute Test: Best Robot Vacuums for Pet Owners 2026.' }
];

export const PRESS_DISPLAY_MODE: 'logos_only' | 'logos_with_quote' | 'carousel' = 'logos_with_quote';

export const AGGREGATE_RATING_MIN = 5;

export function getReviewsForSku(skuId: string): Review[] {
  return REVIEWS.filter((r) => r.skuId === skuId).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getAggregateForSku(skuId: string): AggregateRating | undefined {
  return AGGREGATE_RATINGS.find((a) => a.skuId === skuId);
}

export function getPublicUgc(): UgcAsset[] {
  return UGC_ASSETS.filter((u) => u.consentStatus === 'granted');
}
