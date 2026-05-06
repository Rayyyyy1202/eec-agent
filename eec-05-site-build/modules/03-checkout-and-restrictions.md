# Module 03 — Checkout + Restricted Geo + Abandonment Hook

## 目标
1. 选 checkout 类型 + 支付 + 配送区
2. 硬阻断 02.skus[].restricted_geo[] 国家
3. 留 abandonment 事件钩子（Phase 2 邮件挽回必需）

## 步骤
### A. Checkout 类型
- `single_page` (Stripe Checkout / Shopify Pay) —— 默认，转化最高
- `multi_step` —— 高客单 / 需收集详细信息
- `embedded` —— 想保留品牌 UI
- `hosted` —— payment processor 全托管

### B. Payment methods
来自 Module 01 决策

### C. Shipping zones
- 取 02.skus[] 全部 restricted_geo[] 的并集 → 作 `excluded_countries`
- shipping_zones[] = 全球 minus excluded_countries
- 地址校验时若用户选了 excluded_countries → 阻断 + 报"此商品不发往您所在地区"

### D. Guest checkout
- 默认 true（提高转化）
- B2B 站默认 false

### E. Abandonment hook (关键 H 钩子)
- 在 begin_checkout 后超 N 分钟用户未 purchase → emit `cart_abandoned` event 到 dataLayer
- N 默认 30 分钟（可配置）
- 设 `abandonment_recovery_hook_present: true`（Phase 2 邮件就能起 cart abandonment flow）

## 落盘
- `repo/app/checkout/page.tsx` 加 setTimeout 触发 cart_abandoned dataLayer push
- 地址校验组件读 excluded_countries

## 输出（写到 checkout_flow）
```jsonc
{
  "checkout_flow": {
    "type": "single_page",
    "payment_methods": ["card", "apple_pay", "google_pay", "klarna"],
    "shipping_zones": ["US", "CA", "EU", "UK", "AU"],
    "guest_checkout": true,
    "abandonment_recovery_hook_present": true
  }
}
```

## 校验
- shipping_zones 不含任何 SKU 的 restricted_geo[] 国家
- abandonment_recovery_hook_present 必须 true（缺则 Phase 2 弃单流断）
- payment_methods 至少 1 项
