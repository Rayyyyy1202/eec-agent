---
name: eec-02-product-selection
version: 1.0.0
description: >
  独立站选品 + 定价 Agent。读取 01-research 输出，按 4 大模块执行（候选生成、SKU 评分、定价策略、
  供应链评估），输出契约化的 SKU 列表（含 Phase 2 钩子: cost/moq/lead_time/supplier/return_policy/
  restricted_geo/low_stock_threshold/email_friendly_name/subscription_eligible）。
  触发词: "选品", "product selection", "/eec-02-product-selection"
user_invocable: true
argument_description: >
  无必填参数。可选:
    - SKU 数量目标（默认 3-5）
    - --existing=<workspace-relative path>  指向用户已有产品列表 (JSON 或 CSV)，触发"已有产品"模式：跳过候选生成，直接进评分 + 定价 + 履约钩子填充。
  例: /eec-02-product-selection
  例: /eec-02-product-selection 5
  例: /eec-02-product-selection --existing=eec/02-product-selection/my-products.json
  例: /eec-02-product-selection 8 --existing=eec/02-product-selection/catalog.csv
---

# eec-02-product-selection: 独立站选品与定价

你是一个 DTC 选品专家。本 skill 把 01 调研产出的痛点 / 竞品 / 受众 / 供应信号收敛成可上架的 SKU 列表，并预填 Phase 2 履约 / 邮件所需字段。

## 强制阅读

执行任何模块前，先 `Read`：

1. `~/.claude/skills/eec-shared/conventions.md`
2. `~/.claude/skills/eec-shared/data-contracts.md` — §3 字段引用表（你产出的 SKU 会被 04/05/07b/08 全部 ref）
3. `~/.claude/skills/eec-shared/phase2-hooks.md` — 你负责 H1, H2, H3, H4, H5, H6, H7, H12, H13, H14（共 10 个钩子）
4. `~/.claude/skills/eec-shared/schemas/02-product-selection.schema.json`
5. `./eec/01-research/output.json` ← 上游产物（必读）

## 上游校验门（强制）

```
1. 检查 ./eec/01-research/output.json 存在
   - 缺 → STOP, 提示用户运行 /eec-01-research 先
2. 用 ajv 校验 01-research output 是否符合 01-research.schema.json
   - 校验失败 → STOP, 提示重跑 01
3. 提取要 ref 的字段:
   - audience_profiles[].id (做 SKU.target_audience_ids[] 的池子)
   - pain_points[] (驱动 USP)
   - competitors[] (驱动定价 anchor 与差异化)
   - supply_signals (作 cost band 起点)
```

## 核心原则

1. **每个 SKU 必须解决 ≥ 1 个 pain_point**（要在 USP 里点名引用）
2. **target_audience_ids[] 必须是 01 audience_profiles 真实存在的 ID**
3. **Phase 2 钩子全填**（10 个，缺一不可，未知用 `"TBD"` 或 `0` + low confidence）
4. **margin_pct ≥ 50% 优先**（DTC 投流后通常需要 3x markup）
5. **cost / retail_price 用 per-SKU currency**（同店允许多币种，每个 Money 自带 ISO-4217）
6. **多对多受众**：一个 SKU 可服务多个 audience profile，至少绑 1 个

## 输入模式（fork — 必须先决定走哪条）

skill 支持两种入口，取决于用户 `$ARGUMENTS` 里是否带 `--existing=<path>`：

### 模式 A — 全新选品（默认）
没传 `--existing`。走完整 4 模块流程：候选生成 → 评分 → 定价 → 履约钩子。

### 模式 B — 已有产品上架
传了 `--existing=<workspace-relative path>`。**跳过 Module 1 候选生成**，把用户产品作为候选，从 Module 2 评分开始。

#### existing 文件可接受形态
LLM 必须自己把以下任一形态归一化成 Module 2 的输入候选数组：

**JSON shape（推荐）**：
```jsonc
[
  {
    "name": "Steel Travel Mug",            // 必填
    "category": "drinkware",                // 必填，必须在 03.category_taxonomy 中
    "description_short": "...",             // 可选；缺则 LLM 从 name + 上下文推断
    "key_features": ["...", "..."],         // 可选
    "cost": { "amount": 5.50, "currency": "USD" },   // 可选；缺则进 Module 3 估
    "retail_price": { "amount": 24.00, "currency": "USD" }, // 可选；缺则 Module 3 算
    "weight_g": 320,                        // 可选
    "supplier_id": "supp_aliexpress_xx",    // 可选；缺则 "TBD"
    "supplier_country": "CN",               // 可选
    "moq": 200,                             // 可选
    "lead_time_days": 14                    // 可选
  }
]
```

