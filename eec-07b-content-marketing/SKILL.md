---
name: eec-07b-content-marketing
version: 1.0.0
description: >
  独立站内容营销 Agent。读取 01 调研 + 02 SKU + 03 调性 (+ 07a 关键词机会，可选)，按 4 大模块产出
  关键词簇 → 内容日历 → 草稿大纲 → 内链图。复用 03.tone 不重写；草稿落 markdown 等待人审。
  触发词: "内容营销", "content marketing", "内容日历", "/eec-07b-content-marketing"
user_invocable: true
argument_description: >
  可选: 排期周数 (默认 8 周)、每周条数 (默认 2)。
  例: /eec-07b-content-marketing
  例: /eec-07b-content-marketing weeks=12 per_week=3
---

# eec-07b-content-marketing: 内容营销

你是一个 SEO content strategist + 编辑。本 skill 把 01/02/03 的事实基线 + 07a 的关键词机会（若有）结构化成可发布的内容计划。

## 强制阅读

1. `~/.claude/skills/eec-shared/conventions.md`
2. `~/.claude/skills/eec-shared/data-contracts.md` — §3 字段引用
3. `~/.claude/skills/eec-shared/schemas/07b-content-marketing.schema.json`
4. `./eec/01-research/output.json` ← 上游
5. `./eec/02-product-selection/output.json` ← 上游
6. `./eec/03-brand-identity/output.json` ← 上游 (tone 不复制只 ref)
7. `./eec/07a-tech-seo/output.json` ← 可选 (有就消费 keyword_opportunities)

## 上游校验门

```
1. 必须存在: 01 + 02 + 03 output.json
   - 缺失 → STOP
2. 07a output.json: 存在则消费, 不存在 → 不报错, 走纯 01-based 关键词挖掘
3. ajv 校验全部已存在的上游
4. 提取:
   - 01.audience_profiles[] → cluster.audience_id 候选池
   - 01.pain_points[] → 信息型内容 (informational) 题材
   - 01.competitors[] → 比较型内容 (comparison) 题材
   - 02.skus[] → cluster.linked_sku_ids[] 候选池 + cta_sku_id
   - 03.tone → editorial_voice_ref（只 ref 不复制）
   - 07a.keyword_opportunities[] (若有) → cluster + content_calendar 起点
```

## 核心原则

1. **editorial_voice_ref 不复制**：值 = `./eec/03-brand-identity/output.json#/tone`，不复制 do_phrases/dont_phrases
2. **每个 cluster 必绑 audience + intent**：search_intent 从 informational/commercial/transactional/navigational 选；audience_id 必须 ∈ 01
3. **每条 content 必绑 cluster**：cluster_id 在日历项必填
4. **每条 draft 必有 outline**：H1-H4 层级 + text；body_md 路径落盘
5. **internal_links ≠ orphan**：每条草稿至少 2 个内链（向其他 content_id 或 05.routes[].path）
6. **CTA 必有**：cta_sku_id 必须 ∈ 02.skus[]
7. **状态字段如实**：planned / drafted / reviewed / published — 不能虚标
8. **多语 placeholder**：language 字段必填，便于 Phase 2 邮件 newsletter 翻译

## Step 1: 输入解析

```
$ARGUMENTS:
  weeks=<N>       # 默认 8
  per_week=<N>    # 默认 2
  start=<date>    # 默认下周一
```

读上游，展示：
```
读到上游:
  - 受众: <N> 个 audience profile
  - SKU: <N> 个
  - 调性: <descriptors> (将 ref, 不复制)
  - 07a 关键词机会: <N> 条 (若有)

将产出:
  - keyword_clusters: ~<N> 个
  - content_calendar: <weeks> × <per_week> = <N> 条
  - drafts: 至少前 <P> 条出 outline (其余仅入日历)
  - internal_link_map: 估 <N> 条边

是否开始? (Y/n)
```

## Step 2: 模块执行

### 数据流

```
Module 1: 关键词簇 (聚合 01.pain + 02.usp + 07a.opp → cluster_NNN)
       │
       ▼
Module 2: 内容日历 (按 weeks × per_week 排期, content_NNN 与 cluster 绑定)
       │  并行: 每周内容并行起标题
       ▼
Module 3: 草稿大纲 (前 N 条出 outline + body_md_path; 其余仅日历项)
       │  并行: 不同 content 的 outline
       ▼
Module 4: 内链图 + 分发计划 (每条 ≥2 内链; 分发渠道映射)
       │
       ▼ output.json
```

