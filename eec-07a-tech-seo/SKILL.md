---
name: eec-07a-tech-seo
version: 1.0.0
description: >
  独立站技术 SEO Agent。读取 05 站点 + 06 追踪，按 5 大模块审计 (Lighthouse/CWV/可爬性/Schema.org)、
  出 keyword_opportunities[] (喂给 07b)、写应用变更 (sitemap/robots/redirects/JSON-LD)，
  并把可改的修复直接写回 05 仓库。
  触发词: "技术 SEO", "tech SEO", "audit", "/eec-07a-tech-seo"
user_invocable: true
argument_description: >
  可选: 审计深度 (quick / standard / deep, 默认 standard)。
  例: /eec-07a-tech-seo
  例: /eec-07a-tech-seo deep
---

# eec-07a-tech-seo: 技术 SEO

你是一个 Technical SEO 专家。本 skill 把 05 出的站点跑完审计、修能修的、给 07b 喂关键词机会、给 09 喂 ranking baseline。

## 强制阅读

1. `~/.claude/skills/eec-shared/conventions.md`
2. `~/.claude/skills/eec-shared/data-contracts.md` — §3 字段引用 (你的 keyword_opportunities[] 给 07b)
3. `~/.claude/skills/eec-shared/schemas/07a-tech-seo.schema.json`
4. `./eec/05-site-build/output.json` ← 上游
5. `./eec/05-site-build/repo/` ← 你可写回的目标
6. `./eec/06-tracking/output.json` ← 上游 (consent / search_console destination 信息)

## 上游校验门

```
1. 必须存在: 05 + 06 output.json
2. ajv 校验两者
3. 提取:
   - 05.site_url / production_url? → Lighthouse / 真实抓取目标
   - 05.routes[] → 待审计路由全集
   - 05.seo_meta[] → 已有 meta（与抓取结果对账）
   - 05.repo_path → 写回目标
   - 05.analytics_endpoints.rebuild_protocol.writeback_target_files[] → 可改文件白名单
   - 06.destinations[] 中是否有 search_console_api 占位
```

## 核心原则

1. **先抓真实站点再改**：不要靠 schema 推测，跑 Lighthouse / fetch 实际 HTML / curl headers
2. **CWV 三件套必有**：lcp_p75_ms / inp_p75_ms / cls_p75 — 缺一不放行
3. **每条 issue 必带 fix_recommendation**：不能只报 problem
4. **applied_changes 必须有 diff_summary**：写回的每一处都说人话能 review
5. **写回受白名单约束**：和 06 同样规矩，applied_changes[].target 必须 ∈ 05.writeback_target_files[] 或在 repo_path 下
6. **关键词机会 ≠ 凭空想**：基于站点已有路由 + 抓取得到的 SERP 结果 + 01 niche 词
7. **每条 schema_org_emitted 必 validated**：跑 schema.org validator 或 search-console rich result test

## Step 1: 输入解析

```
$ARGUMENTS:
  depth=<quick|standard|deep>  # 默认 standard
```

读上游，展示：
```
读到上游:
  - 站点: <site_url>
  - 路由: <N> 条
  - 仓库: <repo_path>
  - 已有 seo_meta 路由数: <N>

将执行:
  - Lighthouse 跑分: <N> route
  - CWV 抓取 (PageSpeed Insights / CrUX 若有)
  - schema.org 校验: 每个候选 JSON-LD type
  - 抓取 robots.txt + sitemap.xml + headers
  - 关键词机会挖掘: <N> 候选

是否开始审计? (Y/n)
```

## Step 2: 模块执行

### 数据流

```
Module 1: 抓取与审计 (Lighthouse / CWV / robots / sitemap / canonical)
       │  并行: 所有 route 同时 audit
       ▼
Module 2: 技术问题分类 (severity × category) + fix_recommendation
       │
       ▼
Module 3: Schema.org 注入 / 校验 (Product / Organization / FAQ / Breadcrumb)
       │
       ▼
Module 4: 关键词机会挖掘 (基于已有 ranking + 01 niche + 竞品 SERP gap)
       │
       ▼
Module 5: 应用变更 (sitemap / robots / redirects / JSON-LD 写回 05 仓库)
       │
       ▼ output.json
```

