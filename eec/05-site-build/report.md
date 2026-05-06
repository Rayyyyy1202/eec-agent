# 建站计划书 — Roborock

**生成**: 2026-04-22 (backfilled by Phase 0 of content-gap plan)
**Skill**: eec-05-site-build v1.0.0
**Site URL**: https://roborock-staging.vercel.app
**Repo**: `./eec/05-site-build/repo/`

> 这份文档**应当在 Module 1 之前产出**，让用户在落代码前看到上游消费 audit + 缺口。
> 本次为补产（Phase 0）。后续 05 重跑必须先于代码生成此文档。

---

## 1. 上游消费 audit

### 02 Product Selection

| 字段 | 消费? | 落到哪里 |
|---|---|---|
| `skus[].id / slug / name` | ✓ | `/products/[slug]` 路由 + `lib/products.ts` |
| `skus[].description_short` | ✓ | PDP hero subhead |
| `skus[].description_long` | ✓ | PDP description block |
| `skus[].key_features[]` | ✓ | PDP "What's inside" 列表 |
| `skus[].usp` | ✗ 未消费 | 应当在 PDP 顶部摘要或 /compare 页 |
| `skus[].retail_price / compare_at_price` | ✓ | PDP price block |
| `skus[].subscription_eligible` | ✗ 未消费 | sku_003 应当有 Subscribe & save UI（Phase 5 修） |
| `skus[].image_briefs[]` | ✗ 未消费 | 全部走 PlaceholderImage（Phase 8 修） |
| `skus[].target_audience_ids[]` | ✗ 未消费 | 应当驱动 /collections/* 自动生成 |
| `skus[].restricted_geo[]` | ✓ | checkout 阻断 |
| `skus[].return_policy_days` | ✓ | /pages/shipping-returns + PDP trust badge |
| `skus[].low_stock_threshold` | ✗ 未消费 | 应驱动 "Notify when in stock"（Phase 5 修） |
| `bundle_suggestions[]` (root) | ✗ 未消费 | 应在 PDP 渲染（Phase 5 修） |

### 03 Brand Identity

| 字段 | 消费? | 落到哪里 |
|---|---|---|
| `brand_name / brand_handle` | ✓ | layout title + Org JSON-LD |
| `tagline` | ✓ | / hero h1 |
| `mission` | ✗ 未消费 | **应在 /about 渲染（Phase 1 修）** |
| `story_short` | ✗ 未消费 | **应在 /about 渲染（Phase 1 修）** |
| `tone.do_phrases / dont_phrases` | ✓ 间接 | 指导手写文案 |
| `visual_system.palette` | ✓ | tailwind.config.ts brand colors |
| `visual_system.typography` | ✓ | Inter 字体加载 + Söhne fallback 声明 |
| `visual_system.logo_brief` | ✗ 未消费 | 没真 logo（Phase 8 资产真化时补） |
| `visual_system.imagery_style` | ✗ 间接 | 影响 04 brief 但 site 没真图 |
| `visual_system.motion_style` | ✓ | tailwind transitionTimingFunction.brand |
| `email_brand_kit` | ✗ 不消费 | Phase 2 邮件用 |
| `cs_tone` | ✗ 不消费 | Phase 7 (eec-11b-customer-service) 用 |
| `welcome_offer` | ✗ 未消费 | Footer email_signup 应触发，但 popup 未实现 |

### 04 Creative Factory

| 字段 | 消费? | 落到哪里 |
|---|---|---|
| `assets[]` (id + alt_text) | ✓ 绑定 | route.asset_ids[] 引用，但渲染走 PlaceholderImage |
| `assets[]` 真实文件 | ✗ 未交付 | 都是渐变占位图（Phase 8 修） |
| `copy_blocks[]` | ✓ 间接 | 路由 copy_block_ids[] 引用，文案手写到组件 |
| `asset_coverage_matrix` | ✗ 未消费 | 应驱动 OG 图生成 |

### 07b Content Marketing

| 字段 | 消费? | 落到哪里 |
|---|---|---|
| `keyword_clusters[]` (6 个) | ✗ 不消费 | 用于 /blog 分类导航（Phase 2 修） |
| `content_calendar[]` (10 个) | ✗ **未消费** | **应自动生成 /blog/[slug] 路由（Phase 2 修）** |
| `drafts[]` (4 篇全文) | ✗ **未消费** | **应渲染为 /blog 4 篇文章（Phase 2 修）** |
| `internal_link_map` (10 条) | ✗ 未消费 | 文章里的 internal links 没有被解析 |
| `distribution_plan` | ✗ 不消费 | 08 投流和 11b 客服参考 |

### 06 Tracking · 07a Tech SEO · 08 Paid Ads · 09 Optimization

> 与本次建站 audit 关系较弱（runtime 注入 / 后置消费），不在此表展开。详见各 skill 的 output.json。

---

## 2. 当前路由清单 + 数据流

| Path | 来源 (skill.field) | 渲染状态 |
|---|---|---|
| `/` | 03.tagline + 02.skus[].name (3) | ✓ 真实 |
| `/products/[slug]` × 3 | 02.skus[*] | ✓ 真实，缺真图 |
| `/collections/all` | 02.skus[*] | ✓ 真实 |
| `/collections/pet-households` | 02.skus[001,003] (硬编码) | ⚠ 硬编码，应来自 audience_id |
| `/cart` | localStorage | ✓ noindex |
| `/checkout` | Stripe stub | ✓ noindex |
| `/help` | 6 FAQ 硬编码 | ⚠ 应来自 11b（Phase 7） |
| `/pages/privacy` | 03 衍生 + 手写 | ⚠ 法务应独立 skill（Phase 6） |
| `/pages/terms` | 同上 | ⚠ 同上 |
| `/pages/shipping-returns` | 02.return_policy_days + 手写 | ⚠ 同上 |

**当前覆盖**: 12 / "内容丰富 baseline 25" = **48%**

---

## 3. 缺口报告（按优先级）

### CRITICAL — 用户已发现并要求修复

- [ ] **/about 不存在**：03 已有 mission + story_short，但没路由消费。**Phase 1 必修**
- [ ] **report.md 不存在**：SKILL.md 承诺要产但今天才补上。**Phase 0 已修**

