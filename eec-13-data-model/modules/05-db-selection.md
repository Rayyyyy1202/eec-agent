# Module 5 — 引擎与托管选型

## 决策树

```
要 jsonb / 数组列 / 全文搜索 / 复杂 RBAC?
  └─ 是 → Postgres
  └─ 否 → MySQL/PlanetScale 也可

要 storage + auth 一体? (DTC 早期)
  └─ 是 → Supabase (Postgres + Storage + Auth + Realtime)
  └─ 否 → Neon / Railway (纯 Postgres 更便宜)

会跑 ML / GIS?
  └─ 是 → Postgres + 对应 extension (pgvector / postgis)

强 ACID + 多区域?
  └─ 是 → CockroachDB / Spanner（独立站早期不需要）

只是 prototype?
  └─ 是 → SQLite 本地起步，随时迁 Postgres（用 Prisma 切方言）
```

## 默认推荐

**Postgres 16 on Supabase**——独立站 9/10 场景的最佳起点：

| 维度 | Supabase 给什么 |
|---|---|
| 数据库 | Postgres 16，每个项目独立实例 |
| Storage | 内置 S3 兼容 → `assets.delivered_path` 不用单独跑 R2/S3 |
| Auth | 内置 → `eec-05b-merchant-console` 的 auth_strategy 直接接 |
| Realtime | LISTEN/NOTIFY 包装好 → admin 看实时订单 |
| Edge Functions | Deno 跑 webhook (Stripe / Klaviyo) |
| Free tier | 500MB DB + 1GB storage + 50k MAU |
| 缺点 | 锁定 Supabase Auth schema；想换走得改 SQL |

替代：**Neon**——只要数据库，分支化 (`neon branch create`) 适合预览部署。便宜但没有 Storage。

## extensions 必装

| 扩展 | 干嘛 |
|---|---|
| `pgcrypto` | `gen_random_uuid()` 不依赖 `uuid-ossp` |
| `pg_trgm` | `customers.email ILIKE '%foo%'` 走索引 |
| `citext` | `email` 列大小写不敏感（替代每次 `LOWER(email)`） |
| `pg_stat_statements` | 慢查询分析 |
| `vector` (可选) | 后期接 RAG / 向量召回时用 |

## 命名空间 (schema)

`public`（默认）。多租户上来再考虑 `tenant_<slug>` per-merchant schema——本项目只有一个商家，不分。

## 备份策略（写进 report，不进 schema）

- Supabase 自动 daily 备份（PITR 7 天，付费版 30 天）
- 关键表（orders / customers）每周 logical backup 到 S3 cold storage
- DDL 全部走 migration 文件 → Git，灾备时 `psql < migrations/*` 重建

## 多环境

| Env | DB |
|---|---|
| local | SQLite via Prisma (`provider = "sqlite"`) |
| preview | Neon branch 或 Supabase 临时 project |
| staging | 独立 Supabase project |
| production | 独立 Supabase project，启用 PITR + read replica |

Prisma schema 的 `provider` 用环境变量切：`provider = env("DATABASE_PROVIDER")`。

## 交付

`database` object，含 engine / version / hosting / rationale / extensions / schemas_namespace。
