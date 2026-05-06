// Mirrors eec/04-creative-factory/output.json#/assets[].
// Phase 8: each asset carries production status. <SmartImage> reads this to decide
// whether to render a real <Image> or fall back to the gradient placeholder.

export type AssetStatus = 'brief' | 'stub' | 'shot' | 'retouched' | 'approved';
export type AssetType = 'image' | 'video' | 'copy' | 'hook' | 'audio';

export interface Asset {
  id: string;
  type: AssetType;
  purpose: string;
  channel: string;
  language: string;
  format?: string;
  skuId?: string;
  audienceIds?: string[];
  altText?: string;
  promptUsed?: string;
  approved: boolean;
  status: AssetStatus;
  shootBriefMdPath?: string;
  deliveredFilePath?: string;
  width?: number;
  height?: number;
}

const DELIVERED_STATES: ReadonlySet<AssetStatus> = new Set(['shot', 'retouched', 'approved']);

export function isDelivered(asset: Pick<Asset, 'status' | 'deliveredFilePath' | 'width' | 'height'>): boolean {
  return (
    DELIVERED_STATES.has(asset.status) &&
    typeof asset.deliveredFilePath === 'string' &&
    typeof asset.width === 'number' &&
    typeof asset.height === 'number'
  );
}

export const ASSETS: Asset[] = [
  {
    id: 'asset_001',
    type: 'image',
    purpose: 'hero',
    channel: 'web',
    language: 'en-US',
    format: '16:9',
    skuId: 'sku_001',
    audienceIds: ['audience_001', 'audience_002'],
    altText:
      'Roborock S-Series Pro docked in heated wash station on light hardwood floor, modern living room background',
    approved: false,
    status: 'brief',
    shootBriefMdPath: 'eec/04-creative-factory/asset_briefs/asset_001.md'
  },
  {
    id: 'asset_002',
    type: 'image',
    purpose: 'lifestyle',
    channel: 'web',
    language: 'en-US',
    format: '4:5',
    skuId: 'sku_001',
    audienceIds: ['audience_001'],
    altText: 'Robot quietly cleaning around golden retriever lying on living room rug, owner reading on couch',
    approved: false,
    status: 'brief',
    shootBriefMdPath: 'eec/04-creative-factory/asset_briefs/asset_002.md'
  },
  {
    id: 'asset_003',
    type: 'image',
    purpose: 'product',
    channel: 'web',
    language: 'en-US',
    format: '1:1',
    skuId: 'sku_001',
    altText: 'Macro of V-shape anti-tangle brush, hair-free',
    approved: false,
    status: 'brief',
    shootBriefMdPath: 'eec/04-creative-factory/asset_briefs/asset_003.md'
  },
  {
    id: 'asset_004',
    type: 'image',
    purpose: 'ad',
    channel: 'meta',
    language: 'en-US',
    format: '1:1',
    skuId: 'sku_001',
    audienceIds: ['audience_001'],
    altText: 'Before/after split: pet-hair-covered floor → spotless after one robot pass',
    approved: false,
    status: 'brief',
    shootBriefMdPath: 'eec/04-creative-factory/asset_briefs/asset_004.md'
  },
  {
    id: 'asset_005',
    type: 'image',
    purpose: 'ad',
    channel: 'tiktok',
    language: 'en-US',
    format: '9:16',
    skuId: 'sku_001',
    audienceIds: ['audience_001', 'audience_003'],
    altText: 'Vertical UGC-style still of robot lifting mop pad over rug edge',
    approved: false,
    status: 'brief',
    shootBriefMdPath: 'eec/04-creative-factory/asset_briefs/asset_005.md'
  },
  {
    id: 'asset_006',
    type: 'image',
    purpose: 'hero',
    channel: 'web',
    language: 'en-US',
    format: '16:9',
    skuId: 'sku_002',
    audienceIds: ['audience_001', 'audience_004'],
    altText: 'Roborock E-Series Essential on light hardwood with phone showing app map overlay',
    approved: false,
    status: 'brief',
    shootBriefMdPath: 'eec/04-creative-factory/asset_briefs/asset_006.md'
  },
  {
    id: 'asset_007',
    type: 'image',
    purpose: 'ad',
    channel: 'google',
    language: 'en-US',
    format: '1:1',
    skuId: 'sku_002',
    audienceIds: ['audience_004'],
    altText: 'Apartment living, robot working, retail-style with $449 price prominent',
    approved: false,
    status: 'brief',
    shootBriefMdPath: 'eec/04-creative-factory/asset_briefs/asset_007.md'
  },
  {
    id: 'asset_008',
    type: 'image',
    purpose: 'product',
    channel: 'web',
    language: 'en-US',
    format: '1:1',
    skuId: 'sku_003',
    altText: 'Replenish kit flat-lay: brush, side brushes, filters, mop pads',
    approved: false,
    status: 'brief',
    shootBriefMdPath: 'eec/04-creative-factory/asset_briefs/asset_008.md'
  },
  {
    id: 'asset_009',
    type: 'image',
    purpose: 'social',
    channel: 'meta',
    language: 'en-US',
    format: '1:1',
    audienceIds: ['audience_002'],
    altText: 'Brand-level lifestyle frame — quiet evening home with robot in background, candle lit',
    approved: true,
    status: 'shot',
    shootBriefMdPath: 'eec/04-creative-factory/asset_briefs/asset_009.md',
    deliveredFilePath: '/og/asset_009.svg',
    width: 1200,
    height: 1200
  }
];

const ASSETS_BY_ID: ReadonlyMap<string, Asset> = new Map(ASSETS.map((a) => [a.id, a]));

export function getAsset(id: string): Asset | undefined {
  return ASSETS_BY_ID.get(id);
}

export function deliveredCount(): number {
  return ASSETS.filter(isDelivered).length;
}