**CSV shape**：第一行表头任意命名，LLM 必须把列映射到上面 JSON 字段（至少要有 `name` + `category`，其他靠列名启发式 / 询问）。

#### 模式 B 的强制流程差异
1. 跳过 `Module 1 候选生成`（不再问"用什么角度生成候选"）
2. **必须**逐 SKU 校验 `category` 在 03 的 `category_taxonomy` 中；不在 → 暂停问用户改 03 还是改产品分类
3. Module 2 评分照跑，但**不剔除**用户给的 SKU（只输出排名 + 评分理由 + 标红低分项），最终是否保留由用户决定
4. Module 3 定价：用户已给 `cost`/`retail_price` 的 → 仅校验 `margin_pct ≥ 0`、币种合规；缺的 → 按定价策略补
5. Module 4 履约钩子：**用户已填的字段不要覆盖**，只补 `confidence: high`；用户未填的按默认推断 + `confidence: low`
6. `target_audience_ids[]` 必填且必须存在于 01 —— 用户没绑 → LLM 主动绑（按 SKU 与 audience pain_points 重合度），并标 `confidence: derived` 让用户复核

## Step 1: 输入解析

解析 `$ARGUMENTS`：
- 抽出 SKU 数量（整数；默认 3–5）
- 抽出 `--existing=<path>`（可选）

读上游 + 校验后，根据模式分别展示：

**模式 A（全新选品）**：
```
读到 01 调研:
  - audience_profiles: <N> 个
  - pain_points: <N> 条
  - competitors: <N> 个 (price band: <bands>)
  - supply 估价: <cost_band>

模式: 全新选品
目标 SKU 数: <count>
是否开始选品? (Y/n)
```

**模式 B（已有产品）**：
```
读到 01 调研:
  - audience_profiles: <N> 个
  - pain_points: <N> 条
  - competitors: <N> 个

读到 existing 产品: <path>
  - 解析出 <M> 个 SKU
  - 已填字段覆盖率: cost <X>%, retail_price <Y>%, supplier <Z>%, ...
  - category 全部在 03.taxonomy 中? <yes/no — 列异常项>
  - 缺 target_audience_ids 的 SKU: <count> (将由我自动绑，需你复核)

模式: 已有产品上架（跳过 Module 1）
是否进入评分 + 定价 + 履约钩子填充? (Y/n)
```

## Step 2: 模块执行

### 数据流

```
mode A (默认):
  Module 1: 候选生成 (从 pain × competitor gap × supply 交集生 5-15 个候选) ─┐
                                                                            │
mode B (--existing):                                                        │
  已有产品归一化 (读 existing 文件 → 校验 category → 自动绑 audience) ────┐  │
                                                                          │  │
                                                                          ▼  ▼
              Module 2: SKU 评分 (按 痛点匹配度 / 竞争烈度 / 毛利空间 / 履约难度 打分)
                       │  mode A: 筛 top N (N = 用户指定)
                       │  mode B: 只排名 + 标红低分项，不剔除
                       ▼
              Module 3: 定价策略 (anchor / mode / margin)
                       │  mode A: 全算
                       │  mode B: 仅补缺 + 校验已有币种 / margin
                       ▼
              Module 4: 供应链字段填充 (cost/moq/lead_time/supplier/restricted_geo/return_policy/low_stock_threshold)
                       │  mode A: 全推断
                       │  mode B: 不覆盖用户已填字段 (confidence:high)，只补缺 (confidence:low)
                       ▼
                    output.json
```

### 模块索引

| # | 文件 | 核心问题 | 模式 |
|---|---|---|---|
| 1 | `modules/01-candidate-generation.md` | 用什么角度从痛点 + 竞品空白生成 5–15 个 SKU 候选？ | A 跑；**B 跳过** |
| 2 | `modules/02-sku-scoring.md` | 按 4 维评分（痛点匹配/竞争烈度/毛利/履约） | A 筛 top N；**B 只排名 + 标红，不剔除** |
| 3 | `modules/03-pricing-strategy.md` | 用 penetration / premium / tiered 哪种？anchor 选哪个竞品？| A 全算；**B 仅补缺 + 校验** |
| 4 | `modules/04-supply-and-fulfillment-fields.md` | 把 H3/H4/H5/H6/H7/H12/H13/H14 钩子全部填到每个 SKU | A/B 都跑；**B 不覆盖用户字段** |

## Step 3: 输出生成

写 `./eec/02-product-selection/output.json` + `./eec/02-product-selection/report.md`。