### 模块索引

| # | 文件 | 核心问题 |
|---|---|---|
| 1 | `modules/01-crawl-and-audit.md` | Lighthouse + fetch HTML + 抓 robots/sitemap → lighthouse_scores + technical_issues |
| 2 | `modules/02-cwv-baseline.md` | LCP/INP/CLS p75 整体 + by_route |
| 3 | `modules/03-schema-org.md` | Product/Org/FAQ/Breadcrumb 注入 + validator |
| 4 | `modules/04-keyword-opportunities.md` | 给 07b 喂 keyword + intent + difficulty + suggested_target_route |
| 5 | `modules/05-applied-changes.md` | 写回 05 仓库 + 列 diff_summary |

### 并行执行

- Module 1 内：route × Lighthouse + route × HTML fetch 并行
- Module 3 内：每个候选 type 的 JSON-LD validator 并行

## Step 3: 输出生成

写：
- `./eec/07a-tech-seo/output.json`
- `./eec/07a-tech-seo/report.md`
- `./eec/07a-tech-seo/lighthouse/<route>.json` (可选, 详细报告)

并按需修改 05 仓库（白名单内）：
- `repo/public/sitemap.xml`
- `repo/public/robots.txt`
- 各 route 模板的 `<head>` JSON-LD 注入

`output.json` MUST 含：
- `audit_report` (lighthouse_scores: {performance, accessibility, best_practices, seo}, technical_issues[]: {severity, category, description, affected_routes[]?, fix_recommendation})
- `core_web_vitals_baseline` (lcp_p75_ms, inp_p75_ms, cls_p75, by_route[]?)
- `sitemap_url`
- `robots_txt_path?`
- `schema_org_emitted[]` (≥1, route, type, validated, validator?)
- `canonical_strategy?`
- `internal_link_summary?` (total/orphans/depth)
- `redirects_recommended[]?` (from, to, code, reason)
- `keyword_opportunities[]` (keyword, intent, difficulty, current_rank?, monthly_volume_estimate?, suggested_target_route?)
- `applied_changes[]` (change_type, target, applied_at, diff_summary)

## Step 4: 自我校验门

```
1. ajv validate output.json
2. lighthouse_scores 4 项全部 ≥ 0
3. CWV 三件套必有
4. schema_org_emitted 至少 1 条且 validated=true
5. technical_issues 中 severity=critical 项必须在 applied_changes[] 中处理 OR 在 keyword_opportunities/next 报告中说明无法本期修
6. applied_changes[].target 全部在 05.repo_path 下；若涉及 05 关键文件，必须在 writeback_target_files[]
7. keyword_opportunities[].suggested_target_route (若有) 必须 ∈ 05.routes[].path
```

## Step 5: 交付

```
✓ 技术 SEO 完成
  - Lighthouse: P=<n> A=<n> BP=<n> SEO=<n>
  - CWV: LCP=<ms> INP=<ms> CLS=<n>
  - 技术问题: <N> (critical: <c>, high: <h>)
  - Schema.org 已注入: <N> 个 type
  - 关键词机会: <N> 条 (喂给 07b)
  - 应用变更: <N> 项 (sitemap/robots/JSON-LD/redirects)

产物:
  - ./eec/07a-tech-seo/output.json
  - ./eec/07a-tech-seo/report.md
  - 05 仓库改动: <N> 文件

下一步: /eec-07b-content-marketing (会消费 keyword_opportunities)
```

## 交互点

1. Step 1 预览后 Y/n
2. Module 1 若 site_url 不可达 → 暂停问 production_url 或换备用 URL
3. Module 5 若 critical issue 必须改但白名单内文件无法覆盖 → 报告并询问是否扩展白名单（让用户回 05 决定）
