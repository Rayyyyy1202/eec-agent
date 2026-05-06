# 建站交付 — {{brand.brand_name}}

**生成**: {{meta.generated_at}}　|　Skill v{{meta.skill_version}}
**Site URL**: {{site_url}}　|　**Repo**: `{{repo_path}}`

---

## TL;DR
- **Tech stack**: {{tech_stack.frontend}} + {{tech_stack.hosting}} ({{tech_stack.payment_processor}})
- **路由数**: {{routes | length}}
- **SKU 已上**: {{cms_handles | filter type=product | length}}
- **Lighthouse SEO 占位**: {{accessibility_baseline.axe_score}}
- **GTM rebuild_protocol**: {{analytics_endpoints.rebuild_protocol ? "✓ 已声明" : "✗ 缺失"}}

---

## 1. 技术栈
| 层 | 选型 |
|---|---|
| Frontend | {{tech_stack.frontend}} |
| Backend | {{tech_stack.backend}} |
| CMS | {{tech_stack.cms}} |
| Hosting | {{tech_stack.hosting}} |
| Payment | {{tech_stack.payment_processor}} |
| Search | {{tech_stack.search}} |

## 2. 路由

| Path | Component | SKU refs | Asset refs | Copy refs | SEO intent |
|---|---|---|---|---|---|
{{#each routes}}
| `{{path}}` | {{component}} | {{sku_ids | join ","}} | {{asset_ids | join ","}} | {{copy_block_ids | join ","}} | {{seo_intent}} |
{{/each}}

## 3. SEO Meta

| Route | Title (≤60) | Description (≤160) | OG | Schema |
|---|---|---|---|---|
{{#each seo_meta}}
| `{{route}}` | {{title}} ({{title | length}}) | {{description | truncate 80}} ({{description | length}}) | {{og_image ? "✓" : "—"}} | {{schema_org_type}} |
{{/each}}

## 4. Checkout

- **类型**: {{checkout_flow.type}}
- **支付**: {{checkout_flow.payment_methods | join ", "}}
- **运费区**: {{checkout_flow.shipping_zones | join ", "}}
- **游客 checkout**: {{checkout_flow.guest_checkout}}
- **H2 abandonment_recovery_hook_present**: {{checkout_flow.abandonment_recovery_hook_present}}

> 强校验：shipping_zones 与 02 SKU.restricted_geo 不冲突 ← {{shipping_geo_check_status}}

## 5. Analytics 接入点 (供 06 写入)

```yaml
gtm_container_placeholder: {{analytics_endpoints.gtm_container_placeholder}}
consent_layer_slot:        {{analytics_endpoints.consent_layer_slot}}
data_layer_global:         {{analytics_endpoints.data_layer_global}}

rebuild_protocol:
  rebuild_command: {{analytics_endpoints.rebuild_protocol.rebuild_command}}
  writeback_target_files:
    {{#each analytics_endpoints.rebuild_protocol.writeback_target_files}}
    - {{this}}
    {{/each}}
  post_rebuild_validation: {{analytics_endpoints.rebuild_protocol.post_rebuild_validation}}
```

> ⚠️ 06-tracking 写入必须命中此 whitelist；否则拒绝。

## 6. 环境变量需要
{{#each env_vars_required}}
- `{{name}}` ({{scope}}) — {{purpose}}{{#if secret}} 🔐 secret{{/if}}
{{/each}}

## 7. 可访问性
- **WCAG 等级**: {{accessibility_baseline.wcag_level}}
- **axe score**: {{accessibility_baseline.axe_score}}
- **已知问题**: {{accessibility_baseline.known_issues | bullets}}

---

## 下一步
1. `/eec-06-tracking` — 注入真实 GTM ID + 13 events
2. `/eec-07a-tech-seo` — 跑 Lighthouse 拿 baseline
3. 设置 env vars，运行 `{{analytics_endpoints.rebuild_protocol.rebuild_command}}` 部署
