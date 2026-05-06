# eec-13-data-model — 报告模板

```markdown
# 数据库设计 — <Brand>

**生成时间**: <ISO date>
**Engine**: <postgres> <version>
**Hosting**: <supabase>
**Schema 命名空间**: public

## 总览

- 表数: <N>（catalog <c>, orders <o>, customers <cu>, cms <cm>, marketing <m>, ops <op>, audit <a>, auth <au>, phase2 <p>）
- 外键: <N>
- 索引: <N>
- 迁移: <N>
- PII 列: high <h> · low <l>

## ER 图

```mermaid
erDiagram
    products ||--o{ product_variants : has
    products ||--o{ reviews : receives
    customers ||--o{ orders : places
    orders ||--|{ order_items : contains
    products ||--o{ order_items : sold_in
    ...
```

## 表清单（按 domain group）

### catalog
| 表 | source | 行数预估 | 关键索引 |
|---|---|---|---|
| products | 02 | small | (slug) UNIQUE, (launch_status) partial |
| product_variants | 02 | small | (product_id) |
| ...

### marketing
...

## 引擎选型

<rationale>

## PII 与合规

| 表 | 列 | 等级 | 处理 |
|---|---|---|---|
| customers | email_hash | low | SHA-256，不存原文 |
| customers | phone_e164 | high | 仅 last 4 显示给非 owner 角色 |
| addresses | street | high | 仅订单上下文可见 |
| events_log | params.email | low | 已 hash（06 已处理） |

保留期: audit_log <N>d / sessions <N>d / events_log <N>d

## Phase 2 表占位

- `email_subscribers` (10): 表已建，列 `subscribed_at` nullable，今日 0 行。`/eec-10-email-crm` 跑后自动灌。
- `shipments` (11): 同上。

## 应用迁移

```bash
# 1) 创建 DB
createdb petropolitan_dev

# 2) 应用 schema
DATABASE_URL=postgres://... pnpm prisma migrate deploy

# 3) 灌种子数据
pnpm tsx eec/13-data-model/seed/seed_from_json.ts --dry-run  # 看 plan
pnpm tsx eec/13-data-model/seed/seed_from_json.ts            # 实灌
```

## 下一步 (eec-14-infra)

- 把 storefront `lib/products.ts` / `lib/social-proof.ts` 等从 readJson 切到 Prisma client
- 把 admin `app/admin/api/assets/upload` 从 PATCH JSON 切到 INSERT asset_versions + UPDATE assets
- Backup: 启用 Supabase PITR / 配置 daily logical dump 到 S3
- 监控: pg_stat_statements + 慢查询告警
```
