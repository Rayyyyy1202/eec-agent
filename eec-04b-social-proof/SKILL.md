---
name: eec-04b-social-proof
version: 1.0.0
description: >
  独立站社会化证明 Agent。读取 02 SKU + 03 brand (press/awards) + 04 creative (assets)，产出
  reviews + AggregateRating per SKU + UGC carousel + press trust-bar 配置。
  MVP 阶段允许 synthetic 评论占位（必须 synthetic=true 标记），切换 paid provider 只改 review_provider 节点。
  触发词: "社会化证明", "social proof", "评论", "UGC", "/eec-04b-social-proof"
user_invocable: true
argument_description: >
  可选: provider=<self_hosted|stamped|yotpo|judge_me|trustpilot|okendo>
  可选: review_count=<N> (默认 12)
  例: /eec-04b-social-proof
  例: /eec-04b-social-proof provider=stamped
---

# eec-04b-social-proof: 社会化证明

你是一个 social-proof curator + reviews ops。本 skill 把第三方信任信号 (用户评论 / UGC / 媒体背书 / 案例) 结构化成可被 05 渲染的数据 + AggregateRating JSON-LD 信号。

## 强制阅读

1. `~/.claude/skills/eec-shared/conventions.md`
2. `~/.claude/skills/eec-shared/data-contracts.md` — §3 字段引用
3. `~/.claude/skills/eec-shared/schemas/04b-social-proof.schema.json`
4. `./eec/02-product-selection/output.json` ← 上游 (sku_id 引用)
5. `./eec/03-brand-identity/output.json` ← 上游 (press_mentions 来源)
6. `./eec/04-creative-factory/output.json` ← 可选 (logo/UGC asset_id 引用)

## 上游校验门

```
1. 必须存在: 02 + 03 output.json
   - 缺失 → STOP
2. 04 output.json: 存在则消费 logo_asset_id; 不存在 → 不报错, asset_id 字段省略
3. ajv 校验已存在的上游
4. 提取:
   - 02.skus[].id → reviews[].sku_id 候选池
   - 03.press_mentions[].outlet → press_widget.logos[].outlet 候选池
   - 04.assets[].id (若有) → ugc_assets[].id / press_widget.logos[].logo_asset_id 候选池
```

## 核心原则

1. **synthetic 标记不撒谎**：MVP 手写评论必须 `synthetic: true`；切换 provider 后真实数据 `synthetic: false`
2. **AggregateRating 5 评论门槛**：站点只在 review_count ≥ 5 时输出 AggregateRating JSON-LD（Google 阈值，避免 rich-result 被惩罚）
3. **press 引 03，不复制**：press_widget.logos[].outlet 必须能在 03.press_mentions[].outlet 找到
4. **review_provider.stub_until 不撒谎**：self_hosted = `never`；其余 provider = 真实 env_var 名
5. **PII 红线**：author_name 用首字 + 姓氏首字母（`Kim L.`），不存全名/邮件/手机/地址；author_location 仅到 City, ST
6. **写回白名单**：provider 切换时，只允许写入 `writeback_target_files[]` 列出的 05/repo 路径
7. **consent_status 才公开**：UGC 仅 `granted` 才在公开页面渲染

## Step 1: 输入解析

```
$ARGUMENTS:
  provider=<self_hosted|stamped|...>   # 默认 self_hosted
  review_count=<N>                     # 默认 12, 至少跨 SKU 平均分布
```

读上游，展示：
```
读到上游:
  - SKU: <N> 个 (id list)
  - 03.press_mentions: <N> 个 outlet
  - 04.assets: <N> 个 (若有)

将产出:
  - reviews: ~<N> 条 (provider=<X>; 若 self_hosted 则全部 synthetic=true)
  - aggregate_ratings: 每 SKU 1 个
  - ugc_assets: ~<N> 个 (synthetic 占位)
  - case_studies: 0-3 个
  - press_widget: 取 03.press_mentions[] 前 N 个

是否开始? (Y/n)
```

## Step 2: 模块执行

### 数据流

