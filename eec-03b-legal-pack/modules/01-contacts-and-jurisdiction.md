# Module 1: 联系/管辖识别

## 目标

确定 4 类联系角色 + 2 类管辖判定，作为后续所有 body_md 的引用源。

## 4 类联系角色

| 角色 | 用于 | 来源优先级 |
|---|---|---|
| controller_contact_email | cookie_policy / privacy / GDPR | 03.official_contacts.privacy → 03.contact_email → 用户输入 |
| accessibility_contact_email | accessibility_statement | 03.official_contacts.accessibility → controller_contact_email |
| ccpa_request_form_email | ccpa_disclosure.request_form_email | 03.official_contacts.ccpa → controller_contact_email |
| dmca_agent | dmca_contact (name + email + address) | 03.official_contacts.dmca → 用户输入 (强制) |

**红线**：邮箱不存在时不要编造。`legal@<brand>.com` 也算编造，必须有上游或用户明确给出。

## 2 类管辖判定

```
US 销售?  (默认 yes — 否则 04b 已挡住)
  → CCPA 必出
  → Prop 65 当且仅当 02 有 trigger material

EU/UK 受众?  (从 03.target_markets 或 03.audience_geos 推断)
  → GDPR 必出 + supervisory_authority 字段填具体国家 DPA (e.g., "ICO (UK)" / "CNIL (FR)")
  → 缺失 EU 时仍出 GDPR (好习惯), supervisory_authority 留 "Not applicable - no EU establishment"
```

## DMCA 强制字段

DMCA designated agent 是联邦法律要求 (17 U.S.C. § 512)：
- agent_name (法人或自然人名)
- email (与 controller_email 可同可不同)
- address (物理地址，不能是 PO Box — 联邦要求 street address)
- phone (推荐但非必须)

## 输出

写入 `output.json`:
```jsonc
"gdpr_data_request_contact": { "email": "...", "response_sla_days": 30, ... },
"dmca_contact": { "agent_name": "...", "email": "...", "address": "...", "phone": "..." }
```
