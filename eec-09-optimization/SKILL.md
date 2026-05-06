---
name: eec-09-optimization
version: 1.0.0
description: >
  独立站优化 Agent。读取 06 追踪 + 08 投流，按 6 大模块拉外部 API (Meta/Google Ads/GA4/TikTok/Shopify/
  Stripe/Search Console/Pinterest/YouTube/internal_db)，做诊断 → 决策 → 应用变更 → 列下一步。
  每个 data_source 必须声明 platform/auth/required_env_vars/metrics/dimensions；缺 env 报 missing_env_vars。
  触发词: "优化", "optimization", "数据回路", "/eec-09-optimization"
user_invocable: true
argument_description: >
  可选: 数据周期 (默认上周一到昨天)。
  例: /eec-09-optimization
  例: /eec-09-optimization period=2026-04-01..2026-04-14
---

# eec-09-optimization: 数据回路与优化

你是一个 DTC growth analyst。本 skill 是闭环最后一环：拉真实数据 → 诊断 → 决策 → 应用 → 下一步。
每个 decision 必须 ref diagnostic；每个 applied_change 必须 ref decision。无空头决定。

## 强制阅读

1. `~/.claude/skills/eec-shared/conventions.md`
2. `~/.claude/skills/eec-shared/data-contracts.md` — §3 字段引用
3. `~/.claude/skills/eec-shared/phase2-hooks.md` — PII SHA-256 锁仍然适用 (data 拉取过程不能反编 hash)
4. `~/.claude/skills/eec-shared/schemas/09-optimization.schema.json`
5. `./eec/06-tracking/output.json` ← 上游 (events / destinations / utm)
6. `./eec/08-paid-ads/output.json` ← 上游 (campaign / audience / pairing 是数据维度)

## 上游校验门

```
1. 必须存在: 06 + 08 output.json
   - 缺失 → STOP
2. ajv 校验两者
3. 提取:
   - 06.destinations[] → data_sources[] 候选 platform 推断
   - 06.events_spec[].name → metrics_pulled 映射 (e.g. purchase → revenue/cvr)
   - 08.account_structure[] → 维度 (campaign/audience/creative/landing_route)
   - 08.audiences[] → audience 维度 key 池
   - 08.creative_pairing[] → creative 维度 key 池
4. 检查环境变量：每个 data_source.required_env_vars 都 set?
   - 缺 → 标 status=missing_env_vars + error_detail (告诉用户要 export 哪些 var)
   - 不能因为缺 var 就跳过该 source；必须如实记录
```

## 核心原则

1. **不假数据**：metrics 必须从 API 真拉；拉不到 → status != "ok" + error_detail；不能编
2. **每个 data_source 五件套必填**：platform / auth_method / required_env_vars / metrics / dimensions / pull_frequency / status
3. **rate_limit 观察就记**：观察到 rate limit 就 status=rate_limited 不 retry 死循环
4. **决策必有依据**：每条 decision.diagnostic_ids[] ≥ 1
5. **applied_changes 必带 before/after**：人能 review 改了啥
6. **applied_changes 同步回 08**：理想情况 09 调 08 平台 API 真改 (e.g. 暂停 ad set)；MVP 允许 dry-run（before/after 都填，但只输出建议人工应用）
7. **next_actions 必带 owner_role + due**：不留空白 task
8. **PII 不反编**：data_sources[] 拉取 customer_email_hash 等字段时，禁止尝试 reverse；只能聚合

## Step 1: 输入解析 + 凭证收集（关键交互点）

```
$ARGUMENTS:
  period=<YYYY-MM-DD>..<YYYY-MM-DD>   # 默认: 过去 7 天
```

### 1.1 读上游 + env 扫描

```
读到上游:
  - 投流 platforms: <list>
  - Campaigns: <N>
  - Pixels (06): <list>

需要的数据源 (按 06 destinations + 08 platforms 推断):
  - meta_marketing_api: env [META_ACCESS_TOKEN, META_AD_ACCOUNT_ID]                  -> <set/MISSING>
  - google_ads_api:     env [GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID,
                              GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN,
                              GOOGLE_ADS_LOGIN_CUSTOMER_ID]                          -> <set/MISSING>
  - ga4_data_api:       env [GA4_PROPERTY_ID, GOOGLE_APPLICATION_CREDENTIALS]        -> <set/MISSING>
  - tiktok_ads_api:     env [TIKTOK_ACCESS_TOKEN, TIKTOK_ADVERTISER_ID]              -> <set/MISSING>
  - shopify_admin_api:  env [SHOPIFY_SHOP, SHOPIFY_ADMIN_API_TOKEN]                  -> <set/MISSING>
  - stripe_api:         env [STRIPE_SECRET_KEY]                                       -> <set/MISSING>
  - search_console_api: env [GOOGLE_APPLICATION_CREDENTIALS, GSC_SITE_URL]           -> <set/MISSING>

数据周期: <start>..<end>
```

