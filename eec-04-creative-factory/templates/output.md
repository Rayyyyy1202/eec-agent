# 素材工厂 — Manifest

**生成**: {{meta.generated_at}}　|　Skill v{{meta.skill_version}}
**总资产**: {{assets | length}} images　|　{{copy_blocks | length}} copy blocks　|　{{video_briefs | length}} video briefs

---

## TL;DR
- **覆盖矩阵**: {{asset_coverage_matrix | summarize}}
- **主推 SKU 覆盖**: {{hero_sku_coverage | bullets}}
- **目标渠道**: {{channels_targeted | join ", "}}
- **未审批**: {{assets_unapproved_count}} 条

---

## 命名约定
- **Pattern**: `{{naming_convention.pattern}}`
- **示例**: `{{naming_convention.example}}`
- **命中率**: {{naming_convention.compliance_pct}}%

---

## 1. Image Assets

| ID | 类型 | 用途 | 渠道 | 语言 | SKU | 受众 | 文件 | approved |
|---|---|---|---|---|---|---|---|---|
{{#each assets}}
| {{id}} | {{type}} | {{purpose}} | {{channel}} | {{language}} | {{sku_id}} | {{audience_ids | join ","}} | `{{file_path}}` | {{approved}} |
{{/each}}

## 2. Copy Blocks

{{#each copy_blocks}}
### {{id}} — {{purpose}} ({{channel}}, {{language}})
- **headline**: "{{headline}}" ({{headline | length}} chars)
- **subhead**: {{subhead}}
- **body**: {{body | truncate 200}}
- **CTA**: "{{cta}}"
- **SKU/受众 ref**: {{sku_id}} / {{audience_ids | join ", "}}
- **平台约束**: {{platform_constraints_met ? "✓ 通过" : "✗ 超限"}} ({{char_count}} chars)

{{/each}}

## 3. Video Briefs

{{#each video_briefs}}
### {{id}} — {{channel}} {{format}} ({{duration_s}}s, {{language}})
- **Hook**: "{{hook}}"
- **CTA**: "{{cta}}"
- **SKU**: {{sku_id}}
- **场景**:
{{#each scenes}}
  - **{{second_start}}s** — {{shot}}
    - VO: "{{vo}}"
    - 屏文: "{{on_screen_text}}"
{{/each}}

{{/each}}

---

## 资产覆盖矩阵

| Purpose × Channel × Lang | 数量 |
|---|---|
{{#each asset_coverage_matrix}}
| {{@key}} | {{this}} |
{{/each}}

> 主推 SKU `{{hero_sku_id}}` 在 (hero × web × {{primary_language}}) 至少 1 条 image: **{{hero_coverage_check}}**

## 平台约束自检
{{#each platform_constraint_checks}}
- {{platform}} {{purpose}}: {{passed_count}}/{{total_count}} 通过
{{/each}}

## 下一步
- `/eec-05-site-build` 引用 asset_ids[] 搭页面
- `/eec-08-paid-ads` 用 asset_ids[] + copy_block_id 组 creative_pairing[]
