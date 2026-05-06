# 技术 SEO 报告

**生成**: {{meta.generated_at}}　|　Skill v{{meta.skill_version}}
**Site**: {{site_url}}　|　**Sitemap**: {{sitemap_url}}

---

## TL;DR
- **Lighthouse**: Perf {{audit_report.lighthouse_scores.performance}} / A11y {{audit_report.lighthouse_scores.accessibility}} / BP {{audit_report.lighthouse_scores.best_practices}} / SEO {{audit_report.lighthouse_scores.seo}}
- **CWV (p75)**: LCP {{core_web_vitals_baseline.lcp_p75_ms}}ms · INP {{core_web_vitals_baseline.inp_p75_ms}}ms · CLS {{core_web_vitals_baseline.cls_p75}}
- **Schema.org**: {{schema_org_emitted | length}} types ({{schema_org_validated_count}} validated)
- **关键词机会**: {{keyword_opportunities | length}} 条 → 喂给 07b
- **Applied changes**: {{applied_changes | length}}

---

## 1. Lighthouse 审计

| 维度 | 分数 |
|---|---|
| Performance | {{audit_report.lighthouse_scores.performance}}/100 |
| Accessibility | {{audit_report.lighthouse_scores.accessibility}}/100 |
| Best Practices | {{audit_report.lighthouse_scores.best_practices}}/100 |
| SEO | {{audit_report.lighthouse_scores.seo}}/100 |

### 技术问题清单

| Severity | Category | 描述 | 影响路由 | 建议 |
|---|---|---|---|---|
{{#each audit_report.technical_issues}}
| {{severity}} | {{category}} | {{description}} | {{affected_routes | join ", "}} | {{fix_recommendation}} |
{{/each}}

## 2. Core Web Vitals (baseline)

| Route | LCP p75 | INP p75 | CLS p75 |
|---|---|---|---|
| **整站** | {{core_web_vitals_baseline.lcp_p75_ms}}ms | {{core_web_vitals_baseline.inp_p75_ms}}ms | {{core_web_vitals_baseline.cls_p75}} |
{{#each core_web_vitals_baseline.by_route}}
| `{{route}}` | {{lcp_p75_ms}}ms | {{inp_p75_ms}}ms | {{cls_p75}} |
{{/each}}

## 3. Schema.org 已发出

| Route | Type | Validated | Validator |
|---|---|---|---|
{{#each schema_org_emitted}}
| `{{route}}` | {{type}} | {{validated ? "✓" : "✗"}} | {{validator}} |
{{/each}}

## 4. Sitemap & robots
- **sitemap_url**: {{sitemap_url}}
- **robots_txt_path**: {{robots_txt_path}}
- **canonical_strategy**: {{canonical_strategy}}

## 5. 内链概况
- 总内链数: {{internal_link_summary.total}}
- Orphan 页面: {{internal_link_summary.orphans}}
- 平均深度: {{internal_link_summary.depth}}

## 6. 推荐重定向

| From | To | Code | Reason |
|---|---|---|---|
{{#each redirects_recommended}}
| `{{from}}` | `{{to}}` | {{code}} | {{reason}} |
{{/each}}

---

## 7. 关键词机会 → 喂 07b

| Keyword | Intent | Difficulty | 当前排名 | 月搜量估 | 建议落地 route |
|---|---|---|---|---|---|
{{#each keyword_opportunities}}
| {{keyword}} | {{intent}} | {{difficulty}} | {{current_rank}} | {{monthly_volume_estimate}} | `{{suggested_target_route}}` |
{{/each}}

---

## 8. 已应用变更（写回 05 仓库）

| Type | Target | applied_at | Diff |
|---|---|---|---|
{{#each applied_changes}}
| {{change_type}} | `{{target}}` | {{applied_at}} | {{diff_summary}} |
{{/each}}

> 全部命中 05 `rebuild_protocol.writeback_target_files[]` 白名单。

## 下一步
- `/eec-07b-content-marketing` — 用 keyword_opportunities[] 排 calendar
- 重跑 06 校验确认 schema.org 与 events 不冲突
- 监测 CWV: 设阈值 LCP < 2500ms / INP < 200ms / CLS < 0.1
