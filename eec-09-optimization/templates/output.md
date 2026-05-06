# 优化复盘 — Period {{data_pull.period_start}} → {{data_pull.period_end}}

**生成**: {{meta.generated_at}}　|　Skill v{{meta.skill_version}}
**模式**: {{run_mode}} (real_apply / dry_run)

---

## TL;DR
- **数据期**: {{data_pull.period_start}} → {{data_pull.period_end}} ({{period_days}} 天)
- **Sources**: {{data_sources | length}} ({{data_sources_ok_count}} ok, {{data_sources_fail_count}} fail)
- **Diagnostics**: {{diagnostics | length}} ({{diagnostics_critical_count}} critical, {{diagnostics_high_count}} high)
- **Decisions**: {{decisions | length}}
- **Applied**: {{applied_changes | length}} ({{applied_changes_real_count}} real / {{applied_changes_dryrun_count}} dry-run)
- **Experiments**: {{experiments | length}}
- **Next actions**: {{next_actions | length}}

---

## 1. Data Sources

| Platform | Auth | env vars | Last pull | Status | Rows |
|---|---|---|---|---|---|
{{#each data_sources}}
| {{platform}} | {{auth_method}} | {{required_env_vars | join ","}} | {{last_pulled_at}} | **{{status}}** | {{rows_fetched}} |
{{/each}}

> 失败源详情:
{{#each data_sources_failed}}
- **{{platform}}** ({{status}}): {{error_detail}}
{{/each}}

## 2. Metrics by Dimension (摘要)

{{#each data_pull.metrics_by_dim}}
### {{dimension}} ({{rows | length}} rows)

| Key | Impr | Clicks | Spend | CTR | CVR | CPA | ROAS | Purch | Revenue |
|---|---|---|---|---|---|---|---|---|---|
{{#each rows}}
| {{key}} | {{impressions}} | {{clicks}} | {{spend.amount}} {{spend.currency}} | {{ctr | percent}} | {{cvr | percent}} | {{cpa.amount}} | {{roas}} | {{purchases}} | {{revenue.amount}} |
{{/each}}

{{/each}}

## 3. Diagnostics

| ID | Severity | Observation | Hypothesis | Related dims |
|---|---|---|---|---|
{{#each diagnostics}}
| {{id}} | **{{severity}}** | {{observation}} | {{hypothesis}} | {{related_dims | join ", "}} |
{{/each}}

## 4. Decisions

| ID | Action | Target | Type | Rationale | Expected | Diag refs |
|---|---|---|---|---|---|---|
{{#each decisions}}
| {{id}} | **{{action}}** | `{{target}}` | {{target_type}} | {{rationale}} | {{expected_impact}} | {{diagnostic_ids | join ","}} |
{{/each}}

## 5. Applied Changes

| Decision | Applied at | Before | After |
|---|---|---|---|
{{#each applied_changes}}
| {{decision_id}} | {{applied_at}} | `{{before | json}}` | `{{after | json}}` |
{{/each}}

> Mode: {{run_mode}} ({{run_mode == "dry_run" ? "**未真改**——人工应用建议" : "API call 已成功"}})

## 6. Experiments

{{#each experiments}}
### {{id}} — {{status}}
- **Hypothesis**: {{hypothesis}}
- **A**: {{variant_a}}
- **B**: {{variant_b}}
- **Metric**: `{{success_metric}}`
- **Duration**: {{duration_days}} 天
- **Min sample**: {{minimum_sample_size}}

{{/each}}

## 7. Next Actions

| Action | Owner | Due |
|---|---|---|
{{#each next_actions}}
| {{action}} | {{owner_role}} | {{due}} |
{{/each}}

---

## 校验状态
- 期间 ≥ 7 天: {{period_length_check}}
- ≥ 1 source ok: {{sources_ok_check}}
- 每 decision.diagnostic_ids ≥ 1: {{decision_diag_ref_check}}
- 每 decision.target 在 08/05 找到: {{decision_target_ref_check}}
- before/after 都是 object: {{change_shape_check}}

## 下一步
- 推荐复盘频率: {{recommended_cadence_days}} 天后再跑 `/eec-09-optimization`
- 如有 experiment.status=proposed: 走 next_actions 启动
- 如有 dry_run change: 人工审批后调 `/eec-09-optimization` 加 `--apply` 真改
