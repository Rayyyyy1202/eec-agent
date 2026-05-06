# Module 01 — Tech Stack Selection

## 目标
选 frontend / backend / commerce / hosting / payment / search，不超 5 个外部依赖。

## 决策矩阵（按品牌 + SKU 复杂度）
| 场景 | 推荐 frontend | commerce | hosting |
|---|---|---|---|
| 小规模 (≤10 SKU) DTC | Next.js 15 + Stripe Checkout | Medusa.js OR Shopify Storefront API | Vercel |
| 中规模 (10-100 SKU) | Next.js 15 + Shopify | Shopify | Vercel/Shopify |
| 内容型 + 偶发售 | Astro 4 | Snipcart | Netlify/Cloudflare |
| 国际多币种 | Next.js + Shopify Markets | Shopify | Vercel |
| 已有 PrestaShop | PrestaShop 8 stays | PrestaShop | Self-host |

## 步骤
1. 读 02.skus[].length + restricted_geo[] + currency 多样性
2. 读 03.brand 定位（奢侈/性价比 → 影响 commerce 选型）
3. 读 04.assets 数量 (>500 → 需 CDN-friendly host)
4. 与用户 $ARGUMENTS stack/deploy 偏好对齐；冲突则 SKILL.md Step 1 提示

## 选 payment_processor
- 默认 Stripe (覆盖最广)
- 加 Apple Pay / Google Pay (移动端转化必有)
- 高客单 → 加 Klarna / Affirm (BNPL)
- 中国受众 → 加 Alipay
- 加密货币：MVP 不建议

## 输出（写到 tech_stack）
```jsonc
{
  "tech_stack": {
    "frontend": "Next.js 15 (App Router)",
    "backend": "Shopify Storefront API",
    "cms": null,
    "hosting": "Vercel",
    "payment_processor": "Stripe + Apple Pay + Google Pay",
    "search": "Algolia (optional)"
  }
}
```

## 校验
- frontend / hosting 必填
- 不超 5 个外部 SaaS（含 hosting + commerce + payment + search + analytics）
- 与 03.visual_system 字体可被 frontend 加载（Google Fonts 默认 OK）