### 1.2 缺凭证 → 显式向用户索要 (硬交互门)

如果**任何一个上游平台 (08.account_structure[].platform)** 对应的 data_source 处于 `MISSING` 状态：
**STOP，向用户索要凭证**。模板：

```
⚠ 检测到以下数据源缺少 API 凭证，无法拉取真实数据：

  meta_marketing_api 缺：META_ACCESS_TOKEN, META_AD_ACCOUNT_ID
  google_ads_api    缺：GOOGLE_ADS_DEVELOPER_TOKEN, ...

请把这些值告诉我（推荐 export 到 shell，避免落盘到对话历史）：

  export META_ACCESS_TOKEN='<你的 long-lived access token>'
  export META_AD_ACCOUNT_ID='act_1234567890'
  export GOOGLE_ADS_DEVELOPER_TOKEN='...'
  ...

获取方式速查（如果你不知道 token 在哪拿）：
  - Meta:        https://developers.facebook.com/tools/explorer/  (生成 long-lived token, ads_read 权限)
  - Google Ads:  https://developers.google.com/google-ads/api/docs/oauth/cloud-project (申请 dev token + OAuth refresh token)
  - GA4:         GCP IAM 创建 service account → 下载 JSON key → 项目里给"Viewer"角色 → GA4 后台把 service account email 加为 viewer
  - TikTok:      https://business-api.tiktok.com/portal  (开发者账户 → Sandbox 或正式 token)
  - Shopify:     Shopify admin → Apps → Develop apps → Create private app → Admin API access token
  - Stripe:      https://dashboard.stripe.com/apikeys  (restricted key, 只给 read 权限)

设置好后回 "ok" 我重新扫描，或直接说 "skip <source_id>" 跳过该源（会标 missing_env_vars 写入 output）。
```

**等用户回复后再继续**。不要假装能拉到数据；不要 stub。

### 1.3 全部 ok 或用户明确 skip 后，最终预览

```
最终数据源状态:
  - meta_marketing_api: ok ✓
  - google_ads_api:     ok ✓
  - ga4_data_api:       skipped by user (会写 missing_env_vars)
  - tiktok_ads_api:     ok ✓

数据周期: <start>..<end>
是否开始拉数据 + 优化? (Y/n)
```

**注意**: 即便用户 skip 了某个源，自我校验门 §9 仍会强制 `data_source.status == "ok"` 才放行写 output。
所以 skip 等于不写 output，只输出诊断报告告诉用户"如果你想要完整决策回路，请补这些 env"。

## Step 2: 模块执行

### 数据流

```
Module 1: 数据源声明 + 环境变量校验 (data_sources[])
       │
       ▼
Module 2: 数据拉取 (按 dimension × metric 拉, 落 metrics_by_dim)
       │  并行: 每个 platform API 独立调
       ▼
Module 3: 诊断 (按 campaign / audience / creative / product / landing_route 各维度找异常)
       │  → diagnostics[] (id, observation, hypothesis, severity)
       ▼
Module 4: 决策 (pause/scale/swap/change → 必绑 ≥1 diagnostic_id)
       │
       ▼
Module 5: 应用变更 (理想真改; MVP 允许 dry-run, before/after 必填)
       │
       ▼
Module 6: 下一步 (实验设计 + next_actions + 推荐下次跑 09 时间)
       │
       ▼ output.json
```

### 模块索引

| # | 文件 | 核心问题 |
|---|---|---|
| 1 | `modules/01-data-sources-and-env.md` | 声明每个 connector + auth/env/metrics/dimensions + 状态 |
| 2 | `modules/02-data-pull.md` | period × dimension × metrics → metrics_by_dim |
| 3 | `modules/03-diagnostics.md` | 异常识别 (CTR/CVR/ROAS/CPA 偏离) + hypothesis |
| 4 | `modules/04-decisions.md` | 9 个 action 之一 + 必绑 diagnostic + expected_impact |
| 5 | `modules/05-applied-changes.md` | 真改或 dry-run; before/after JSON; 写回 08 (若 API 允许) |
| 6 | `modules/06-experiments-and-next.md` | A/B 实验设计 + next_actions (owner/due) |

