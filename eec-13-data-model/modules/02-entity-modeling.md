# Module 2 — 实体建模 (3NF)

## PK 选型

| 表类型 | PK 选型 | 理由 |
|---|---|---|
| 业务实体（products / customers / orders） | `id uuid` (gen_random_uuid()) | 跨系统稳定，避免暴露 row count |
| 自然键已稳定（products） | `id text` (用 sku_001 直接) | 跟前台 JSON 一致，seed 时不用映射 |
| Lookup（roles / collections） | `code text` 或 `handle text` | 业务可读 |
| Junction（product_collections） | 复合 PK (`product_id`, `collection_id`) | 防重 |
| 高频写入 + 时间序列（events_log / audit_log） | `id bigserial` 或 `id uuid v7` | bigserial 占空间小，uuid v7 时间排序 |

**本项目选**：业务实体用 `id text` 复用现有 JSON id（sku_001 / asset_001 / review_001），时间序列表用 `bigserial`，junction 用复合 PK。

## 列类型映射 (Postgres)

| JSON 类型 | DB 类型 |
|---|---|
| string (slug / code) | `text` |
| string (long text / md) | `text` |
| string (uuid) | `uuid` |
| string (date) | `date` |
| string (datetime ISO) | `timestamptz` |
| number (price) | `numeric(10,2)` |
| number (count / int) | `integer` |
| boolean | `boolean` |
| array (string[]) | `text[]` |
| object (palette / metadata) | `jsonb` |

## 自带列（每张可变表必有）

```sql
created_at timestamptz NOT NULL DEFAULT now(),
updated_at timestamptz NOT NULL DEFAULT now()
```

`updated_at` 由 trigger 维护：

```sql
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
```

软删除表加：`deleted_at timestamptz NULL`。

## 命名规则

- 表名：复数 snake_case (`products`, `order_items`, `asset_versions`)
- FK 列：`<referenced_singular>_id` (`product_id`, `customer_id`)
- 状态列：`status`，配 CHECK 约束
- 时间列：动作过去式 + `_at` (`published_at`, `subscribed_at`, `responded_at`)
- 软删除：`deleted_at`
- jsonb：`<purpose>_json` 或语义化 (`palette`, `params`)

## 状态枚举的处理

短期 ≤5 值用 CHECK 约束：

```sql
status text NOT NULL CHECK (status IN ('pending','paid','refunded','cancelled')),
```

长期会涨用查找表（如 `order_statuses`），暂不需要。

## 单例表 (singleton)

`merchant_settings` 永远 1 行：

```sql
CREATE TABLE merchant_settings (
  id text PRIMARY KEY DEFAULT 'default',
  CHECK (id = 'default'),
  brand_name text NOT NULL,
  tagline text,
  ...
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

## 派生数据不建表

- `aggregate_ratings` 从 `reviews` SQL 聚合视图生成
- `route_inventory` 从 `pages_legal` + `blog_posts` + `products` UNION 视图

## 交付

`entities[]` 数组——每张表一条，含 columns[]、primary_key、indexes[]、source_skill、domain_group。
