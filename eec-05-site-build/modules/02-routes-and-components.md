# Module 02 — Routes and Components

## 目标
列全部路由，每条绑 sku_ids / asset_ids / copy_block_ids，写真实模板代码。

## 必有路由
| Path | seo_intent | 关联 |
|---|---|---|
| `/` | brand + 主推 SKU | hero asset + brand copy + primary_sku |
| `/products/[slug]` | 单 SKU 转化 | sku_id × asset_ids[] (hero + lifestyle) × copy_block (product_card) |
| `/collections/[slug]` | 类目导购 | collection 内 sku_ids[] |
| `/about` | 品牌信任 | brand_book 摘要 |
| `/cart` | 购物车 | dynamic |
| `/checkout` | 结算 | 见 Module 03 |
| `/policy/privacy` | 合规 | 政策模板 |
| `/policy/refund` | 合规 | 02.return_policy_days |
| `/policy/shipping` | 合规 | 02.restricted_geo[] 显式列 |
| `/policy/terms` | 合规 | 政策模板 |

## 可选
- `/blog/[slug]` (07b 内容产出后启用)
- `/account/*` (用户中心，MVP 可借 Shopify 自带)

## 步骤
1. 列上述路由
2. 对每条 product 路由：从 02.skus[] 一一映射 slug
3. 关联 asset_ids[]：从 04.assets[] 找 sku_id 匹配 + purpose ∈ {hero, product, lifestyle}
4. 关联 copy_block_ids[]：从 04.copy_blocks[] 找 sku_id 匹配 + purpose=product_card
5. 写 routes[].seo_intent（未来 07a 据此挖关键词）

## 落盘
- `repo/app/products/[slug]/page.tsx`（或对应模板）
- 用真实 sku data 渲染（dev 时拉 mock，生产从 Shopify API）

## 输出（写到 routes[]）
```jsonc
{
  "path": "/products/[slug]",
  "component": "ProductPage",
  "sku_ids": ["sku_001"],
  "copy_block_ids": ["copy_001", "copy_002"],
  "asset_ids": ["asset_001", "asset_002", "asset_003"],
  "seo_intent": "Convert search 'best <category>' visitors"
}
```

## 校验
- 必有路由全部存在
- 每条 product route 至少 1 asset_id
- sku_ids/asset_ids/copy_block_ids 全部 ∈ 上游