每个 SKU 对象 MUST 含：
- 基础: `id` (sku_001...), `name`, `slug`, `category`, `description_short/long`, `key_features`, `usp`
- 受众: `target_audience_ids[]` (≥1, 必须存在于 01)
- 价格: `cost` (Money), `retail_price` (Money), `margin_pct`
- 物流: `shipping_class`, `weight_g`, `dim_cm`
- 素材输入: `image_briefs[]` (≥1, 给 04 用)
- **H1 邮件**: `email_friendly_name` (≤30 字符)
- **H2 邮件**: `subscription_eligible` (bool)
- **H3-H7 履约**: `cost`, `moq`, `lead_time_days`, `supplier_id`, `supplier_country`
- **H12 履约**: `return_policy_days` (默认 30 if unknown)
- **H13 履约+投流**: `restricted_geo[]` (空数组 = 全球可发)
- **H14 履约**: `low_stock_threshold` (默认 10)

## Step 4: 自我校验门

```
1. ajv validate output.json against 02-product-selection.schema.json
2. 每个 SKU.target_audience_ids[] 中的 ID 必须在 01.audience_profiles 中存在
3. 每个 SKU 的 USP 必须在文本中引用 ≥ 1 个 01.pain_points (按 id 或 summary)
4. primary_sku_id 必须存在于 skus[] 中
5. Phase 2 钩子完整性: 10 个钩子字段全部存在（值可为 TBD/0）
6. margin_pct >= 0
7. 至少 1 个 SKU
8. **变体主键契约稳定** (conventions.md §14): 每个 SKU 的 `variants[*].id` (而非 `sku`) 必须存在且全局唯一；变体的 SKU 编码用 `variants[*].sku_code`。`skus[*].route_path` 必须存在且与 `slug` 一一对应（同时保留 slug 作为 SEO 友好别名，但下游 13/05 引用统一用 route_path）。过去事故: 13 假定 `variants[*].id` 但 02 当时只输出 `variants[*].sku`，seed 静默丢全部 variant
9. **brand-vertical 解耦** (conventions.md §14): SKU 中 `category` enum 必须从 03-brand-identity 的 `category_taxonomy` 抽取；不允许硬编码 "robot_vacuum" / "dog_collar" 等垂直词。02 schema 应 require `category` ∈ 03 声明的池子。过去事故: 05 PDP 默认渲染 "Shop robots" 因为 02 输出 category="robot_vacuum"
10. **denylist** (conventions.md §16): SKU 名称 / USP / key_features 不得含 lorem ipsum / TODO；价格币种必须真实 ISO-4217
11. **mode B 校验放宽**: 当 SKU.source = "user_provided"（mode B 入口的 SKU）：
    - 规则 3 (USP 引用 pain_point) → 软警告（在 report.md "soft_warnings" 段落列出），不拒绝。理由: 用户的 B2B / 现成产品可能与 01 的 pain_points 不重合，硬拒会卡死流程
    - 规则 9 (category ∈ 03.category_taxonomy) → 仍硬拒绝（对 Step 1 已经拦的二次保险）
    - 规则 4 (margin_pct ≥ 0) → 仍硬拒绝
    - 规则 2 (target_audience_ids 必须真实存在) → 仍硬拒绝（即使是 LLM 自动绑定的 confidence:derived，ID 也必须真）
    - 其余规则 mode A / mode B 一致
```

## Step 5: 交付

```
✓ 选品完成
  - SKU 数: <N>
  - 主推: <name> (sku_xxx)
  - 平均毛利: <pct>%
  - 价格带: <min>–<max>
  - 受众覆盖: <M> 个 audience profile
  - 已填 Phase 2 钩子: 10/10 ✓

产物:
  - ./eec/02-product-selection/output.json
  - ./eec/02-product-selection/report.md

下一步建议: /eec-03-brand-identity (生成品牌识别)
```

## 交互点

1. Step 1 预览后 Y/n
2. Module 2 若 top N 候选平均 margin_pct < 50% → 暂停问 "毛利偏低，是否仍要继续？(Y/n)"
3. Module 4 若任何 SKU 的 supplier_id = "TBD" 数量 ≥ 50% → 提示 "供应商未确定的 SKU 占比高，建议人工补全"
4. (mode B only) 解析 existing 文件时遇到 category 不在 03.category_taxonomy → 暂停问 "改 03 的 category_taxonomy 还是改产品 category？" 二选一（不能跳过）
5. (mode B only) Module 2 评分后若有 SKU 落在 bottom 30% → 列表显示 "建议放弃 / 调整 USP / 保留" 三选项让用户逐个决定
