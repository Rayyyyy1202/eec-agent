---
name: eec-08-paid-ads
version: 1.0.0
description: >
  独立站投流 Agent。读取 02 SKU + 03 品牌 + 04 素材 + 06 追踪，按 5 大模块产出账户结构、
  受众、creative_pairing、预算、UTM、launch checklist。每条 pairing 必须 ref 真实 asset_id+copy_id；
  每个 audience 必须 ref 真实 01.audience_id 或 06 retargeting event；landing_route ∈ 05.routes。
  触发词: "投流", "广告", "paid ads", "/eec-08-paid-ads"
user_invocable: true
argument_description: >
  可选: 平台清单 (默认 meta,tiktok,google) + 测试预算 (默认 USD 1000)。
  例: /eec-08-paid-ads
  例: /eec-08-paid-ads platforms=meta budget=2000 currency=EUR
---

# eec-08-paid-ads: 投流账户与启动

你是一个 DTC performance marketer。本 skill 只到 launch_checklist —— 不真投放（投放后由 09 优化跑数据回路）。所有 ID 必须能在上游 trace。

## API 集成说明 (placeholder — 当前不需要凭证)

本 skill **只产出计划文档** (account_structure / audiences / creative_pairing / launch_checklist)，
**不会调用任何广告平台 API**，因此当前**无需用户提供任何凭证**。

未来若扩展为"自动建 campaign / push to Meta Ads Manager"等功能，会在那一步**显式向用户索取**：
- Meta: `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID`
- Google Ads: `GOOGLE_ADS_DEVELOPER_TOKEN` + `GOOGLE_ADS_CLIENT_ID` + `GOOGLE_ADS_CLIENT_SECRET` + `GOOGLE_ADS_REFRESH_TOKEN` + `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
- TikTok Ads: `TIKTOK_ACCESS_TOKEN` + `TIKTOK_ADVERTISER_ID`
- Pinterest / YouTube / X 等同理

现阶段：launch_checklist 输出后，由用户**手动**复制到广告平台后台执行。

## 强制阅读

1. `~/.claude/skills/eec-shared/conventions.md`
2. `~/.claude/skills/eec-shared/data-contracts.md` — §3 字段引用 (你 ref 04/05/06/01)
3. `~/.claude/skills/eec-shared/phase2-hooks.md` — H13 (restricted_geo) 必须翻译为 platform geo exclusion
4. `~/.claude/skills/eec-shared/schemas/08-paid-ads.schema.json`
5. `./eec/02-product-selection/output.json`
6. `./eec/03-brand-identity/output.json`
7. `./eec/04-creative-factory/output.json`
8. `./eec/05-site-build/output.json` (landing_route 池)
9. `./eec/06-tracking/output.json` (events / utm_taxonomy / pixels)

## 上游校验门

```
1. 必须存在: 02 + 03 + 04 + 06 output.json (05 强烈推荐, 缺则 landing_route 自由文本)
2. ajv 校验全部
3. 提取硬约束:
   - 02.skus[].restricted_geo[] → 必须翻译为每条 campaign 的 geo exclusion
   - 04.assets[].id + .copy_blocks[].id → creative_pairing 必须 ref 真实
   - 05.routes[].path (若有) → landing_route 必须 ∈
   - 06.events_spec[].name → optimization_event 必须 ∈
   - 06.destinations[] → destinations_required + pixels_required 必须 ref
   - 06.utm_taxonomy → utm_taxonomy_applied 必须遵循同 source/medium/campaign 格式
   - 01.audience_profiles[].id → audiences[].source_audience_id 候选池
```

## 核心原则

1. **零虚构 ID**：所有 audience/asset/copy/event/route/destination ID 必须在上游真实存在
2. **限运国家硬翻译**：每条 campaign 必须叠加 SKU.restricted_geo[] 的 exclusion；不能省
3. **每个 campaign ≥ 1 audience + ≥ 1 creative_pairing**：schema 强制
4. **optimization_event 必须能 fire**：必须 ∈ 06.events_spec 且 06 已 destinations 到对应 platform pixel
5. **预算分配总和 = 100%**：allocation_by_platform pct 必须加总到 100
6. **UTM 严格遵循 06.utm_taxonomy**：utm_campaign 命中 06 给的 pattern (e.g. `{objective}_{audience}_{date:YYMMDD}`)
7. **launch_checklist 必有 pixel firing 验证项**：status=pass 才放行
8. **PII 已锁 SHA-256 (06 const)**：custom_list 上传必须 hash 后传

## Step 1: 输入解析

```
$ARGUMENTS:
  platforms=<list>     # 默认: meta,tiktok,google (可加 youtube/pinterest/x)
  budget=<n>           # 默认: 1000
  currency=<ISO>       # 默认: 跟主 SKU
  start_date=<YYYY-MM-DD>  # 默认: 7 天后
```

读上游，展示：
```
读到上游:
  - SKU: <N> 个 (主推: <name>, 限运国家: <list>)
  - 品牌: <name>
  - 素材池: <N> 图 / <N> 文案 / <N> 视频
  - 站点: <site_url> (路由数: <N>)
  - 追踪: <N> events, pixels: <list>
  - UTM 格式: <pattern>

