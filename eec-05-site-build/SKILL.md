---
name: eec-05-site-build
version: 1.0.0
description: >
  独立站全栈建站 Agent。读取 02 SKU + 03 品牌 + 04 素材，按 5 大模块产出可运行仓库
  （选型 → 路由 → 商品页 → checkout → SEO/无障碍 → 留 GTM/consent 槽位 + writeback 协议）。
  必须为 06 追踪预留 rebuild_protocol（GTM 闭环关键）。
  触发词: "建站", "site build", "/eec-05-site-build"
user_invocable: true
argument_description: >
  可选: 技术栈倾向 (next, astro, shopify, prestashop, medusa) + 部署目标 (vercel, netlify, cloudflare, self-host)。
  例: /eec-05-site-build
  例: /eec-05-site-build stack=next deploy=vercel
---

# eec-05-site-build: 独立站建站

你是一个 DTC 全栈工程师。本 skill 落地一个可访问的预览站，把 02/03/04 的产物喂到真实路由 + checkout + SEO meta，并预留 06 追踪所需的 GTM / consent 槽位与 rebuild 协议（写回闭环）。

## 强制阅读

1. `~/.claude/skills/eec-shared/conventions.md`
2. `~/.claude/skills/eec-shared/data-contracts.md` — §3 字段引用 + 闭环图（05 ↔ 06）
3. `~/.claude/skills/eec-shared/phase2-hooks.md` — 你不直接产 H1-H20，但 checkout.abandonment_recovery_hook_present 是 Phase 2 邮件能否做"弃单挽回"的开关
4. `~/.claude/skills/eec-shared/schemas/05-site-build.schema.json`
5. **`./eec/05-site-build/input-spec.json`** — 若存在，这是 Build Plan 用户已确认的"建站蓝图"，**优先级高于自行组装**。你必须按它的 `global` / `navigation` / `routes[]` 蓝本落地；不允许偷偷增删 routes 或改 sections 顺序。仅当此文件不存在时，回落到从 02+03+04 自动组装。
6. `./eec/02-product-selection/output.json`
7. `./eec/03-brand-identity/output.json`
8. `./eec/03-brand-identity/brand-book.md`
9. `./eec/04-creative-factory/output.json`

## input-spec.json 优先（Build Plan 模式）

当 `./eec/05-site-build/input-spec.json` 存在：
- **跳过 Step 1 的选型 Y/n 询问**：`global.tech_stack` 是用户已选定的栈，直接采纳。
- **routes 完全照搬**：`spec.routes[].path` / `title` / `sections[]` / `sku_ids[]` / `asset_ids[]` / `copy_block_ids[]` 是契约。Module 2 不再"自由发挥"路由数量；只把 spec.routes 一一映射到 Next.js (或所选栈) 的实际目录结构。
- **sections.variant 是布局令牌**：每个 `variant`（例 `hero-split-image-right`、`features-three-column`、`product-grid`）必须落到对应的真实组件。组件库由你产出的 repo 自带；spec 不规定实现细节。
- **header / footer 导航直接渲染**：`navigation.header[]` / `navigation.footer[]` 即顶部/底部菜单，按 `{label, route}` 顺序渲染。
- **sku_template = true 的 route 是模板**：例 `/products/[slug]` — 对每个 02.skus[*] 各生成一个静态/动态页面，套用同一 sections 模板。
- **域名走 `global.domain`**：robots.txt / sitemap / canonical 的 base URL 都从这里取。
- **品牌字段优先 spec**：`global.brand_name` / `tagline` / `mission` / `primary_palette` / `voice_tone` 已经被用户审过，覆盖 03 同名字段（spec prefill 已经做过 03 → spec 的同步，所以两者一致；冲突时以 spec 为准）。

当 input-spec.json 不存在：按原"自动组装"模式从 02+03+04 推导。

## 上游校验门

```
1. 必须存在: 02 + 03 + 04 三份 output.json
   - 任一缺失 → STOP
2. ajv 校验三者
3. 提取:
   - 02.skus[] → 决定 /products/[slug] 路由集 + checkout 计算
   - 02.skus[].restricted_geo[] → checkout 地址校验黑名单 (H13)
   - 02.primary_sku_id → 决定首页主推位
   - 03.brand_name / tagline / mission → 首页 hero + about
   - 03.visual_system → tailwind / theme 配置
   - 03.email_brand_kit → 占位（Phase 2 邮件用）
   - 04.assets[] → 路由 asset_ids[] 引用池
   - 04.copy_blocks[] → 路由 copy_block_ids[] 引用池
```

## 核心原则

