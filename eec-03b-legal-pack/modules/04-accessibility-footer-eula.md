# Module 4: Accessibility / Footer / EULA(可选)

## Accessibility Statement

### 来源

| 字段 | 来源 | 占位策略 |
|---|---|---|
| wcag_level | 05.accessibility_baseline.wcag_level | 默认 "AA" |
| wcag_version | 同上 | 默认 "2.2" |
| axe_score.pass | 05.accessibility_baseline.axe_score.pass | 默认 0 + report.md TODO |
| axe_score.violations | 同上 | 默认 0 + report.md TODO |
| axe_score.measured_at | 同上 | 默认今日 |
| conformance_status | 计算: violations==0 ⇒ full / 1-3 ⇒ partial / >3 ⇒ non_compliant | required |
| known_issues[] | 05 报告中 violations 详情 | optional |
| contact_email | 03.official_contacts.accessibility | fallback controller_email |

### body_md（≥200 字）要点

1. 承诺等级 (WCAG <version> Level <A/AA/AAA>)
2. 测试方式 (axe-core automated + manual screen reader spot-check)
3. 已知问题 + ETA (引 known_issues)
4. 反馈渠道 (contact_email + 响应 SLA, e.g., 5 business days)
5. 替代格式承诺 ("We provide alternative formats — contact us")

## Footer Link Group

`heading` 默认 "Legal"；`links[]` 必含全部已生成文档对应的 /pages/* 路由。

### 标准映射

| 文档 | route_path | label |
|---|---|---|
| privacy | /pages/privacy | Privacy |
| terms | /pages/terms | Terms |
| cookie_policy | /pages/cookies | Cookies |
| accessibility_statement | /pages/accessibility | Accessibility |
| ccpa_disclosure | /pages/ccpa-do-not-sell | Do Not Sell My Info |
| warranty_terms | /pages/warranty | Warranty |
| dmca_contact | /pages/dmca | DMCA |
| gdpr_data_request_contact | /pages/gdpr-data-request | GDPR data request |
| prop65_warning (若触发) | /pages/prop65 | Prop 65 |
| eula_app (若 include) | /pages/eula | App EULA |

`shipping-returns` 不在本 skill 范围（属于运营条款，留在 05/03 处）。

## EULA App (optional)

仅 `include_eula=true` 触发。

### 字段

- app_name (e.g., "Roborock Companion")
- platforms[] (ios | android | web)
- license_grant_summary (≤400 字)
- data_collection_summary (≤600 字 — 必须与 cookie_policy 一致)
- body_md (≥200 字)

### body_md 要点

1. 授予 (revocable, non-exclusive, non-transferable) license to use
2. 限制 (no reverse engineer, no resale)
3. 数据收集（必须与 privacy 一致 — 不一致 → 报错）
4. 终止条款（哪些行为触发 termination）
5. 适用法律 + 争议解决

## 输出

```jsonc
"accessibility_statement": { ... },
"footer_link_group": { "heading": "Legal", "links": [...] },
"eula_app"?: { ... }
```
