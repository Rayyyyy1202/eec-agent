---
name: eec-11b-customer-service
version: 1.0.0
description: >
  独立站客服基础设施 Agent。读取 02 SKU + 03 cs_tone，产出 contact_methods + live_chat_provider 配置 +
  video_tutorials + per-SKU manuals + parts_finder + escalation_policy + /contact 表单配置。
  与 11-fulfillment 解耦：CS 深度先于商业后端落地。05 据此渲染 /contact + /help/* 子路由 + consent-gated 聊天 widget。
  触发词: "客服", "customer service", "support", "live chat", "manuals", "parts", "/eec-11b-customer-service"
user_invocable: true
argument_description: >
  可选: provider=<intercom|zendesk|crisp|drift|tidio|none>  默认 none (永久 stub)
  可选: include_phone=<true|false>  默认 false
  例: /eec-11b-customer-service
  例: /eec-11b-customer-service provider=intercom include_phone=true
---

# eec-11b-customer-service: 客服

你是 CS ops + 知识库 owner。本 skill 把客服基础设施结构化成可被 05 渲染的数据 + 一个 consent-gated 聊天 widget 接入点。

## 强制阅读

1. `~/.claude/skills/eec-shared/conventions.md`
2. `~/.claude/skills/eec-shared/data-contracts.md` — §3 字段引用
3. `./shared/schemas/11b-customer-service.schema.json`
4. `./eec/02-product-selection/output.json` ← 上游 (sku_id 引用 + warranty 时长决定 SLA)
5. `./eec/03-brand-identity/output.json` ← 上游 (cs_tone, official_contacts)

## 上游校验门

```
1. 必须存在: 02 + 03 output.json
   - 缺失 → STOP
2. ajv 校验已存在的上游
3. 提取:
   - 03.cs_tone → escalation_policy.cs_tone_ref + 表单文案 tone
   - 03.official_contacts.support → contact_methods[].value (channel=email)
   - 02.skus[].id → manuals[].sku_id + parts_finder[].parent_sku_id 候选池
   - 02.skus[].warranty_months → 影响 escalation rule SLA
```

## 核心原则

1. **CS 不撒谎**：support 邮箱、电话、地址都来自 03；无则要求用户输入，绝不编造
2. **chat widget consent-gated**：mode != none 时必须声明 consent_category，05 layout 据此包在 consent 检查里
3. **stub_until 不撒谎**：mode=none ⇒ stub_until="never"; 其他 ⇒ 真实 env var name + widget_app_id_env_var 必填
4. **manuals 占位**：MVP 允许 pdf_url=`/manuals/<sku>.pdf` 占位（实际文件后续放进 public/manuals/），但路径必须确定
5. **parts_finder 引用真 SKU**：parent + replacement 都必须 ∈ 02.skus[].id（同一个表里出现的 SKU）
6. **escalation rule ≥ 1**：必须至少有一条 — 例如 "refund > $200 → 人工 1h"
7. **/contact stub_until 默认 never**：MVP 表单提交返回 501，前端展示 "We received your message" 友好提示，但不真正发邮件
8. **写回白名单**：provider 切换时只允许写入 `writeback_target_files[]` 列出的 05/repo 路径

## Step 1: 输入解析

```
$ARGUMENTS:
  provider=<...>           # 默认 none
  include_phone=<true|false> # 默认 false
```

读上游，展示：
```
读到上游:
  - SKU: <N> 个 (id list)
  - 03.cs_tone: <voice_descriptors>
  - 03.official_contacts.support: <email or "missing — will ask">

将产出:
  - contact_methods: <N> (channels: email + form [+ phone if include_phone])
  - live_chat_provider: <mode>  (stub_until=<X>)
  - video_tutorials: <N>  (覆盖 setup + troubleshooting + maintenance)
  - manuals: <N>  (per SKU)
  - parts_finder: <N>  (per consumable)
  - escalation_policy.rules: ≥3
  - contact_form_config: route /contact (stub_until=never)

是否开始? (Y/n)
```

## Step 2: 模块执行

### 数据流

```
Module 1: contact_methods + live_chat_provider 配置
       │
       ▼
Module 2: video_tutorials + manuals (per SKU 并行)
       │
       ▼
Module 3: parts_finder + escalation_policy
       │
       ▼
Module 4: contact_form_config (字段 + stub_until + tone-aligned copy)
       │
       ▼ output.json
```

### 模块索引

| # | 文件 | 核心问题 |
|---|---|---|
| 1 | `modules/01-contacts-and-chat.md` | 渠道选择 + provider stub_until + consent gating |
| 2 | `modules/02-videos-and-manuals.md` | 教程拓扑 + 占位 PDF 路径 |
| 3 | `modules/03-parts-and-escalation.md` | 配件映射 + 升级规则 SLA |
| 4 | `modules/04-contact-form.md` | 字段定义 + stub_until + tone-aligned 文案 |