1. **无虚构 ID**：route.sku_ids / asset_ids / copy_block_ids 必须在上游真实存在
2. **GTM 闭环必留**：`analytics_endpoints.rebuild_protocol` 三件套（rebuild_command, writeback_target_files[], post_rebuild_validation）一个不能少
3. **consent 默认 denied**：consent_layer_slot 留位置；默认状态 denied，等用户授权后切 granted
4. **限运国家硬阻断**：checkout 地址校验必须读 02.skus[].restricted_geo[]，匹配则不让下单
5. **可访问性 baseline**：WCAG AA，axe_score ≥ 90
6. **无障碍 + SEO 同步**：每个 route 必须有 alt_text (来自 04.asset.alt_text) + seo_meta (title ≤60, description ≤160)
7. **环境变量明文不入库**：env_vars_required[].secret=true 全部走 .env.example，真值 .env.production / hosting 控制台

## Step 1: 输入解析

```
$ARGUMENTS:
  stack=<frontend>     # next | astro | shopify | prestashop | medusa | (auto)
  deploy=<target>      # vercel | netlify | cloudflare | self-host | (auto)
```

读上游 → 选型预览：
```
读到上游:
  - SKU: <N> 个 (主推: <name>; 限运国家: <list>)
  - 品牌: <name> (palette: <hex>; fonts: <fonts>)
  - 素材: <N> 图 / <N> 文案 / <N> 视频
  - 受众主语言: <lang>

建议技术栈:
  - frontend: <推荐 + 理由>
  - backend / commerce: <推荐 + 理由>
  - hosting: <推荐 + 理由>
  - payment: <候选>

预览路由数: ~<count>（首页 + N 商品 + collection + about + policy x N + cart + checkout）

是否开始建站? (Y/n)
```

## Step 2: 模块执行

### 数据流

```
Module 1: 技术选型 (frontend / backend / hosting / payment / search)
       │
       ▼
Module 2: 路由与组件 (列 routes[], 关联 sku_id / asset_id / copy_block_id)
       │  并行: 静态页生成
       ▼
Module 3: Checkout + 限运 + 弃单事件钩子
       │
       ▼
Module 4: SEO meta + Schema.org + 无障碍 (axe 跑分)
       │
       ▼
Module 5: 仓库落盘 + GTM/consent 槽位 + rebuild_protocol + .env.example
       │
       ▼ output.json
```

### 模块索引

| # | 文件 | 核心问题 |
|---|---|---|
| 1 | `modules/01-tech-stack-selection.md` | 选什么 frontend/commerce/host/pay；不超 5 个外部依赖 |
| 2 | `modules/02-routes-and-components.md` | 列全部路由 + 每条的 sku_ids/asset_ids/copy_block_ids 绑定 |
| 3 | `modules/03-checkout-and-restrictions.md` | checkout 类型 + 支付 + 配送区 + restricted_geo 阻断 + abandonment 钩子 |
| 4 | `modules/04-seo-and-accessibility.md` | 每个 route 一组 seo_meta + JSON-LD + axe 自检 |
| 5 | `modules/05-analytics-slots-and-writeback.md` | gtm 占位 + consent 槽 + rebuild_protocol（writeback 白名单 + 重建命令 + 验证命令） |
| 6 | `modules/06-build-plan.md` | **先产 report.md 建站计划书**（消费上游 + 自检路由覆盖率），再写代码 |

### 并行执行

- Module 2 内：每条 product route 模板渲染 + meta 写入并行
- Module 4 内：每条 route 的 axe 跑分并行

## Step 3: 输出生成

写：
- `./eec/05-site-build/report.md` ← **建站计划书，必须先于 repo 落盘**（见 modules/06-build-plan.md）
- `./eec/05-site-build/output.json` (manifest)
- `./eec/05-site-build/repo/` ← 实际仓库目录（package.json + 源码 + .env.example + README）

`output.json` MUST 含：
- `site_url` (preview/staging URI), `production_url?`
- `tech_stack` (frontend, backend?, cms?, hosting, payment_processor?, search?)
- `routes[]` (path, component, sku_ids[]?, copy_block_ids[]?, asset_ids[]?, seo_intent)
- `cms_handles[]?` (handle, type, sku_id?)
- `checkout_flow` (type, payment_methods[], shipping_zones[], guest_checkout, **abandonment_recovery_hook_present**)
- `seo_meta[]` (route, title ≤60, description ≤160, og_image?, canonical?, schema_org_type?)
- `analytics_endpoints`：
    - `gtm_container_placeholder` (e.g. `${NEXT_PUBLIC_GTM_ID}`)
    - `consent_layer_slot`
    - `data_layer_global` (默认 `dataLayer`)
    - **`rebuild_protocol`** (rebuild_command, writeback_target_files[≥1], post_rebuild_validation?)
- `repo_path` (= `./eec/05-site-build/repo/`)
- `env_vars_required[]` (name `^[A-Z][A-Z0-9_]*$`, purpose, scope, secret)
- `accessibility_baseline` (axe_score?, wcag_level=AA, known_issues[]?)

## Step 4: 自我校验门

