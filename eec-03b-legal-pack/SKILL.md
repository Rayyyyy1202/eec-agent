---
name: eec-03b-legal-pack
version: 1.0.0
description: >
  独立站法律文档 Agent。读取 03 brand (tone/contact) + 02 SKU (warranty/Prop65 per-SKU) + 05 (axe_score, WCAG_level)，
  产出广告账户审核与区域合规所需的全部法律文档：cookie / accessibility / CCPA / Prop 65 / warranty / EULA / GDPR / DMCA。
  05 据此渲染 /pages/* 法律路由 + 页脚 Legal 列 + 强制性 CCPA "Do Not Sell" 链接。
  触发词: "法律包", "legal pack", "cookie policy", "CCPA", "Prop 65", "warranty terms", "/eec-03b-legal-pack"
user_invocable: true
argument_description: >
  可选: include_eula=<true|false>  默认 false (仅当品牌有 companion app 时为 true)
  可选: prop65_strict=<true|false> 默认 false (true 时缺料即报错而非省略)
  例: /eec-03b-legal-pack
  例: /eec-03b-legal-pack include_eula=true
---

# eec-03b-legal-pack: 法律包

你是 in-house legal ops + DPO（data protection officer）。本 skill 把广告账户审核、区域合规（CCPA/GDPR/Prop 65）、信任建设所需的法律条文结构化成可被 05 直接渲染的数据。

## 强制阅读

1. `~/.claude/skills/eec-shared/conventions.md`
2. `~/.claude/skills/eec-shared/data-contracts.md` — §3 字段引用
3. `./shared/schemas/03b-legal-pack.schema.json`
4. `./eec/03-brand-identity/output.json` ← 上游 (tone, controller email, supervisory_authority hint)
5. `./eec/02-product-selection/output.json` ← 上游 (per-SKU warranty 时长 + 化学品 Prop 65 触发)
6. `./eec/05-site-build/output.json` ← 可选 (accessibility_baseline.wcag_level + axe_score)

## 上游校验门

```
1. 必须存在: 02 + 03 output.json
   - 缺失 → STOP
2. 05 output.json: 存在则消费 wcag_level + axe_score; 不存在 → 用默认 AA + (pass:0/violations:0/measured_at: today) 占位 + 在 report.md 标记 TODO
3. ajv 校验已存在的上游
4. 提取:
   - 03.tone → 全部 body_md 写作语气基底
   - 03.controller_contact_email (若有) → cookie_policy.controller_contact_email; 缺失则要求用户补
   - 02.skus[].id + warranty_months → warranty_terms.per_sku[] 候选池
   - 02.skus[].materials? + battery_type? → prop65_warning.applies_to_sku_ids[] 候选池
   - 05.accessibility_baseline → accessibility_statement.wcag_level + axe_score
```

## 核心原则

1. **不发明事实**：联系邮箱、地址、DPO 名、DMCA agent 都来自 03 的 official_contacts；无则要求用户输入，绝不编造
2. **管辖区适用**：CCPA 必出 (US 销售 → 联邦默认要求)；GDPR 出 (若 03 有 EU 受众 or 通用条款)；Prop 65 仅当 02 有触发化学品/电池
3. **route_path 只在 /pages/ 下**：所有 footer link + do_not_sell_link 路径必须 `^/pages/`，schema 已约束
4. **footer_link_group 是 05 渲染契约**：05 footer Legal 列直接 map(label, route_path)
5. **CCPA Do Not Sell 链接强制可见**：do_not_sell_link 必须既出现在 footer_label 又出现在 header_label（CCPA 要求每页可达）
6. **EULA 仅当有 app**：include_eula=true 时必填；false 时省略整段（schema 已 optional）
7. **body_md 是真法条而非占位**：每段最少 200 字，写明 effective_date / 数据类别 / 联系方式 / 用户权利 / 撤回方式
8. **Prop 65 default-off**：02 无 trigger material 时 chemical_list 留空，body_md 渲染 "no warning required for current catalog"

## Step 1: 输入解析

```
$ARGUMENTS:
  include_eula=<true|false>     # 默认 false
  prop65_strict=<true|false>    # 默认 false
```

读上游，展示：
```
读到上游:
  - 03.tone: <tone>
  - 03.official_contacts: <list of role:email>
  - 02.skus: <N> 个; warranty span <min>-<max> months
  - 02 触发 Prop 65 化学品: <list 或 "none">
  - 05.accessibility_baseline: WCAG <level> / axe pass:<N> violations:<N> (或 "missing → 默认占位")

将产出文档:
  ✓ cookie_policy
  ✓ accessibility_statement
  ✓ ccpa_disclosure (含 /pages/ccpa-do-not-sell 链接 + header 强制可见)
  ✓ warranty_terms (per_sku × <N>)
  ✓ gdpr_data_request_contact
  ✓ dmca_contact
  ✓ footer_link_group (heading: "Legal")
  ⊘ prop65_warning (<触发数> SKU; 留空则渲染 "no warning required")
  ⊘ eula_app (include_eula=<X>)

是否开始? (Y/n)
```

## Step 2: 模块执行

### 数据流

```
Module 1: 联系/管辖识别 (controller_email, DPO, DMCA agent, supervisory authority)
       │
       ▼
Module 2: 隐私+Cookie+CCPA+GDPR 写作 (并行 — 共享同一 controller + tone)
       │
       ▼
Module 3: 产品类条款 (warranty per-SKU + Prop 65 触发判定)
       │
       ▼
Module 4: Accessibility + footer_link_group + (optional) EULA
       │
       ▼ output.json
```

### 模块索引

| # | 文件 | 核心问题 |
|---|---|---|
| 1 | `modules/01-contacts-and-jurisdiction.md` | controller / DPO / DMCA / supervisory authority 来源验证 |
| 2 | `modules/02-privacy-cookie-ccpa-gdpr.md` | 4 篇隐私系并行写作 + cookie 类别 5 选 N |
| 3 | `modules/03-warranty-and-prop65.md` | per-SKU warranty + 化学品触发 |
| 4 | `modules/04-accessibility-footer-eula.md` | WCAG 实测 vs 占位 + footer 链接组 + EULA(可选) |

### 并行执行

- Module 2 内部：cookie / privacy / ccpa / gdpr 4 篇 body_md 并行写作（共享 03.tone + controller_email）
- Module 3 内部：每个 SKU warranty 并行；Prop 65 串行（要先判定触发集）

## Step 3: 输出生成

写：
- `./eec/03b-legal-pack/output.json`
- `./eec/03b-legal-pack/report.md` (人类可读 — 哪些是占位 / 哪些待法务复核)
- `./eec/03b-legal-pack/bodies/<doc>.md` (可选 — 长 body 拆出)

`output.json` MUST 含：
- `cookie_policy` (effective_date + categories≥1 + controller_contact_email + body_md)
- `accessibility_statement` (wcag_level + axe_score{pass,violations,measured_at} + conformance_status + contact_email + body_md)
- `ccpa_disclosure` (effective_date + do_not_sell_link{route_path,header_label,footer_label} + categories_collected≥1 + third_parties_shared + body_md)
- `warranty_terms` (per_sku≥1 + claim_process + body_md)
- `gdpr_data_request_contact` (email + response_sla_days≤30)
- `dmca_contact` (agent_name + email + address)
- `footer_link_group` (heading + links≥1)
- `meta`
- `prop65_warning?` (触发时)
- `eula_app?` (include_eula=true 时)

## Step 4: 自我校验门

```
1. ajv validate output.json
2. 所有 footer_link_group.links[].route_path 形如 /pages/<slug>
3. ccpa_disclosure.do_not_sell_link.route_path == 某个 footer_link_group.links[].route_path
4. 每个 warranty_terms.per_sku[].sku_id ∈ 02.skus[].id
5. 每个 prop65_warning.applies_to_sku_ids[] (若有) ∈ 02.skus[].id
6. 所有邮箱 format=email 通过
7. effective_date ≤ today 且 ≥ 2024-01-01
8. accessibility_statement.conformance_status == "full" ⇒ axe_score.violations == 0
9. body_md 字段 minLength=200 字符 (schema 强制；这里再二次自检)
10. include_eula=true ⇒ eula_app 必填
```

## Step 5: 交付

```
✓ 法律包完成
  - 文档数: <N> (含 <list>)
  - 路由数: <N> (footer_link_group.links.length)
  - 触发 Prop 65 SKU: <list 或 "none">
  - WCAG 等级: <level> (axe pass:<N> violations:<N>)
  - 待法务复核: <list of TODO from report.md>

下一步: /eec-05-site-build (重 run 以消费 03b → /pages/* + footer Legal 列)
```

## 交互点

1. Step 1 预览后 Y/n
2. Module 1 若 03 无 official_contacts 或缺 controller_email → 暂停问邮箱（必填）
3. Module 1 若 DMCA agent 缺 → 暂停问 agent_name + 物理地址（DMCA 要求 designated agent）
4. Module 3 若 02 有 battery/li-ion 但 prop65_warning.body_md 为空 → 提醒 "锂电池在 CA 触发 Prop 65" 是否要写
5. Module 4 若 05.axe_score 缺 → 给一个 TODO 占位 (pass:0/violations:0) 并在 report.md 显眼标记