### 并行执行

- Module 2 内：每个 SKU 的 manual 并行；videos 按 topic 并行
- Module 3 内：parts_finder 每个 parent SKU 并行；escalation 串行（依赖 cs_tone）

## Step 3: 输出生成

写：
- `./eec/11b-customer-service/output.json`
- `./eec/11b-customer-service/report.md` (人类可读 — 哪些 PDF 还没真实文件 / 哪些 video 是占位)
- `./eec/11b-customer-service/manual_briefs/<sku>.md` (可选 — manual 大纲，后续供印刷流程用)

`output.json` MUST 含：
- `contact_methods` (≥1)
- `live_chat_provider` (mode + stub_until)
- `video_tutorials` (≥1; topic 覆盖 setup/troubleshooting/maintenance)
- `manuals` (每个 SKU 至少一份)
- `parts_finder` (≥1)
- `escalation_policy` (cs_tone_ref + rules ≥1)
- `contact_form_config` (/contact + ≥2 字段 + stub_until)
- `meta`

## Step 4: 自我校验门

```
1. ajv validate output.json
2. 每个 manuals[].sku_id ∈ 02.skus[].id
3. 每个 parts_finder[].parent_sku_id ∈ 02.skus[].id 且 .replacement_sku_id ∈ 02.skus[].id
4. 每个 video_tutorials[].related_sku_ids[] (若有) ∈ 02.skus[].id
5. live_chat_provider.mode == "none" ⇒ stub_until == "never" 且 widget_app_id_env_var 省略
6. live_chat_provider.mode != "none" ⇒ stub_until 是合法 env var 名 + widget_app_id_env_var 必填
7. contact_form_config.route_path == "/contact"
8. escalation_policy.cs_tone_ref 字符串包含 "/03-brand-identity/" 且包含 "#/cs_tone"
9. 所有 contact_methods[].channel == "email" 时 value 通过 email 格式正则
10. 所有 contact_methods[].channel == "phone" 时 value 通过 E.164 (^\+[1-9]\d{1,14}$)
11. **manual PDF FS 存在** (conventions.md §13): 每个 manuals[].pdf_path 在 05.repo_path/public/ 下物理存在；不存在 → 该条 status:"draft" 排除出 build；过去事故: 4 manual paths 全部 404
12. **video URL denylist + 200** (conventions.md §13/§16): video_tutorials[].video_url 必须：(a) 不在 RickRoll/Gangnam/Despacito YT ID denylist (`dQw4w9WgXcQ`, `9bZkp7q19f0`, `kJQP7kiw5Fk`, `L_jWHffIx5E`)，(b) HEAD 请求返回 200，(c) 频道 ID 与 03.official_contacts.youtube_channel_id 匹配（若 03 声明）。任一不满足 → status:"draft"，不进 build；过去事故: 4 个教程全是 Rick Roll/Gangnam Style/Despacito/Bruno Mars 占位
13. **contact_form_config.fields ↔ 05 API 端点字段名一致** (conventions.md §17): grep 05.repo_path 下 `app/api/contact/route.ts`，提取 `body.<field>` 引用，必须等于 contact_form_config.fields[].name 集合；不一致 → STOP；过去事故: skill 输出 `topic` 字段，05 API 检查 `reason`，每次提交都 400
14. **placeholder denylist** (conventions.md §16): manuals[].pdf_path 不能含 "TODO" / "<sku>"; video_tutorials[].title 不能含 "Lorem ipsum"
```

## Step 5: 交付

```
✓ 客服基础设施完成
  - 渠道: <list> (chat=<provider>; SLA: <fastest>min - <slowest>min)
  - 教程: <N> 视频 (覆盖 <topics>)
  - 手册: <N> SKU
  - 配件映射: <N> (例: filter→sku_003)
  - 升级规则: <N> (例: refund>$200 → 人工 1h)
  - 表单: /contact (stub_until=<X>)

下一步: /eec-05-site-build (重 run 以消费 11b → /contact + /help/* 子路由 + chat widget slot)
```

## 交互点

1. Step 1 预览后 Y/n
2. Module 1 若 03 无 official_contacts.support → 暂停问邮箱（必填）
3. Module 1 若 include_phone=true 但 03 无电话 → 暂停问 E.164 号码 + 时区/工作时间
4. Module 1 若 mode != none 但 widget_app_id_env_var 不存在 → 提醒 .env.example 加这个变量
5. Module 2 若 video_tutorials 为空 → 提醒至少出 1 个 setup video（最常被问到的）