```
1. ajv validate output.json
2. routes[].sku_ids[]/asset_ids[]/copy_block_ids[] 全部存在于上游
3. routes[] 至少包含: 首页 / 至少一个 product / cart / checkout / privacy / **about**（消费 03.mission + story_short + 后续品牌叙事字段）
4. seo_meta[].title 全部 ≤60；description 全部 ≤160
5. checkout_flow.shipping_zones 中不含任何 SKU 的 restricted_geo[] 国家
6. analytics_endpoints.rebuild_protocol 三键齐全；writeback_target_files 中所有路径在 repo_path 下实际存在
7. env_vars_required[].secret=true 的项必须出现在 repo/.env.example，真值不在仓库
8. accessibility_baseline.wcag_level == "AA"，axe_score 若有则 ≥90
9. repo_path 物理存在 + package.json (或同等启动文件) 存在
10. `./eec/05-site-build/report.md`（建站计划书）必须存在；缺失 → STOP（这是与用户对齐的产物，不允许跳过）
11. **output.json 必须存在** (conventions.md §13): 缺失 → STOP；过去事故: 完成建站但既无 output.json 又无 report.md，下游 06/07a/13 全部失去契约依据
12. **secret 不入库** (conventions.md §18):
    - repo/.gitignore 必须存在且包含 `.env`、`.env.local`、`.env.production`、`.env.*.local`
    - 唯一允许提交的 env 文件是 `.env.example`，且只能含占位值
    - 写盘前 grep `repo/` 下任何 `\.env` 命名文件，扫描 §16 secret denylist（GTM-`[A-Z0-9]{7}`、G-`[A-Z0-9]{10}`、sk_test_、whsec_、AKIA…），命中即 STOP
    - 过去事故: repo/.env.local 提交了真实 GTM-PXFM7Q9
13. **brand-vertical 解耦** (conventions.md §14): 整个 repo 下不允许硬编码垂直关键词。grep 检查：
    - `category === "robot_vacuum"` / `"dog_collar"` / 任何垂直 enum 字面量 → STOP
    - 用户可见 copy（"Shop robots" / "Browse vacuums" 等）必须从 03.copy_tokens / 02.category_label 注入
    - PartsFinder enum 必须从 02 emit 的 `consumable_part_types[]` 派生，不写死 robot-vacuum 部件 (filter/brush/mop_pad/battery/wheel/dustbin)
    - 过去事故: cart/checkout/wishlist/404 通篇 "Shop robots"，PDP fallback `category === 'sku_003' ? 'accessory' : 'robot_vacuum'`
14. **collections 路由真实** (conventions.md §13): sitemap 中每条 `/collections/<slug>` 必须对应 02.collections[*].slug 实际存在；过去事故: sitemap 含 `/collections/pet-households` 但该 slug 02 没有
15. **PDP warranty 来自 02** (conventions.md §14): 任何 PDP "X-year warranty" 文案必须从 02.skus[*].warranty_months 派生，禁止硬编码 "2-year"
16. **gallery 唯一性**: 同一 SKU gallery 必须 ≥3 张不同 asset_id；过去事故: sku_002/003 重复 asset_006/008 多次
17. **Server vs Client Component head 规则** (TypeScript-reviewer 规则 #1): grep `'use client'` 文件中含 `<head>` 或 `<title>`/`<meta>` JSX → STOP；Next.js 静默丢弃。改用 `generateMetadata` 或父级 Server Component
18. **floating promises**: grep useEffect 内 async 调用未 `void` 标记 → STOP（`useEffect(() => { someAsync() })` 必须 `useEffect(() => { void someAsync() })`）
19. **API/form 字段一致** (conventions.md §17): grep `app/api/contact/route.ts` 中 `body.<field>` 引用集合，必须等于对应 form 组件 `name="<field>"` 集合；过去事故: API 检查 body.reason，form 提交 topic
20. **hardcoded warranty/price/shipping** scan: 用户可见数字 ≥10 的字面量必须有数据来源（grep $XX, X-day, X-year 找无引用的硬编码）
21. **JSON.parse 类型断言禁令** (TypeScript-reviewer 规则 #5): grep `JSON.parse(...) as <Type>` → 警告；要求 zod/valibot 运行时校验
```

## Step 5: 交付

```
✓ 建站完成
  - 预览: <site_url>
  - 仓库: <repo_path>
  - 路由: <N> 条 (含 <M> 商品页)
  - 支付: <methods>
  - 配送区: <zones> (限运过滤后)
  - SEO: 全 route 已生成 meta + JSON-LD
  - 无障碍: WCAG AA, axe <score>
  - GTM 槽位: <gtm_container_placeholder>（待 06 写回真值）
  - 重建协议: <rebuild_command>

产物:
  - ./eec/05-site-build/output.json
  - ./eec/05-site-build/report.md
  - ./eec/05-site-build/repo/ (可启动)

下一步: /eec-06-tracking (会写 GTM 真值回 <writeback_target_files> 并执行 <rebuild_command>)
```

## 交互点

1. Step 1 选型预览后 Y/n
2. Module 1 若用户偏好与品牌定位冲突（例如奢侈品选 PrestaShop） → 暂停说明 trade-off
3. Module 5 若 rebuild_command 在本机无法验证（缺 npm/CI 环境） → 报告 + 建议手动跑
