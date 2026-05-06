# 调研报告 — {{niche.primary_keyword}}

**市场**: {{niche.region}}　|　**语言**: {{niche.language}}
**生成时间**: {{meta.generated_at}}　|　**Skill**: eec-01-research v{{meta.skill_version}}

---

## TL;DR
- **趋势方向 (12mo)**: {{trends.direction_12mo}}
- **季节性**: {{trends.seasonality | summarize}}
- **月需求量级**: {{demand.volume_band}}
- **顶级痛点**: {{pain_points[0..2] | join "; "}}
- **头部竞品**: {{competitors[0..2].brand | join " / "}}
- **平均 CPM**: {{ad_intelligence.avg_cpm_band}}
- **建议**: {{recommendation_one_liner}}

---

## 1. 趋势 (Module 1)
- **方向**: {{trends.direction_12mo}}
- **季节高峰**: {{trends.seasonality.peak_months | join ", "}}
- **5 年长期信号**: {{trends.long_term_signal}}
- **依据**: {{trends.claim_meta.sources | bullets}}　·　**置信度**: {{trends.claim_meta.confidence}}

## 2. 需求量化 (Module 2)
- **月搜索量段**: {{demand.volume_band}}
- **核心 query**: {{demand.head_keywords | join ", "}}
- **rising queries**: {{demand.rising_queries | bullets}}
- **依据**: {{demand.claim_meta.sources | bullets}}

## 3. 用户洞察 (Module 3) — Pain Points

| ID | 痛点 | 频次 | 置信度 | 主源 |
|---|---|---|---|---|
{{#each pain_points}}
| {{id}} | {{summary}} | {{frequency}} | {{claim_meta.confidence}} | {{claim_meta.sources[0]}} |
{{/each}}

> **场景剪影**：{{user_scenarios | quote}}

## 4. 竞品分析 (Module 4)

| ID | 品牌 | 主打角度 | 价格带 | 可见弱点 |
|---|---|---|---|---|
{{#each competitors}}
| {{id}} | {{brand}} ([站点]({{url}})) | {{key_angle}} | {{price_band}} | {{visible_weakness}} |
{{/each}}

## 5. 广告情报 (Module 5)
- **常见 hook 模板**:
{{ad_intelligence.common_hooks | bullets}}
- **格式分布**: {{ad_intelligence.format_mix | summarize}}
- **平均 CPM 段**: {{ad_intelligence.avg_cpm_band}}
- **TOP creatives**: {{ad_intelligence.top_creatives | snapshot}}

## 6. 受众画像 (audience_profiles)

> 02 选品 / 04 素材 / 08 投流 必须按 ID 引用

{{#each audience_profiles}}
### {{id}} — {{label}}
- **人口**: {{demographics.age_range}} · {{demographics.gender}} · {{demographics.geo}}
- **心理**: {{psychographics.values | join ", "}}
- **痛点 ref**: {{linked_pain_point_ids | join ", "}}
- **首选渠道**: {{preferred_channels | join ", "}}

{{/each}}

## 7. 供应信号 (supply_signals)
- **批发 cost 段**: {{supply_signals.wholesale_cost_band}}
- **MOQ 范围**: {{supply_signals.moq_range}}
- **lead time**: {{supply_signals.lead_time_days_band}} 天
- **主要供应国**: {{supply_signals.top_origin_countries | join ", "}}

---

## 待验证项 (low confidence)
{{#each low_confidence_items}}
- {{claim}} → 验证路径: {{verification_path}}
{{/each}}

## 下一步
- 运行 `/eec-02-product-selection` 把 audience_profiles + pain_points 转化成 SKU 候选
{{#if needs_deep_dive}}
- 建议先深挖: {{needs_deep_dive | bullets}}
{{/if}}
