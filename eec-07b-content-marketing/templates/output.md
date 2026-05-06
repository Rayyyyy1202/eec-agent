# 内容营销 — Calendar & Drafts

**生成**: {{meta.generated_at}}　|　Skill v{{meta.skill_version}}
**editorial_voice**: ref → `{{editorial_voice_ref}}` (来自 03)

---

## TL;DR
- **Clusters**: {{keyword_clusters | length}}
- **Calendar**: {{content_calendar | length}} 篇 (横跨 {{calendar_span_weeks}} 周)
- **Drafts ready**: {{drafts | length}} 草稿
- **内链总数**: {{internal_link_map | length}}
- **Distribution channels**: {{distribution_plan | distinct channel | join ", "}}

---

## 1. Keyword Clusters

| ID | Topic | Head keyword | 长尾数 | Intent | 受众 ref | SKU refs |
|---|---|---|---|---|---|---|
{{#each keyword_clusters}}
| {{id}} | {{topic}} | `{{head_keyword}}` | {{long_tails | length}} | {{search_intent}} | {{audience_id}} | {{linked_sku_ids | join ","}} |
{{/each}}

## 2. Content Calendar

| ID | 日期 | 类型 | Title | 关键词 | Cluster | Owner | 状态 |
|---|---|---|---|---|---|---|---|
{{#each content_calendar}}
| {{id}} | {{scheduled_date}} | {{content_type}} | {{title}} | `{{target_keyword}}` | {{cluster_id}} | {{owner}} | {{status}} |
{{/each}}

## 3. Drafts (摘要)

{{#each drafts}}
### {{id}} — {{title}}
- **content ref**: {{content_id}} ({{content_calendar | findById content_id | get scheduled_date}})
- **Target keyword**: `{{target_keyword}}`
- **Secondary**: {{secondary_keywords | join ", "}}
- **预计阅读时间**: {{estimated_reading_time_min}} min
- **CTA SKU**: {{cta_sku_id}}
- **大纲**:
{{#each outline}}
  - **{{h}}** — {{text}}
{{/each}}
- **内链** ({{internal_links | length}}):
{{internal_links | bullets}}
- **正文**: `{{body_md_path}}`

{{/each}}

## 4. Internal Link Map

| Source | Target | Anchor |
|---|---|---|
{{#each internal_link_map}}
| `{{source}}` | `{{target}}` | "{{anchor}}" |
{{/each}}

## 5. Distribution Plan

| Content | Channel | 日期 |
|---|---|---|
{{#each distribution_plan}}
| {{content_id}} | {{channel}} | {{scheduled_date}} |
{{/each}}

---

## 校验状态
- editorial_voice_ref 是 ref 表达式: {{editorial_voice_check}}
- 每 cluster.audience_id ∈ 01: {{cluster_audience_ref_check}}
- 每 cluster.linked_sku_ids ∈ 02: {{cluster_sku_ref_check}}
- 每 draft.cta_sku_id ∈ 02: {{draft_cta_ref_check}}
- 前 5 草稿 internal_links ≥ 2: {{drafts_link_density_check}}

## 下一步
- 把 drafts/ 喂给写手或 LLM 写完整稿
- 发布后回 07a 校验 schema 是否需要 BlogPosting
- 60 天后复盘哪些 cluster 转化最好（接 09-optimization）
