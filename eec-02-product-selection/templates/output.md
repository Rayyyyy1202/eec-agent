# 选品报告 — {{niche.primary_keyword}}

**上游**: 01-research v{{upstream.research.skill_version}}　|　**生成**: {{meta.generated_at}}　|　Skill v{{meta.skill_version}}

---

## TL;DR
- **SKU 数量**: {{skus | length}}
- **平均毛利**: {{aggregate.avg_margin_pct}}%
- **定价策略**: {{pricing_strategy.type}} (anchor: {{pricing_strategy.anchor_competitor_id}})
- **主推**: {{hero_sku_id}} — {{hero_sku.name}}
- **建议下一步**: 运行 `/eec-03-brand-identity`

---

## SKU 一览

| ID | 名称 | 受众 ref | Cost | 售价 | 毛利% | 物流 |
|---|---|---|---|---|---|---|
{{#each skus}}
| {{id}} | {{name}} | {{target_audience_ids | join ","}} | {{cost.amount}} {{cost.currency}} | {{retail_price.amount}} {{retail_price.currency}} | {{margin_pct}}% | {{shipping_class}} |
{{/each}}

---

## SKU 详情

{{#each skus}}
### {{id}} — {{name}}

- **slug**: `{{slug}}`　·　**类目**: {{category}}
- **短描述**: {{description_short}}
- **USP**:
{{usp | bullets}}
- **解决的痛点**: {{linked_pain_point_ids | join ", "}} ← 必须 ref 01.pain_points[]
- **目标受众**: {{target_audience_ids | join ", "}} ← ref 01.audience_profiles[]
- **价格**: cost {{cost.amount}} {{cost.currency}} → 售价 {{retail_price.amount}} {{retail_price.currency}} (毛利 {{margin_pct}}%)
- **物流**: {{shipping_class}} · {{weight_g}}g · {{dim_cm.l}}×{{dim_cm.w}}×{{dim_cm.h}}cm
- **图片 brief**: {{image_briefs | length}} 条 → 04 创意工厂消费

#### Phase 2 钩子状态
| Hook | 字段 | 值 |
|---|---|---|
| H1 | email_friendly_name | {{email_friendly_name}} ({{email_friendly_name | length}}/30) |
| H3 | shipping_class | {{shipping_class}} |
| H4 | weight_g / dim_cm | {{weight_g}}g / {{dim_cm | summarize}} |
| H5 | restricted_geo | {{restricted_geo | join ","}} |
| H6 | warranty_days | {{warranty_days}} |
| H7 | return_window_days | {{return_window_days}} |
| H12 | hs_code | {{hs_code}} |
| H13 | fragile | {{fragile}} |
| H14 | hazmat_class | {{hazmat_class}} |

{{/each}}

---

## 定价策略

- **类型**: {{pricing_strategy.type}} (penetration / premium / tiered)
- **锚定竞品**: {{pricing_strategy.anchor_competitor_id}} ← ref 01.competitors[]
- **理由**: {{pricing_strategy.rationale}}
- **价格弹性观察**: {{pricing_strategy.elasticity_note}}

## 风险 / 待验证
{{risks_and_unknowns | bullets}}

## 下一步
- `/eec-03-brand-identity` — 把这些 SKU + 痛点编译成品牌人设
- `/eec-04-creative-factory` — 按 image_briefs[] 生产创意（可与 03 并行）
