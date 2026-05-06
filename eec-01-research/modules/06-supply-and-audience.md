# Module 06 — Supply Signals + Audience Rollup

## 目标
1. 估供应链可行性 (cost band, lead time band) —— 02 选品起点
2. 把 1-5 module 的所有人口/痛点/广告反馈聚类成 `audience_profiles[]`

## 输入
- Module 03 的 pain_points
- Module 04 的 competitors（含价格带）
- Module 05 的 common_hooks（受众语境）

## 步骤
### Part A: Supply
1. **Alibaba.com 关键词搜索**：抓 top 5 listing 的 unit cost → 取均值 → `alibaba_avg_cost: { amount, currency }`
2. **AliExpress 关键词搜索**：抓 top 5 listing 的 unit cost → 取均值 → `aliexpress_avg_cost: { amount, currency }`（dropship 基线）
3. **1688.com**（中文）补充判断（不入 schema 字段，写 claim_meta.note）
4. lead_time 估值落到 enum 桶：`lead_time_days_band: "under_7" | "7_14" | "14_30" | "30_60" | "over_60"`
   - 不写自由格式 object — 那是旧版本，不符合 schema

### Part B: Audience Rollup
- 聚类规则：受众按 (demographics intersection × shared psychographics × shared pain points) 分组
- 每个 audience 必须能映射到 ≥1 pain_point
- 字段名严格按 schema（`_common.schema.json::AudienceProfile`）：
  - `demographics`: object，含 `age_band`(string, e.g. "25-34")、`gender_skew`(enum: `male|female|balanced|other`)、`income_band`(enum: `low|lower_mid|mid|upper_mid|high|luxury`)、`geo`(array of ISO-3166 country codes)
  - `psychographics`: object（**不是数组**），含 `interests[]`、`values[]`、`lifestyle[]`
  - `channels[]`（**不是 `dominant_channels`**）
  - `moments[]`（购买触发场景）
- `top_pain_point_ids[]` 不在 schema 必填字段里，但应作为 audience↔pain 关联（保留即可）

## 并行
- Part A 内：Alibaba + 1688 + AliExpress 并行抓
- Part B 跑在 Part A 后（依赖 1-5 全部数据已聚合）

## 输出
```jsonc
// 严格按 _common.schema.json::Money + 01-research.schema.json::supply_signals
"supply_signals": {
  "aliexpress_avg_cost": { "amount": 12.5, "currency": "USD" },
  "alibaba_avg_cost": { "amount": 5.0, "currency": "USD" },
  "lead_time_days_band": "14_30",   // enum: under_7|7_14|14_30|30_60|over_60
  "claim_meta": { ... }
},
"audience_profiles": [
  {
    "id": "audience_001",
    "name": "<short label>",
    "size_estimate_band": "medium",
    "demographics": {
      "age_band": "25-34",
      "gender_skew": "female",
      "income_band": "upper_mid",
      "geo": ["US", "GB", "DE"]
    },
    "psychographics": {
      "interests": ["pet aesthetics", "minimalist design"],
      "values": ["quality", "craftsmanship"],
      "lifestyle": ["urban", "design-conscious"]
    },
    "channels": ["instagram", "tiktok", "pinterest"],
    "moments": ["new puppy", "gift for dog-loving friend"],
    "top_pain_point_ids": ["pain_001", "pain_003"]
  }
]
```

## 校验
- audience_profiles 至少 1 个；每个绑 ≥1 pain_point id
- supply.alibaba_avg_cost.amount < retail anchor（否则毛利不够，warn 入 report，不阻塞）
- 每个 id `^audience_[0-9]{3}$`
- lead_time_days_band 必须是枚举值（under_7|7_14|14_30|30_60|over_60），不得是 object 或数字
