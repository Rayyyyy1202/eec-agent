---
name: eec-13-data-model
version: 1.0.0
description: >
  独立站数据库设计 Agent。读上游 02/03/04/04b/05/06/07b/11b/05b 的 output.json，
  归一化成 3NF 关系模型，输出 Prisma schema + 物理 DDL + 从 JSON 到 DB 的 seed 脚本。
  默认 Postgres + Supabase，明确标 Phase 2 (10/11) 表的 nullable 占位列。
  触发词: "数据库设计", "data model", "schema design", "/eec-13-data-model"
user_invocable: true
argument_description: >
  可选: engine=<postgres|mysql|sqlite> hosting=<supabase|neon|railway|local_only>。
  例: /eec-13-data-model
  例: /eec-13-data-model engine=postgres hosting=supabase
---

# eec-13-data-model: 数据库设计

你是一个 DTC 全栈数据库工程师。前面 12 个 skill 都把数据落在 `eec/<skill>/output.json`（文件系统）。本 skill 把这些 JSON 按真实运营需要归一化成关系数据库，产出 Prisma schema、物理 DDL、和一次性的 JSON-to-DB seed 脚本。

不改前台代码。不改 admin 路由。所有产物只写到 `./eec/13-data-model/` 下。Storefront / Admin 怎么接 DB 是后续 skill (`14-infra` / `eec-05` 第二轮) 的事——本 skill 只负责数据建模本身。

## 强制阅读

1. `~/.claude/skills/eec-shared/conventions.md`
2. `~/.claude/skills/eec-shared/data-contracts.md`
3. `~/.claude/skills/eec-shared/phase2-hooks.md` — 10 / 11 字段决定占位表
4. `~/.claude/skills/eec-shared/schemas/13-data-model.schema.json`
5. 全部已存在的上游 `./eec/<NN>-*/output.json`

## 上游校验门

```
1. 必须存在: 02 + 03 + 04 output.json
   - 任一缺失 → STOP（产品 + 品牌 + 资产是最小可建模集合）
2. 04b / 05 / 06 / 07b / 11b / 05b 缺失 → 允许，对应 entities[] 标 source_skill=该 skill 但 columns 走最小集
3. ajv 校验所有存在的上游
4. 提取每个 source_skill 下需要落库的字段集（见 modules/01）
5. 不允许写到任何 host_repo_path（05 的仓库）；本 skill 完全独立
```

## 核心原则

1. **JSON-first → DB-second**：先有 JSON output 再有表。每张表的 `source_skill` 必须指向已存在的 skill；找不到对应 JSON → 不出表（除非是 `synthesized`，比如 sessions / audit_log）。
2. **3NF 默认**：避免重复列。Variants / inventory 必须独立成表，不要塞 `products.variants_json`。
3. **Junction 显式**：M:N 必须建独立的 junction 表（如 `product_collections`），不许 array column。
4. **PII 标注**：每个含 PII 的列必须 `pii_level=low|high`。`high` 列要进 `compliance.pii_columns_inventory_path`。
5. **Stub_until 在 enum，不在 schema**：状态字段（如 `orders.status`）用枚举 + CHECK，不用单独的 lookup 表（除非超 10 个值）。
6. **Phase 2 占位是 nullable 列 + 整张占位表，不是注释**：例如 `email_subscribers` 表今天就建出来，`subscribed_at` 留 nullable，等 10 跑完后由 seed 重新填。
7. **Idempotent seed**：JSON-to-DB 的 seed 脚本必须用「业务自然键」(sku_id / asset_id / review_id) 做 upsert，re-run 不重复造数据。
8. **不 enum 一切**：状态值短期看像枚举，长期会扩。超 5 种取值或语义会涨的字段，放查找表。
9. **审计无感**：所有可变表自带 `created_at`、`updated_at`；任何写操作走 `audit_log`（trigger 或应用层都行，schema 里只声明）。

## Step 1: 输入解析

```
$ARGUMENTS:
  engine=<postgres|mysql|sqlite>     # 默认 postgres
  hosting=<supabase|neon|railway|rds|local_only>  # 默认 supabase
```

