# 投流方案

**生成**: {{meta.generated_at}}　|　Skill v{{meta.skill_version}}
**测试预算**: {{budget_plan.total_test_budget.amount}} {{budget_plan.total_test_budget.currency}}

---

## TL;DR
- **平台**: {{account_structure | map platform | join " · "}}
- **Campaigns**: {{account_structure | flatten campaigns | length}}
- **Audiences**: {{audiences | length}}
- **Creative pairings**: {{creative_pairing | length}}
- **Destinations 依赖**: {{destinations_required | join ", "}} (ref 06)
- **Launch checklist**: {{launch_checklist | filter status=pass | length}}/{{launch_checklist | length}} pass

---

## 1. 账户结构

{{#each account_structure}}
### {{platform}}

| Campaign | Objective | Daily Budget | Audience | Creative | Landing | Optim Event |
|---|---|---|---|---|---|---|
{{#each campaigns}}
| {{id}} `{{name}}` | {{objective}} | {{daily_budget.amount}} {{daily_budget.currency}} | {{audience_ids | join ","}} | {{creative_pairing_ids | join ","}} | `{{landing_route}}` | `{{optimization_event}}` |
{{/each}}

{{/each}}

> 校验：每 `landing_route` ∈ 05.routes[].path　·　每 `optimization_event` ∈ 06.events_spec[].name

## 2. Audiences (paud_NNN)

| ID | Platform | Type | Size band | Source ref |
|---|---|---|---|---|
{{#each audiences}}
| {{id}} | {{platform}} | {{type}} | {{size_band}} | {{source_audience_id}} {{source_event_name ? "(event: " + source_event_name + ")" : ""}} |
{{/each}}

## 3. Creative Pairings

| ID | Asset(s) | Copy | Audience | Hook | Format |
|---|---|---|---|---|---|
{{#each creative_pairing}}
| {{id}} | {{asset_ids | join ","}} | {{copy_block_id}} | {{audience_id}} | "{{hook}}" | {{format}} |
{{/each}}

> 全部 asset_ids ∈ 04.assets[]　·　copy_block_id ∈ 04.copy_blocks[]　·　audience_id ∈ audiences[].id

## 4. Budget Plan

- **总测试预算**: {{budget_plan.total_test_budget.amount}} {{budget_plan.total_test_budget.currency}}
- **Kill threshold**: {{budget_plan.kill_threshold}}
- **Scaling rule**: {{budget_plan.scaling_rule}}

| Platform | % |
|---|---|
{{#each budget_plan.allocation_by_platform}}
| {{platform}} | {{pct}}% |
{{/each}}

> Sum check: {{allocation_sum_check ? "✓ = 100" : "✗ ≠ 100"}}

## 5. UTM 应用示例

| Campaign | source | medium | campaign | content | term |
|---|---|---|---|---|---|
{{#each utm_taxonomy_applied.examples}}
| {{campaign_id}} | `{{utm_source}}` | `{{utm_medium}}` | `{{utm_campaign}}` | `{{utm_content}}` | `{{utm_term}}` |
{{/each}}

> 命中 06.utm_taxonomy.campaign_format pattern: {{utm_format_check}}

## 6. Destinations & Pixels (ref 06)
- **destinations_required**: {{destinations_required | join ", "}}
- **pixels_required**: {{pixels_required | join ", "}}

## 7. Launch Checklist

| Item | Status | Evidence |
|---|---|---|
{{#each launch_checklist}}
| {{item}} | {{status}} | {{evidence}} |
{{/each}}

---

## Restricted geo 自检
- 02 SKU 的 restricted_geo[]: {{sku_restricted_geo | join ", "}}
- Campaign 投放区: {{campaign_targeting_geo | join ", "}}
- 冲突: {{geo_conflict_count}} 处 ({{geo_conflict_status}})

## 下一步
- 全部 launch_checklist=pass → 实际启动
- 7-14 天后跑 `/eec-09-optimization` 收数据看决策
- destinations_required 中任何 `pending` → 回 06 完成接入