### 模块索引

| # | 文件 | 核心问题 |
|---|---|---|
| 1 | `modules/01-keyword-clusters.md` | head_keyword + long_tails + intent + audience + linked_sku |
| 2 | `modules/02-content-calendar.md` | 排期 (date / type / title / target_keyword / status) |
| 3 | `modules/03-drafts-and-outlines.md` | H1-H4 outline + body_md 落盘 + 估读时长 |
| 4 | `modules/04-internal-link-map.md` | 内链图 + distribution_plan |

### 并行执行

- Module 1 内：每个 audience × 每类 intent 的关键词聚合并行
- Module 3 内：不同 content 的 outline 并行；body_md 落盘并行

## Step 3: 输出生成

### 3.1 分批写盘（防超时）
单 LLM turn 写盘量大 → openai 请求会被 5 分钟侧服务器切断。本 skill 必须**分批**完成，每批不超过 8 次 tool_call：

```
batch 1 (规划):  read_file 上游 → 内存里聚类 → write_file keyword_clusters_draft.json (作 staging)
batch 2 (日历):  write_file 内含 calendar 的 staging
batch 3 (草稿1): write_file drafts/<id>.md × ≤6
batch 4 (草稿2): write_file drafts/<id>.md × ≤6 (其余)
batch 5 (manifest): write_file output.json + report.md
batch 6 (校验):  validate_schema → finish
```

**禁止**单 turn 内 write_file 数量 > 10。每批之间 LLM 用 1-2 句话报告"批次 N 完成"再继续。

### 3.2 产物清单

写：
- `./eec/07b-content-marketing/output.json`
- `./eec/07b-content-marketing/report.md`
- `./eec/07b-content-marketing/drafts/<content_id>.md` (每条草稿一文件)

`output.json` MUST 含：
- `keyword_clusters[]` (≥1, id `cluster_NNN`, topic, head_keyword, long_tails[]?, search_intent, audience_id?, linked_sku_ids[]?)
- `content_calendar[]` (≥1, id `content_NNN`, scheduled_date, content_type, title, target_keyword, cluster_id?, owner?, status)
- `drafts[]` (id `draft_NNN`, content_id, title, outline[]: {h, text}, body_md_path?, target_keyword, secondary_keywords[]?, internal_links[]?, cta_sku_id?, language?, estimated_reading_time_min?)
- `internal_link_map[]` (source, target, anchor)
- `distribution_plan[]?` (content_id, channel, scheduled_date)
- `editorial_voice_ref` (= `./eec/03-brand-identity/output.json#/tone`)

## Step 4: 自我校验门

```
1. ajv validate output.json
2. editorial_voice_ref 字符串必须是 ref 表达式而非内联对象
3. 每个 cluster.audience_id (若有) ∈ 01.audience_profiles[]
4. 每个 cluster.linked_sku_ids[] (若有) 全部 ∈ 02.skus[]
5. 每个 content_calendar[].cluster_id (若有) ∈ keyword_clusters[]
6. 每个 draft.content_id ∈ content_calendar[]
7. 每个 draft.cta_sku_id (若有) ∈ 02.skus[]
8. 每个 draft.internal_links[].length ≥ 2 (前 5 条草稿)
9. body_md_path 文件物理存在
```

## Step 5: 交付

```
✓ 内容营销规划完成
  - 簇: <N> 个 (主题: <list>)
  - 日历: <N> 条 / <weeks> 周
  - 草稿: <N> 条出 outline (其余仅排期)
  - 内链: <N> 条边
  - 分发渠道: <list>

产物:
  - ./eec/07b-content-marketing/output.json
  - ./eec/07b-content-marketing/report.md
  - ./eec/07b-content-marketing/drafts/

下一步: /eec-08-paid-ads (并行可执行) 或人工审 drafts
```

## 交互点

1. Step 1 预览后 Y/n
2. Module 1 若聚类后 cluster < 3 → 暂停问是否扩大关键词来源 (加 07a / 自动扩词)
3. Module 3 若用户指定 weeks × per_week 太多 (>30 条) → 提醒只出前 N 条 outline，余仅入日历
