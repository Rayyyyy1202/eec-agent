# Module 03 — Pricing Strategy

## 目标
为每个 top SKU 定 retail_price + margin_pct + 模式（penetration / premium / tiered）。

## 步骤
1. **anchor 选择**：选 1-2 个 01 头部竞品的同档 SKU 价做 anchor
2. **模式判定**：
   - **penetration**：anchor × 0.7-0.85（抢市场，需毛利 ≥ 50%）
   - **premium**：anchor × 1.2-1.6（差异化定位，需 USP 强）
   - **tiered**：同 SKU 出 mini / standard / pro 三档（适合 bundle）
3. **margin gate**：DTC 投流后通常需要 3x markup → margin_pct ≥ 50% 优先；< 50% 必须显式标注 "thin_margin_warning"
4. **币种**：每个 SKU 用 per-SKU `Money` 对象，自带 ISO-4217（同店允许多币种）

## 输出（写到 SKU.cost / SKU.retail_price / SKU.margin_pct）
```jsonc
{
  "cost": { "amount": 5.50, "currency": "USD" },
  "retail_price": { "amount": 29.00, "currency": "USD" },
  "margin_pct": 81,
  "pricing_mode": "premium",
  "anchor_competitor_id": "comp_002",
  "thin_margin_warning": false
}
```

## 校验
- margin_pct = round((retail - cost) / retail * 100)
- 同 SKU cost.currency == retail_price.currency
- 若 thin_margin_warning=true → SKU 必须有"非投流获客来源"说明（SEO/UGC/红人）

## 并行
- 每个 SKU 的定价决策独立可并行
