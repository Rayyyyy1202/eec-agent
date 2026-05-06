# Module 01 — Candidate Generation

## 目标
从 01 调研的 pain × competitor gap × supply 交集生 5–15 个 SKU 候选，喂给 Module 02 评分。

## 输入
- `01.pain_points[]`
- `01.competitors[]`（含 price_band 和 visible_weakness）
- `01.supply_signals`（cost_band）
- `01.audience_profiles[]`

## 候选生成 3 大角度
1. **Pain × Gap**：哪个 pain_point 头部竞品没解决 → 做"解决方案型 SKU"
2. **Bundle**：能不能把 2-3 个独立 SKU 打包成套装解决场景痛点
3. **Premium / Budget split**：竞品价格带集中在中段 → 做高端定制版 OR 极致性价比版

## 步骤
1. 对每个 pain_point：列至少 1 个 SKU 概念，标 angle (pain_solver/bundle/tier_split)
2. 对每个 audience：检查至少 1 个候选能服务（多对多绑定）
3. 给每个候选估 cost_band（来自 01.supply_signals）+ retail anchor（来自 01.competitors[].price_band）
4. 算 candidate margin_pct = (anchor - cost) / anchor，过滤 margin < 30% 的

## 并行
- 每个 pain_point 的候选生成并行

## 输出（中间产物，喂 Module 02）
```jsonc
[
  {
    "name": "<候选名>",
    "angle": "pain_solver|bundle|tier_split",
    "addresses_pain_ids": ["pain_001"],
    "candidate_target_audience_ids": ["audience_001", "audience_002"],
    "cost_estimate": { "amount": 5, "currency": "USD" },
    "retail_anchor": { "amount": 29, "currency": "USD" },
    "expected_margin_pct": 82
  }
]
```

## 数量建议
- 5-15 个候选（少于 5 → 扩 angle；多于 15 → 先粗筛）
- 至少 2 个 angle 覆盖

## 校验
- 每个候选 addresses_pain_ids 至少 1 条
- 每个候选 candidate_target_audience_ids 至少 1 条
- expected_margin_pct ≥ 30