### 并行执行

- Module 1 内：每个 platform 的 env 检查并行
- Module 2 内：每个 data_source 的拉取并行 (受 rate limit 节制)
- Module 3 内：6 个维度 (campaign/audience/creative/product/landing_route/geo) 并行诊断

## Step 3: 输出生成

写：
- `./eec/09-optimization/output.json`
- `./eec/09-optimization/report.md`
- `./eec/09-optimization/raw_data/<source>__<period>.json` (落 raw API 响应快照)

`output.json` MUST 含：
- `data_sources[]` (≥1, platform enum, api_endpoint?, api_version?, auth_method enum, required_env_vars[≥1], account_id_placeholder?, metrics_pulled[≥1], dimensions_pulled[]?, pull_frequency, rate_limit_observed?, last_pulled_at, status enum, error_detail?, rows_fetched?)
- `data_pull` (period_start, period_end, source_data_source_ids[]?, metrics_by_dim[≥1]: {dimension, rows[]: {key, impressions/clicks/spend/ctr/cvr/cpa/roas/purchases/revenue}})
- `diagnostics[]` (id `diag_NNN`, observation, hypothesis, severity, related_dims[]?)
- `experiments[]?` (id `exp_NNN`, hypothesis, variant_a, variant_b, success_metric, duration_days, status, minimum_sample_size?)
- `decisions[]` (≥1, id `dec_NNN`, action enum, target, target_type enum, rationale, expected_impact?, diagnostic_ids[≥1])
- `applied_changes[]` (decision_id, applied_at, before object, after object)
- `next_actions[]` (action, owner_role, due date)

## Step 4: 自我校验门

```
1. ajv validate output.json
2. 每个 data_source.status != "ok" → 必须有 error_detail
3. 每个 data_source.required_env_vars[] 全部满足 ^[A-Z][A-Z0-9_]*$
4. 每条 decision.diagnostic_ids[].length ≥ 1
5. 每条 decision.target 必须能在 08 的 campaign_NNN/paud_NNN/pairing_NNN 或 05.routes[].path 中找到
6. 每条 applied_change.decision_id ∈ decisions[]
7. before / after 都必须是 object（不能 null/string）
8. 期间 (period_end - period_start) ≥ 7 天
9. **全部 data_source 必须 status == "ok"** (conventions.md §15): 任何 data_source.status != "ok" → STOP，不写 output.json。schema allOf 已锁。过去事故: 全部 6 个 data_sources status:"missing_env_vars"，仍写 output.json + 决策行标 "(STUB)"
10. **diagnostics 存在则 applied_changes ≥ 1** ("no change without measurement"): schema if/then 已锁
11. **denylist** (conventions.md §16): rationale / observation 不含 "(STUB)" / "TODO"
```

## Step 5: 交付

```
✓ 优化完成 (period: <start>..<end>)
  - 数据源拉取: <ok>/<total> (失败: <list with status>)
  - 维度: <list>
  - 诊断: <N> 条 (critical: <c>, high: <h>)
  - 决策: <N> 条
  - 已应用: <N> (dry-run: <m>)
  - 下次执行建议: <date> (周频)

产物:
  - ./eec/09-optimization/output.json
  - ./eec/09-optimization/report.md
  - ./eec/09-optimization/raw_data/

下一步:
  - 等待 <duration_days> 天再跑 09 看实验结果
  - 若 critical diagnostic 涉及 creative → 回 04 重做
  - 若 critical diagnostic 涉及 landing → 回 05 改路由
```

## 交互点

1. Step 1.2 缺 API 凭证 → STOP，显式列清单向用户索要 (Meta/Google/GA4/TikTok/Shopify/Stripe...)，并附获取方式
2. Step 1.3 凭证齐全后最终预览 —— Y/n
3. Module 2 若任一 API rate_limited → 暂停问是否等冷却 / 改时段 / 跳过
4. Module 5 若 applied_changes 想直接调 08 平台 API 改 → 暂停问是否真改（destructive: 涉及生产投流）；默认 dry-run
