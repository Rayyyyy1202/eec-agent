# Module 6 — 物化产出 (Prisma + DDL)

## 文件布局

```
eec/13-data-model/
├── prisma/
│   └── schema.prisma           # 给 Node/Next 用
├── migrations/
│   ├── 0001_init.sql           # 全部 CREATE TABLE
│   ├── 0002_indexes.sql        # 全部 CREATE INDEX
│   ├── 0003_triggers.sql       # set_updated_at 触发器 + audit trigger
│   └── 0004_seed_lookups.sql   # roles / collections 等查找表的 INSERT
├── seed/
│   └── seed_from_json.ts       # 业务数据从 JSON 灌入
└── raw/
    ├── pii_inventory.md
    └── entity_inventory.md
```

## Prisma schema 头

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 表 → Prisma model 映射

```prisma
model Product {
  id                    String              @id  // sku_001 等自然键
  name                  String
  short_name            String              @map("short_name")
  slug                  String              @unique
  description           String              @db.Text
  launch_status         String              @default("active")
  launch_date           DateTime?           @db.Date
  subscription_eligible Boolean             @default(false)
  concierge_eligible    Boolean             @default(false)
  created_at            DateTime            @default(now())
  updated_at            DateTime            @updatedAt

  variants              ProductVariant[]
  inventory             InventoryLevel[]
  reviews               Review[]
  collections           ProductCollection[]
  audiences             ProductAudience[]
  manuals               Manual[]
  videos                VideoTutorial[]
  parts_as_parent       PartsFinder[]       @relation("parent_sku")
  parts_as_replacement  PartsFinder[]       @relation("replacement_sku")
  ugc                   UgcAsset[]
  order_items           OrderItem[]

  @@map("products")
  @@index([launch_status], map: "idx_products_launch_status")
}
```

`@map("products")` 把 Prisma 默认的 `Product` 映射到 SQL `products`（保持 PascalCase model + snake_case table 的常规组合）。

## DDL 模板

```sql
-- migrations/0001_init.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;

-- catalog ---------------------------------------------------------------

CREATE TABLE products (
  id                    text PRIMARY KEY,
  name                  text NOT NULL,
  short_name            text NOT NULL,
  slug                  text NOT NULL UNIQUE,
  tagline               text,
  description           text NOT NULL,
  launch_status         text NOT NULL DEFAULT 'active'
                        CHECK (launch_status IN ('active','pre_order','archived')),
  launch_date           date,
  subscription_eligible boolean NOT NULL DEFAULT false,
  concierge_eligible    boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE products IS 'Source: eec/02-product-selection/output.json#/skus';

CREATE TABLE collections (
  handle      text PRIMARY KEY,
  title       text NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_collections (
  product_id     text REFERENCES products(id) ON DELETE CASCADE,
  collection_handle text REFERENCES collections(handle) ON DELETE CASCADE,
  sort_order     int NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, collection_handle)
);

-- ... 其他表
```

## 索引文件

```sql
-- migrations/0002_indexes.sql
CREATE INDEX idx_products_launch_status ON products(launch_status)
  WHERE launch_status != 'archived';
CREATE INDEX idx_product_collections_handle ON product_collections(collection_handle);
-- ...
```

## 触发器文件

```sql
-- migrations/0003_triggers.sql

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- ... 重复每张可变表

-- audit log 通用 trigger（写到 audit_log）
CREATE OR REPLACE FUNCTION audit_changes() RETURNS trigger AS $$
BEGIN
  INSERT INTO audit_log (actor_user_id, action, resource_type, resource_id, before, after, occurred_at)
  VALUES (
    current_setting('app.current_user_id', true)::uuid,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE((NEW).id::text, (OLD).id::text),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    now()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 给关键表挂 audit trigger（不是所有表都挂；events_log/audit_log 自己不挂）
CREATE TRIGGER trg_audit_orders AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_changes();
CREATE TRIGGER trg_audit_products AFTER UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION audit_changes();
CREATE TRIGGER trg_audit_role_permissions AFTER INSERT OR DELETE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION audit_changes();
```

## Lookup 数据 seed

```sql
-- migrations/0004_seed_lookups.sql
INSERT INTO roles (code, name) VALUES
  ('owner', 'Owner'),
  ('marketing', 'Marketing'),
  ('cs', 'Customer Service'),
  ('developer', 'Developer')
ON CONFLICT (code) DO NOTHING;

-- 4-role MVP RBAC matrix（参考 eec-05b-merchant-console 角色矩阵）
INSERT INTO role_permissions (role_code, resource, action) VALUES
  ('owner', '*', '*'),
  ('marketing', 'assets', 'read'),
  ('marketing', 'assets', 'write'),
  ('marketing', 'blog_posts', 'write'),
  ('marketing', 'reviews', 'reply'),
  ('cs', 'orders', 'read'),
  ('cs', 'orders', 'update_address'),
  ('cs', 'support_tickets', '*'),
  ('cs', 'reviews', 'reply'),
  ('developer', 'merchant_settings', 'write'),
  ('developer', 'audit_log', 'read')
ON CONFLICT DO NOTHING;
```

## 静态校验

```bash
cd eec/13-data-model && npx prisma format --schema=prisma/schema.prisma
psql --no-psqlrc -f migrations/0001_init.sql --dry-run  # 用临时 DB 试跑
```

## 交付

- `prisma_schema_path`: `eec/13-data-model/prisma/schema.prisma`
- `migrations[]`: 4 条（init / indexes / triggers / seed_lookups）
- `ddl_paths[]`: 上面 4 个 `.sql` 路径