将产出:
  - account_structure: <P> 平台 × ~<C> campaign
  - audiences: ~<A> 个 (lookalike + interest + retargeting)
  - creative_pairing: ~<R> 组
  - 测试预算: <amount> <currency>

是否开始? (Y/n)
```

## Step 2: 模块执行

### 数据流

```
Module 1: 账户结构 (platform → campaign 树, 每条绑 audience + pairing + landing + opt event)
       │
       ▼
Module 2: 受众 (lookalike / interest / retargeting / custom_list)
       │  retargeting → ref 06.events_spec[].name
       ▼
Module 3: Creative pairing (asset_ids[] × copy_block_id × audience_id)
       │
       ▼
Module 4: 预算 + UTM (allocation% / kill / scaling rule + UTM 模板生成)
       │  applied UTM 必须遵循 06.utm_taxonomy
       ▼
Module 5: Launch checklist (pixel fire / consent / landing 200 / GTM 真值 / restricted_geo 已设)
       │
       ▼ output.json
```

### 模块索引

| # | 文件 | 核心问题 |
|---|---|---|
| 1 | `modules/01-account-structure.md` | 多平台 campaign 树 + objective/budget/landing/opt_event 决策 |
| 2 | `modules/02-audiences.md` | lookalike/interest/retargeting 设计 + ref 真实 source ID |
| 3 | `modules/03-creative-pairing.md` | asset+copy+audience 配对矩阵 (避免重复) |
| 4 | `modules/04-budget-and-utm.md` | 总预算分配 + kill/scale + UTM 模板生成 |
| 5 | `modules/05-launch-checklist.md` | pre-flight 校验 (pixel/consent/landing/geo/quality) |

### 并行执行

- Module 1 内：每个 platform 的 campaign 设计并行
- Module 5 内：每条 launch_checklist[] 项的验证（pixel/landing/consent）并行

## Step 3: 输出生成

写：
- `./eec/08-paid-ads/output.json`
- `./eec/08-paid-ads/report.md`
- `./eec/08-paid-ads/utm-templates.md` (人类可读速查)

`output.json` MUST 含：
- `account_structure[]` (≥1, platform, campaigns[]: {id `campaign_NNN`, name, objective, daily_budget Money, audience_ids[≥1], creative_pairing_ids[≥1], landing_route, optimization_event, bidding_strategy?})
- `audiences[]` (≥1, id `paud_NNN`, platform, type, definition, size_band?, source_audience_id?, source_event_name?)
- `creative_pairing[]` (≥1, id `pairing_NNN`, asset_ids[≥1], copy_block_id, audience_id, hook?, format?)
- `budget_plan` (total_test_budget Money, allocation_by_platform[]: {platform, pct}, kill_threshold, scaling_rule)
- `utm_taxonomy_applied` (examples[]: {campaign_id, utm_source, utm_medium, utm_campaign, utm_content?, utm_term?})
- `destinations_required[]` (≥1, ref 06 destination IDs)
- `pixels_required[]?` (ref 06 destination IDs)
- `launch_checklist[]` (≥1, item, status pass|fail|blocked, evidence?)

## Step 4: 自我校验门

```
1. ajv validate output.json
2. 每条 campaigns[].landing_route ∈ 05.routes[].path (若 05 存在)
3. 每条 campaigns[].optimization_event ∈ 06.events_spec[].name
4. 每条 campaigns[].audience_ids[] ∈ audiences[].id
5. 每条 campaigns[].creative_pairing_ids[] ∈ creative_pairing[].id
6. 每条 audiences[].source_audience_id (若有) ∈ 01.audience_profiles[].id
7. 每条 audiences[].source_event_name (若有) ∈ 06.events_spec[].name
8. 每条 creative_pairing[].asset_ids[] ∈ 04.assets[].id
9. 每条 creative_pairing[].copy_block_id ∈ 04.copy_blocks[].id
10. budget_plan.allocation_by_platform 的 pct 加总 = 100
11. utm_taxonomy_applied.examples 命中 06.utm_taxonomy.campaign_format pattern
12. 每个 SKU 的 restricted_geo[] 国家不在任何 campaign 投放范围 (audience 定义里说明已 exclude)
13. launch_checklist 中 pixel-fire / landing-200 / consent-default-denied 三项 status=pass 才允许 ✓ 完成
```

## Step 5: 交付

```
✓ 投流就绪
  - 平台: <list>
  - Campaigns: <N>
  - 受众: <N> 个 (lookalike: <l>, interest: <i>, retargeting: <r>)
  - Creative pairing: <N> 组
  - 测试预算: <amount> <currency>
  - Kill 规则: <kill>
  - Scaling 规则: <scale>
  - Launch checklist: <pass>/<total> ✓
  - 限运国家已 exclude: <list>

产物:
  - ./eec/08-paid-ads/output.json
  - ./eec/08-paid-ads/report.md
  - ./eec/08-paid-ads/utm-templates.md

下一步: 投放后 7-14 天 → /eec-09-optimization (拉真实数据决策)
```

## 交互点

1. Step 1 预览后 Y/n
2. Module 5 若任一 critical checklist (pixel-fire / landing-200) fail → STOP，提示先回 06 / 05 修
3. Module 4 若 allocation pct 加总 ≠ 100 → 自动归一化前问用户是否手动指定
