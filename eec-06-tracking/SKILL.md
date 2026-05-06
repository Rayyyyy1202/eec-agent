---
name: eec-06-tracking
version: 1.0.0
description: >
  独立站追踪 Agent。读取 05 站点，按 5 大模块产出: 13 个必有事件规格、GTM container、
  consent 模式 (GDPR/CCPA)、UTM 分类法、PII SHA-256 校验、写回 05 仓库 (GTM ID 落 env + 重建)。
  闭环关键 skill —— 必须把 site_build_writeback 跑完。
  触发词: "追踪", "tracking", "GTM", "/eec-06-tracking"
user_invocable: true
argument_description: >
  可选: 目标合规框架 (gdpr / ccpa / global)。默认沿用 05 的 region 推导。
  例: /eec-06-tracking
  例: /eec-06-tracking framework=gdpr
---

# eec-06-tracking: 追踪与 GTM 闭环

你是一个 DTC 数据工程师 + measurement architect。本 skill 把 05 留好的槽位填实：
13 个事件、GTM container、consent 默认 denied、PII SHA-256，再**写回 05 仓库**并执行 rebuild —— 闭环。

## 强制阅读

1. `~/.claude/skills/eec-shared/conventions.md`
2. `~/.claude/skills/eec-shared/data-contracts.md` — §5 闭环图（05 ↔ 06）
3. `~/.claude/skills/eec-shared/phase2-hooks.md` — 你负责 H9, H10, H11, H15, H16, H17, H18（7 个钩子）
4. `~/.claude/skills/eec-shared/schemas/06-tracking.schema.json`
5. `./eec/05-site-build/output.json` ← 上游（必读）
6. `./eec/05-site-build/repo/` ← 你要写回的目标

## 上游校验门

```
1. 必须存在: 05-site-build/output.json
   - 缺失 → STOP
2. ajv 校验 05 output
3. 提取 (硬约束):
   - 05.repo_path → 写回目标根
   - 05.analytics_endpoints.gtm_container_placeholder → 你填的占位名
   - 05.analytics_endpoints.consent_layer_slot → consent 注入点
   - 05.analytics_endpoints.rebuild_protocol.writeback_target_files[] → 白名单（写回必须在内）
   - 05.analytics_endpoints.rebuild_protocol.rebuild_command → 你要执行
   - 05.analytics_endpoints.rebuild_protocol.post_rebuild_validation? → 你要执行
   - 05.checkout_flow.abandonment_recovery_hook_present → 决定 cart_abandoned 触发是否 ready
4. 如果 writeback_target_files 为空 → STOP，反馈 05 必须先声明白名单
```

## 核心原则（不可妥协）

1. **13 个事件 minimum**：page_view, view_item, add_to_cart, begin_checkout, purchase, email_signup, cart_abandoned (H15), email_unsubscribed (H16), return_initiated (H17), refund (H17), order_shipped (H17), order_delivered (H17), order_canceled (H17)。schema 用 `allOf/contains` 校验
2. **purchase 至少 6 字段** (H11)：order_id, items, shipping_address, customer_email_hash, total, is_first_purchase (H18) — 缺一不可
3. **PII 必 SHA-256**：`pii_hash_algorithm` 锁 const "sha256"。所有标 `pii: true` 的参数发到广告平台前必须 hash (lowercase hex, trim+lowercase normalized)
4. **consent 默认 denied**：analytics_storage / ad_storage / ad_user_data / ad_personalization 默认 denied，consent 后 update
5. **写回必须在白名单内**：`site_build_writeback.files_modified[].path` 每条必须 ∈ 05.writeback_target_files[]
6. **重建闭环必须真跑**：`rebuild_executed=true` + `post_rebuild_validation_status` 不能是 not_applicable（除非 05 没声明）
7. **email_signup 永远存在**：即便 MVP 不发邮件，event 必须先在
8. **email_consent_event 块完整** (H10)：destinations_phase2 至少 1 个占位（type: internal_db）
9. **GTM container 落盘**：导出为 `gtm_container_export_path` 指定路径的 .json，可重新导入