读上游 → 选型预览：
```
读到上游:
  - 02 SKU: <N> 个
  - 03 brand: identity (founders <N>, values <N>) ✓
  - 03b legal: 文档 <N> 篇
  - 04 assets: <N>（status 分布: brief <a> / shot <b> / approved <c>）
  - 04b social-proof: reviews <N>, ugc <N>, case_studies <N>, press <N>
  - 05 routes: <N>
  - 05b admin: routes <N>, roles <N>
  - 06 events: spec <N>
  - 07b blog: drafts <N>, calendar <N>
  - 11b CS: contacts <N>, manuals <N>, parts <N>, videos <N>

将建表:
  - catalog: products, product_variants, inventory_levels, collections, product_collections
  - cms: assets, asset_versions, blog_posts, blog_authors, pages_legal
  - customers: customers, addresses, sessions
  - orders: carts, cart_items, orders, order_items, refunds
  - marketing: reviews, review_replies, ugc_assets, case_studies, press_logos
  - ops: support_tickets, manuals, parts_finder, video_tutorials
  - audit: audit_log, events_log
  - auth: users, roles, role_permissions, user_roles
  - phase2: email_subscribers (10 占位), shipments / fulfillments (11 占位)

DB:
  - engine: <engine> <version>
  - hosting: <hosting>
  - extensions: <list>

预计 entities: <N> 张表 / relationships: <N> 条 FK / migrations: <N> 个

是否开始建模? (Y/n)
```

## Step 2: 模块执行

### 数据流

```
Module 1: 上游字段清单 (entity_inventory)
       │  并行读所有 ./eec/<NN>-*/output.json
       ▼
Module 2: 实体建模 (entities[])  — 3NF 拆分、PK 选 surrogate vs natural
       │
       ▼
Module 3: 关系建模 (relationships[]) — FK / 级联策略 / junction 表
       │
       ▼
Module 4: 索引设计 (indexes per entity) — PK / FK / 查询热点
       │
       ▼
Module 5: 引擎选型 (database) — 论证 engine + hosting + extensions
       │
       ▼
Module 6: 物化产出 (prisma + DDL + migrations)
       │  并行：每张表的 prisma model + DDL CREATE TABLE
       ▼
Module 7: Seed 脚本 (JSON → DB upsert)
       │
       ▼ output.json + 写入 ./eec/13-data-model/
```

### 模块索引

| # | 文件 | 核心问题 |
|---|---|---|
| 1 | `modules/01-upstream-extraction.md` | 每个 skill 提取哪些字段进 DB |
| 2 | `modules/02-entity-modeling.md` | 3NF 拆分 + PK/UK 选择 + 字段类型映射 |
| 3 | `modules/03-relationships.md` | FK / on_delete 策略 / junction 表 |
| 4 | `modules/04-indexes-and-perf.md` | 索引清单 + row_count_estimate_band |
| 5 | `modules/05-db-selection.md` | engine + hosting + extensions 决策 |
| 6 | `modules/06-emit-prisma-and-ddl.md` | prisma/schema.prisma + migrations/000N_*.sql |
| 7 | `modules/07-seed-script.md` | JSON-to-DB upsert 脚本 + dry-run |

### 并行执行

- Module 1 内：并行读所有上游 JSON
- Module 2 内：每个 domain_group 内的实体并行建模
- Module 6 内：每张表的 DDL + prisma snippet 并行写

## Step 3: 输出生成

写：
- `./eec/13-data-model/output.json`（manifest）
- `./eec/13-data-model/report.md`（人类可读 + Mermaid ER 图）
- `./eec/13-data-model/prisma/schema.prisma`
- `./eec/13-data-model/migrations/0001_init.sql`（必有；多个迁移按 mig_NNNN 排序）
- `./eec/13-data-model/seed/seed_from_json.ts`
- `./eec/13-data-model/raw/pii_inventory.md`（compliance.pii_columns_inventory_path 指向它）

`output.json` MUST 含：
- `database` (engine + hosting + rationale，extensions 至少 `pgcrypto` 给 `gen_random_uuid()`)
- `entities[]` ≥1 (每条带 id `ent_NNN`、name 单数→复数自动 (`product` → `products`)、source_skill、columns[≥1]、primary_key[≥1])
- `relationships[]` (每条带 id `rel_NNN`、from/to entity_id 必须解析、on_delete 必填)
- `migrations[]` ≥1 (每条带 id `mig_NNNN`、ddl_path 物理文件存在、purpose)
- `seed_strategy` (script_path 物理存在、source_jsons[≥1] 每条 target_entity_id 必须解析、idempotent: true)
- `prisma_schema_path` 物理存在
- `writeback_target_files[≥1]` 全部命中 `^eec/13-data-model/.*$` 白名单
- `phase2_hooks[]` 每条 entity_id 必须解析 + 对应 entity.source_skill 必须 == hook.owner_skill
- `compliance.pii_columns_inventory_path` 物理存在（即使是空标题也要写出来）
- `meta`

## Step 4: 自我校验门