### HIGH — 内容浪费

- [ ] **07b 4 篇 draft + 10 个 calendar 全部丢弃**：花了 skill 跑出来但没上站。**Phase 2 修**
- [ ] **03 schema 缺 founders / values / sustainability / certifications / press / awards / timeline**：导致即使 05 想渲染品牌叙事也无米下锅。**Phase 1 修**
- [ ] **02 schema 缺 certifications / tech_explainers / spec_table**：PDP 内容深度不够。**Phase 3 修**

### HIGH — 信任缺失

- [ ] **没有真实 reviews / AggregateRating**：README 已承认是 placeholder。**Phase 4 (新 skill 04b) 修**
- [ ] **没有 UGC / 案例 / 媒体 logo**：同 Phase 4

### MEDIUM — 转化缺失

- [ ] **02 已声明 subscription_eligible / bundle_suggestions / low_stock_threshold 但 PDP 没体现**：**Phase 5 修，零 schema 改动**
- [ ] **没有站内搜索**：Header `<input>` 注释掉了。**Phase 5 修**
- [ ] **没有 wishlist / notify-in-stock / concierge 入口**：**Phase 5 修**

### MEDIUM — 法务/合规

- [ ] **缺 cookie_policy / accessibility_statement / CCPA / Prop 65 / warranty / EULA / DMCA**：3 条 policy 远不够 ad-account approval。**Phase 6 (新 skill 03b) 修**

### MEDIUM — 客服深度

- [ ] **/help 是 6 条硬编码 FAQ**：没有联系表单 / live chat / 视频教程 / 用户手册 / 配件查找器。**Phase 7 (新 skill 11b-customer-service) 修**

### LOW — 视觉

- [ ] **所有图都是占位渐变**：没真图，整站看起来是 mock。**Phase 8 (扩 04 schema + 资产管线) 修**

### LOW — 边角

- [ ] **没有自定义 404 / 500 / maintenance / search-results / HTML sitemap**：**Phase 9 修**

### Phase 2 (产品迭代)

- [ ] **没有账户体系（/account/*）**：依赖 `/eec-11-fulfillment` 落地
- [ ] **没有 i18n / 多币种**：依赖业务确认多区域

---

## 4. 路由覆盖率自检

```
必备 baseline (10):
  ✓ /
  ✗ /about               ← Phase 1
  ✓ /products/[slug] × 3
  ✓ /collections/all
  ✓ /cart
  ✓ /checkout
  ✓ /help
  ✓ /pages/privacy
  ✓ /pages/terms
  ✓ /pages/shipping-returns

→ baseline 9/10（缺 /about）

内容丰富版 (+15):
  ✗ /team                   ← Phase 1
  ✗ /sustainability         ← Phase 1
  ✗ /press                  ← Phase 1
  ✗ /blog                   ← Phase 2
  ✗ /blog/[slug] × 4        ← Phase 2
  ✗ /compare                ← Phase 3
  ✗ /reviews                ← Phase 4
  ✗ /contact                ← Phase 7
  ✗ /pages/cookies          ← Phase 6
  ✗ /pages/accessibility    ← Phase 6
  ✗ /pages/ccpa-do-not-sell ← Phase 6
  ✗ /pages/warranty         ← Phase 6
  ✗ /pages/eula             ← Phase 6
  ✗ /pages/prop65           ← Phase 6
  ✗ /pages/dmca             ← Phase 6

→ 内容丰富版 0/15

总覆盖: **12 / 25 (48%)**
```

---

## 5. 下次跑 05 前的 prerequisites

按 plan `/Users/yckj/.claude/plans/vast-imagining-breeze.md` 执行：

| Phase | 必备前置 | 状态 |
|---|---|---|
| Phase 1 | 03 schema + output 重产 | 未做 |
| Phase 2 | 07b schema + output 重产 | 未做 |
| Phase 3 | 02 schema + output 重产 | 未做 |
| Phase 4 | 新 skill `eec-04b-social-proof` 产出 | 未做 |
| Phase 6 | 新 skill `eec-03b-legal-pack` 产出 | 未做 |
| Phase 7 | 新 skill `eec-11b-customer-service` 产出 | 未做 |
| Phase 8 | 04 schema 扩 status 字段 + 真资产文件 | 未做 |

---

## 6. 决定记录

- **不重跑 05 整体**：避免覆盖人工编辑过的代码（components/Header.tsx 等）。改用增量 Phase 推进。
- **新增 sub-letter skills**（03b / 04b / 11b）而非膨胀现有 skill：保持单一职责。
- **真资产留 stub_until 接口**：Phase 8 不阻塞前面的内容工作。