## Step 1: 输入解析

```
$ARGUMENTS:
  framework=<gdpr|ccpa|global|none>   # 默认: 据 05/01 推导
```

读上游，展示：
```
读到上游:
  - 站点: <site_url>
  - 仓库: <repo_path>
  - GTM 占位: <gtm_container_placeholder>
  - consent 槽: <consent_layer_slot>
  - 写回白名单: <writeback_target_files>
  - 重建命令: <rebuild_command>
  - 弃单钩子已就绪: <true/false>

将产出:
  - 13 个事件 + 必要 destinations (ga4, meta_pixel, [tiktok_pixel], [google_ads])
  - consent 模式: <framework>
  - GTM container .json (导出)
  - 写回 05 仓库: <writeback_target_files>
  - 执行重建: <rebuild_command>

是否开始? (Y/n)
```

## Step 2: 模块执行

### 数据流

```
Module 1: 事件规格 (13 必有 + 加 SKU view 等可选 → events_spec[])
       │  并行: 每个事件独立设计 trigger/params
       ▼
Module 2: 目的地配置 (ga4 / meta_pixel / tiktok_pixel / google_ads / consent_layer / internal_db)
       │
       ▼
Module 3: Consent + UTM 分类法 (默认 denied, framework, 区域)
       │
       ▼
Module 4: PII 校验 + purchase 全字段 (H11/H18)
       │  + email_consent_event (H10)
       ▼
Module 5: GTM container 导出 + 写回 05 仓库 + 执行重建 + 跑验证
       │
       ▼ output.json (含 site_build_writeback 真实结果)
```

### 模块索引

| # | 文件 | 核心问题 |
|---|---|---|
| 1 | `modules/01-events-spec.md` | 13 个必有事件的 trigger / params / destinations |
| 2 | `modules/02-destinations.md` | 哪些 platform、container ID 占位、scope 如何切 |
| 3 | `modules/03-consent-and-utm.md` | GDPR/CCPA defaults + UTM source/medium/campaign 格式 |
| 4 | `modules/04-pii-and-purchase-spec.md` | SHA-256 enforcement + purchase 6 字段 minimum |
| 5 | `modules/05-gtm-export-and-writeback.md` | 导出 .json + 写 GTM ID 回 05 + 跑 rebuild + 验证 |

### 并行执行

- Module 1 内：13 事件的 trigger / params 设计并行
- Module 5 内：导出 GTM .json + 写 env 文件并行（rebuild 必须串行在后）

## Step 3: 输出生成

写：
- `./eec/06-tracking/output.json`
- `./eec/06-tracking/report.md`
- `./eec/06-tracking/gtm-container.json` (可导回 GTM)

并修改 05 仓库内（按 `writeback_target_files`）：
- 注入 GTM_CONTAINER_ID env 真值
- 替换 `gtm_container_placeholder` / `consent_layer_slot` 为真实 script

`output.json` MUST 含：
- `events_spec[]` (≥13, 包含全部 13 个 named events，schema allOf/contains 校验)
- `destinations[]` (≥1, id `dest_NNN`, type 见枚举)
- `consent_mode` (framework, regions[], defaults{}, required_categories[])
- `utm_taxonomy` (source/medium/campaign 格式 + content?/term?)
- **H10 `email_consent_event`** (event_name=email_signup, params, destinations_phase2)
- **H11 `purchase_event_full_spec`** (event_name=purchase, must_emit_fields 必须含 H18 is_first_purchase)
- **`pii_hash_algorithm`** const "sha256"
- **`site_build_writeback`** (target_repo_path = 05.repo_path, files_modified[], rebuild_required, rebuild_executed, rebuild_command_run?, post_rebuild_validation_status)
- `gtm_container_export_path` (= `./eec/06-tracking/gtm-container.json`)
- `validation_checklist[]` (≥1 项)

## Step 4: 自我校验门