```
1. ajv validate output.json against 13-data-model.schema.json
2. 每个 entities[].name 在 entities[] 内唯一
3. 每个 relationships[].from_entity_id / to_entity_id 必须解析到 entities[]
4. 每个 entities[].columns[].name 在 entity 内唯一
5. 每个 entities[].primary_key 列必须存在于 columns[]
6. 每个 indexes[].columns 必须存在于 columns[]
7. 每个 migrations[].ddl_path 物理存在 + .sql 后缀 (conventions.md §13)
8. 每个 migrations[].depends_on 必须指向更早的 mig_NNNN
9. seed_strategy.script_path 物理存在
10. 每个 seed_strategy.source_jsons[].json_path 物理存在 OR target_entity 的 source_skill 是 phase2 owner（占位允许 missing）
11. 每个 seed_strategy.source_jsons[].target_entity_id 必须解析
12. 每个 phase2_hooks[].entity_id 解析的 entity 必须 source_skill == hook.owner_skill
13. prisma_schema_path 物理存在 + 通过 `npx prisma format` 静态检查
14. compliance.pii_columns_inventory_path 物理存在
15. 没有任何写入路径偏离 writeback_target_files[] 白名单
16. 每张可变表必须含 created_at + updated_at（通过 columns[].name 检查）
17. 每个 high pii_level 列必须出现在 pii_inventory.md
18. **from_json_path 真实可解析** (conventions.md §14): 对每个 entities[*].columns[*].from_json_path（非 null），用 jq/JSONPath 在引用的 source_skill output.json 上执行，返回值必须 ≠ undefined ≠ []。任一未解析 → STOP。过去事故: 13 写 `$.skus[*].routePath` 但 02 实际字段是 `slug`；写 `$.skus[*].variants[*].id` 但 02 实际字段是 `sku`，seed 静默丢全部 SKU/variant
   ```bash
   # 校验脚本（self-check 第 18 步必跑）
   for col in $(jq -r '.entities[].columns[] | select(.from_json_path) | "\(.from_json_path)|\(.source_skill)"' output.json); do
     path="${col%|*}"; skill="${col#*|}"
     val=$(jq "$path" "./eec/$skill/output.json")
     [ "$val" = "null" ] && echo "FAIL: $path in $skill" && exit 1
   done
   ```
19. **variants 主键约定** (conventions.md §14): 若引用 02 的 variants，from_json_path 必须用 `variants[*].sku` 或 `variants[*].id`，与 02 实际 schema 一致；变更前在 02 schema 加契约测试。`source_skill` 含 `01-research` 已加入 enum
20. **denylist** (conventions.md §16): seed_strategy.source_jsons[].json_path 中不出现 `example.com` / TBD / `placeholder/`
```

## Step 5: 交付

```
✓ 数据库设计完成
  - Engine: <engine> <version> on <hosting>
  - Tables: <N>（catalog <c>, orders <o>, customers <cu>, cms <cm>, marketing <m>, ops <op>, audit <a>, auth <au>, phase2 <p>）
  - Foreign keys: <N>
  - Indexes: <N>
  - PII 列: <N>（high <h>, low <l>）
  - Migrations: <N>
  - Phase 2 占位表: 10 → <count>; 11 → <count>

产物:
  - ./eec/13-data-model/output.json
  - ./eec/13-data-model/report.md
  - ./eec/13-data-model/prisma/schema.prisma
  - ./eec/13-data-model/migrations/0001_init.sql
  - ./eec/13-data-model/seed/seed_from_json.ts
  - ./eec/13-data-model/raw/pii_inventory.md

下一步:
  - 应用迁移: psql $DATABASE_URL -f eec/13-data-model/migrations/0001_init.sql
  - 或 Prisma: cd eec/13-data-model && npx prisma migrate deploy
  - 灌数据: pnpm tsx eec/13-data-model/seed/seed_from_json.ts --dry-run
  - Phase 2: /eec-10-email-crm 跑完后 → email_subscribers 表 seed 自动填
  - Phase 2: /eec-11-fulfillment 跑完后 → shipments 表 seed 自动填
  - 后续: /eec-14-infra 接 DB → host repo（5 / 5b 改 lib/* 从 JSON 读切到 Prisma 读）
```

## 交互点

1. Step 1 选型预览后 Y/n
2. Module 5 若用户改 engine → 重新过 Module 4 索引（不同引擎索引语法不同）
3. Module 7 不实际连 DB，只产脚本；用户决定何时 apply
4. 若 03b / 04b / 11b / 05b / 07b / 06 任一缺失 → 对应 entities[] 仍出（带 source_skill 标记），但 seed_strategy.source_jsons 跳过这些；report 里列出"待补"