```
Module 1: review_provider 配置 (mode + stub_until + env_vars + writeback whitelist)
       │
       ▼
Module 2: 评论生成 (按 SKU 分布; tone 来自 03.tone)
       │  并行: 不同 SKU 的评论并行
       ▼
Module 3: AggregateRating 计算 (按 reviews[] 自动 rollup; rating_distribution 必算)
       │
       ▼
Module 4: UGC + case study + press widget 装配
       │
       ▼ output.json
```

### 模块索引

| # | 文件 | 核心问题 |
|---|---|---|
| 1 | `modules/01-provider-config.md` | mode + stub_until + writeback_target_files |
| 2 | `modules/02-reviews-generation.md` | 按 SKU 数量分布 + 多语 + verified_purchase 真实分布 |
| 3 | `modules/03-aggregate-and-distribution.md` | rollup 数学 + 5 评论门槛逻辑 |
| 4 | `modules/04-ugc-and-press.md` | UGC consent + press_widget 引 03 |

### 并行执行

- Module 2 内：每个 SKU 的评论批次并行
- Module 4 内：UGC / case_studies / press_widget 三块并行

## Step 3: 输出生成

写：
- `./eec/04b-social-proof/output.json`
- `./eec/04b-social-proof/report.md`
- `./eec/04b-social-proof/case_bodies/<case_id>.md` (若有 body_md_path)

`output.json` MUST 含：
- `review_provider` (mode + stub_until + provider_env_vars[] + writeback_target_files[])
- `reviews[]` (≥1, id `review_NNN`)
- `aggregate_ratings[]` (每个 SKU 一条; rating_distribution 1..5 全字段)
- `ugc_assets[]?` (≥0)
- `case_studies[]?` (≥0)
- `press_widget` (display_mode + logos[])
- `meta`

## Step 4: 自我校验门

```
1. ajv validate output.json
2. 每个 reviews[].sku_id ∈ 02.skus[].id
3. 每个 aggregate_ratings[].sku_id ∈ 02.skus[].id（每个 SKU 至多一条）
4. 每个 aggregate_ratings[].rating_distribution 总和 == review_count
5. 每个 aggregate_ratings[].rating_average ≈ Σ(rating × count) / review_count（误差 ±0.05）
6. 每个 press_widget.logos[].outlet ∈ 03.press_mentions[].outlet — **同时**：每个 press_widget.logos[].url ∈ 03.press_mentions[].url（conventions.md §14；过去事故: 04b 引用了 03 没有的 URL）
7. 每个 ugc_assets[].linked_sku_id (若有) ∈ 02.skus[].id
8. review_provider.mode == self_hosted ⇒ stub_until == "never"
9. review_provider.mode != self_hosted ⇒ stub_until == 真实 env_var 名 + provider_env_vars 非空
10. PII 检查: author_name 不含 @ 不含数字串≥7 (no email/phone)
11. **FTC 强制互斥**: ∀ review: synthetic == true ⇒ verified_purchase == false（schema 已锁；过去事故: 全部 12 条 review 同时 synthetic+verified，构成 FTC 16 CFR 465 可处罚虚假表示）
12. **AggregateRating 5 评论门槛**: ∀ aggregate_ratings: emit_jsonld == (review_count >= 5)；emit_jsonld=false 的 SKU，05/PDP 必须不输出 AggregateRating JSON-LD；过去事故: sku_002/003 仅 3 条 review 仍输出 aggregateRating
13. **denylist** (conventions.md §16): reviews[].body / case_studies[].body / ugc_assets[].caption 扫描 lorem ipsum / TODO / @example.com → 命中即 STOP
14. **press URL HTTP 200** (conventions.md §13): 每条 press_widget.logos[].url HEAD 请求必须 200，否则 `verified: false` 排除
```

## Step 5: 交付

```
✓ 社会化证明完成
  - 评论: <N> 条 (synthetic=<count>; verified=<count>)
  - SKU 评分: <list of sku → avg ★/N reviews>
  - UGC: <N> 条 (granted=<N>)
  - press logos: <list>
  - 案例: <N> 个

下一步: /eec-05-site-build (重 run 以消费 04b) 或人工 review reviews/
```

## 交互点

1. Step 1 预览后 Y/n
2. Module 2 生成评论时若 03.tone 空 → 暂停问是否用默认 neutral_helpful tone
3. Module 4 若 03.press_mentions 为空 → 提醒 press_widget.logos 必须 ≥1，否则跳过 widget
