# Module 7 — JSON-to-DB Seed 脚本

## 任务

把 `./eec/<NN>-*/output.json` 里的业务数据 upsert 到刚迁好的空 DB。必须幂等：跑 N 次结果一样，不重复造数据。

## 脚本结构

```typescript
// seed/seed_from_json.ts
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();
const ROOT = resolve(__dirname, '../../..');  // 项目根
const DRY_RUN = process.argv.includes('--dry-run');

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(resolve(ROOT, rel), 'utf-8'));
}

async function seedProducts() {
  const data = readJson<{ skus: any[] }>('eec/02-product-selection/output.json');
  console.log(`[products] ${data.skus.length} rows`);
  if (DRY_RUN) return;

  for (const sku of data.skus) {
    await prisma.product.upsert({
      where: { id: sku.id },
      create: {
        id: sku.id,
        name: sku.name,
        short_name: sku.shortName ?? sku.short_name,
        slug: sku.routePath?.replace('/products/', '') ?? sku.id,
        tagline: sku.tagline,
        description: sku.description,
        launch_status: sku.launch_status ?? 'active',
        launch_date: sku.launch_date ? new Date(sku.launch_date) : null,
        subscription_eligible: !!sku.subscriptionEligible,
        concierge_eligible: !!sku.conciergeEligible,
      },
      update: {
        name: sku.name,
        short_name: sku.shortName ?? sku.short_name,
        tagline: sku.tagline,
        description: sku.description,
        launch_status: sku.launch_status ?? 'active',
      },
    });
  }
}

async function seedAssets() {
  const data = readJson<{ assets: any[] }>('eec/04-creative-factory/output.json');
  console.log(`[assets] ${data.assets.length} rows`);
  if (DRY_RUN) return;
  for (const a of data.assets) {
    await prisma.asset.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        kind: a.kind,
        use_case: a.use_case,
        status: a.status,
        brief_path: a.brief_md_path,
        delivered_path: a.delivered_file_path ?? null,
        width: a.width ?? null,
        height: a.height ?? null,
        alt_text: a.alt_text,
        caption: a.caption,
      },
      update: {
        status: a.status,
        delivered_path: a.delivered_file_path ?? null,
        width: a.width ?? null,
        height: a.height ?? null,
      },
    });
  }
}

async function seedReviews() {
  const path = 'eec/04b-social-proof/output.json';
  if (!exists(path)) { console.log('[reviews] skip — 04b not run'); return; }
  const data = readJson<{ reviews: any[] }>(path);
  console.log(`[reviews] ${data.reviews.length} rows`);
  if (DRY_RUN) return;
  for (const r of data.reviews) {
    await prisma.review.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        product_id: r.skuId ?? r.sku_id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        author_name: r.authorName ?? r.author_name,
        author_location: r.authorLocation ?? r.author_location ?? null,
        verified_purchase: !!r.verifiedPurchase,
        published_at: new Date(r.publishedAt ?? r.published_at),
      },
      update: { /* reviews 一旦发布通常只改 reply，这里 noop */ },
    });
    if (r.merchantResponse ?? r.merchant_response) {
      const mr = r.merchantResponse ?? r.merchant_response;
      await prisma.reviewReply.upsert({
        where: { review_id: r.id },
        create: { review_id: r.id, body: mr.body, responded_at: new Date(mr.respondedAt ?? mr.responded_at) },
        update: { body: mr.body },
      });
    }
  }
}

// ... seedBlogPosts / seedLegalPages / seedManuals / seedSettings / seedCollections / etc.

async function main() {
  console.log(DRY_RUN ? '🌱 DRY RUN — no writes' : '🌱 SEEDING');
  await seedSettings();           // 03 brand
  await seedCollections();        // 02
  await seedProducts();           // 02
  await seedProductCollections(); // 02 junction
  await seedAssets();             // 04
  await seedReviews();            // 04b（可选）
  await seedUgcAssets();          // 04b（可选）
  await seedPressLogos();         // 04b（可选）
  await seedBlogPosts();          // 07b（可选）
  await seedLegalPages();         // 03b（可选）
  await seedContactMethods();     // 11b（可选）
  await seedManuals();            // 11b（可选）
  await seedVideoTutorials();     // 11b（可选）
  await seedPartsFinder();        // 11b（可选）
  // Phase 2: email_subscribers / shipments 不灌（占位表，留空）
  console.log('✓ done');
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
```

## 执行顺序约束

`source_jsons[]` 在 schema 是数组——但执行必须按 FK 拓扑排序：

1. `roles` (lookup, in migration 0004)
2. `merchant_settings` (singleton)
3. `collections`
4. `products`
5. `product_collections` (junction)
6. `audiences` + `product_audiences`
7. `assets`
8. `asset_versions`
9. `customers` (运行时来的，初始化跳)
10. `reviews` → `review_replies`
11. `ugc_assets` (FK to assets + products)
12. `press_logos` (FK to assets)
13. `blog_authors` → `blog_posts`
14. `pages_legal`
15. `contact_methods`
16. `video_tutorials`
17. `manuals`
18. `parts_finder`
19. `users`（dev 时建一个 owner@、cs@ 测试账号）+ `user_roles`

## Idempotency 保证

| 表 | 自然键 | upsert by |
|---|---|---|
| products | id | id |
| collections | handle | handle |
| product_collections | (product_id, collection_handle) | 复合 |
| assets | id | id |
| reviews | id | id |
| review_replies | review_id (1:1) | review_id |
| blog_posts | slug | slug |
| pages_legal | slug | slug |
| manuals | (sku_id, language) | 复合 |
| audit_log | — | 永不 upsert，只 INSERT |
| events_log | — | 同上 |

## 校验

```bash
# Dry run（不写 DB）
pnpm tsx eec/13-data-model/seed/seed_from_json.ts --dry-run

# 真灌
DATABASE_URL=postgres://... pnpm tsx eec/13-data-model/seed/seed_from_json.ts

# 验证行数
psql $DATABASE_URL -c "SELECT 'products' as t, count(*) FROM products
                       UNION ALL SELECT 'reviews', count(*) FROM reviews
                       UNION ALL SELECT 'assets', count(*) FROM assets"
```

## 交付

- `seed_strategy.script_path`: `eec/13-data-model/seed/seed_from_json.ts`
- `seed_strategy.source_jsons[]`: 完整列表，每条带 transform_notes
- `seed_strategy.idempotent`: true
- `seed_strategy.dry_run_supported`: true
