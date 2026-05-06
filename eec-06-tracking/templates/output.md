# 追踪 / 数据层 — Manifest

**生成**: {{meta.generated_at}}　|　Skill v{{meta.skill_version}}
**绑定 site**: {{site_build_writeback.target_repo_path}}

---

## TL;DR
- **events_spec**: {{events_spec | length}} 条 ({{required_13_events_check}} of 13 required)
- **destinations**: {{destinations | length}}
- **PII hash**: {{pii_hash_algorithm}} 🔒
- **Consent default**: ad_storage = `{{consent_mode.defaults.ad_storage}}`, analytics_storage = `{{consent_mode.defaults.analytics_storage}}`
- **GTM rebuild**: {{site_build_writeback.rebuild_executed ? "✓ 已执行" : "⚠ 未执行"}}　·　validation: {{site_build_writeback.post_rebuild_validation_status}}

---

## 1. Events Spec (≥13)

| Event Name | Trigger | Required Params |
|---|---|---|
{{#each events_spec}}
| `{{name}}` | {{trigger}} | {{required_params | join ", "}} |
{{/each}}

> Schema 校验 `allOf/contains` 强制 13 必有：page_view, view_item, add_to_cart, begin_checkout, purchase, sign_up, login, search, view_item_list, select_item, add_to_wishlist, remove_from_cart, share

## 2. Destinations

| ID | Type | Account | 状态 |
|---|---|---|---|
{{#each destinations}}
| {{id}} | {{type}} | {{account_id_placeholder}} | {{status}} |
{{/each}}

## 3. Consent Mode

- **Framework**: {{consent_mode.framework}}
- **适用 regions**: {{consent_mode.regions | join ", "}}
- **默认值**:
  - ad_storage: `{{consent_mode.defaults.ad_storage}}`
  - analytics_storage: `{{consent_mode.defaults.analytics_storage}}`
  - functionality_storage: `{{consent_mode.defaults.functionality_storage}}`
- **必填类目**: {{consent_mode.required_categories | join ", "}}

## 4. UTM Taxonomy

```
source:   {{utm_taxonomy.source_format}}
medium:   {{utm_taxonomy.medium_format}}
campaign: {{utm_taxonomy.campaign_format}}
content:  {{utm_taxonomy.content_format}}
term:     {{utm_taxonomy.term_format}}
```

> 08-paid-ads 的 utm_taxonomy_applied 必须命中以上格式。

---

## Phase 2 钩子（已填）

### H10 — email_consent_event
- event_name: `{{email_consent_event.event_name}}`
- params: {{email_consent_event.params | join ", "}}
- 目标 destinations (Phase 2): {{email_consent_event.destinations_phase2 | join ", "}}

### H11 — purchase_event_full_spec (含 H18)
- event_name: `{{purchase_event_full_spec.event_name}}`
- must_emit_fields:
{{purchase_event_full_spec.must_emit_fields | bullets}}
- H18 `is_first_purchase`: {{is_first_purchase_field_check ? "✓ 已含" : "✗ 缺失"}}

### H9 / H15 / H16 / H17
| Hook | 字段 | 状态 |
|---|---|---|
| H9 | newsletter_signup 触发器 | {{h9_status}} |
| H15 | order_status 数据流 | {{h15_status}} |
| H16 | shipping_event 数据流 | {{h16_status}} |
| H17 | refund 触发回写 | {{h17_status}} |

---

## 5. Site Build Writeback (闭环 05)

```yaml
target_repo_path: {{site_build_writeback.target_repo_path}}
files_modified:
  {{#each site_build_writeback.files_modified}}
  - path: {{path}}
    action: {{action}}
    in_whitelist: {{in_whitelist}}
  {{/each}}
rebuild_required: {{site_build_writeback.rebuild_required}}
rebuild_executed: {{site_build_writeback.rebuild_executed}}
rebuild_command_run: {{site_build_writeback.rebuild_command_run}}
post_rebuild_validation_status: {{site_build_writeback.post_rebuild_validation_status}}
```

> 所有 files_modified[].path 必须在 05 `rebuild_protocol.writeback_target_files[]` 白名单内。

## 6. 验证清单

| Check | 状态 |
|---|---|
{{#each validation_checklist}}
| {{item}} | {{status}} |
{{/each}}

---

## 交付物
- `output.json`
- `gtm-container.json` (导回 GTM 工作区) ← `{{gtm_container_export_path}}`
- 修改 05 仓库内文件（按 writeback whitelist）

## 下一步
- `/eec-07a-tech-seo` — 跑 Lighthouse + Schema.org 对接
- `/eec-08-paid-ads` — destinations[] 的 ID 直接被投流引用