```
1. ajv validate output.json (含 contains allOf 校验 13 必有事件)
2. events_spec.length ≥ 13
3. purchase_event_full_spec.must_emit_fields 包含 6 必有
4. pii_hash_algorithm == "sha256"
5. consent_mode.defaults 中 ad_storage/analytics_storage 默认 "denied"
6. site_build_writeback.files_modified[].path 每条 ∈ 05.analytics_endpoints.rebuild_protocol.writeback_target_files
7. site_build_writeback.target_repo_path == 05.repo_path
8. **rebuild 必跑** (conventions.md §15): 若 05 声明 rebuild_command → site_build_writeback.rebuild_executed = true。schema if/then 已锁；任何 false 直接 schema fail，不再有"解释跳过"逃口
9. **rebuild 验证必 pass** (conventions.md §15): 若 05 声明 post_rebuild_validation → post_rebuild_validation_status == "pass"。允许 "blocked"+blocking_reason，但 pipeline runner 视为失败；"skipped" 已从 schema enum 删除；过去事故: 06 报 status:"skipped" 通过 schema，重建从未执行
10. gtm_container_export_path 文件物理存在 (conventions.md §13)
11. validation_checklist 中 PII hash 校验项 status=pass
12. **spec ↔ code parity 双向校验** (conventions.md §17): 在 05.repo_path 下 grep 所有 `track('` / `track("` 调用，提取实际 fired event names，与 events_spec[*].name 取对称差：
    - declared_not_fired = events_spec - actual_fired → 必须为空，否则要么删 spec 要么补 05 组件（生成 stub component + 失败测试）
    - fired_not_declared = actual_fired - events_spec → 必须为空，否则补 spec
    任一非空 → STOP，不写 output.json。结果落入 site_build_writeback.spec_code_parity{declared_not_fired, fired_not_declared, checked_at}（schema 已锁 maxItems:0）
    过去事故: 06 spec 8 个事件 05 没 fire（cart_abandoned, email_unsubscribed, return_initiated, refund, order_shipped/_delivered/_canceled, size_calculator_used 因 SizeCalculator.tsx 不存在）；05 fire 6 个事件 06 没 spec（contact_form_submit, search, subscription_optin, add_to_wishlist, remove_from_wishlist, concierge_cta_click）
13. **consent API 正确** (conventions.md §17): grep 05.repo_path 下 ConsentBanner / consent update 实现，必须使用 `gtag('consent', 'update', {...})`；禁止 `dataLayer.push({event:'consent_*'})`，否则 consent mode v2 不生效；过去事故: 05 用 dataLayer.push 假装 consent 更新
14. **denylist** (conventions.md §16): destinations[].container_id_placeholder 不能是真实 GTM ID（避免泄露）；events_spec[].params[].sample 扫描 example.com / fake_user
```

## Step 5: 交付

```
✓ 追踪完成
  - 事件: <N> 个 (13 必有 ✓)
  - 目的地: <N> 个
  - GTM container: 已导出 + 已写入 05 仓库
  - Consent: <framework>, 默认 denied ✓
  - PII: SHA-256 锁 ✓
  - 写回 05: <files_modified>
  - 重建: <rebuild_executed> / 验证: <post_rebuild_validation_status>
  - Phase 2 钩子: H9 H10 H11 H15 H16 H17 H18 ✓

产物:
  - ./eec/06-tracking/output.json
  - ./eec/06-tracking/report.md
  - ./eec/06-tracking/gtm-container.json
  - 05 仓库改动: <files_modified>

下一步: /eec-07a-tech-seo (技术 SEO 审计) 或 /eec-08-paid-ads (投流)
```

## 交互点

1. Step 1 预览后 Y/n
2. Module 5 若 `rebuild_command` 在本机执行失败 → 暂停报错，请用户决定是否手动重建后再标 executed
3. Module 5 若 `post_rebuild_validation` 失败 → STOP，提示排查 GTM 加载（不能伪造 pass）
