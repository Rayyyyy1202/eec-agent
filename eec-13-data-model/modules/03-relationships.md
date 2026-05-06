# Module 3 — 关系建模

## 核心关系图（Mermaid 提纲）

```
products ─┬─< product_variants
          ├─< inventory_levels
          ├─< reviews
          ├─< manuals
          ├─< video_tutorials
          ├─<>─ collections (via product_collections)
          ├─<>─ audiences (via product_audiences)
          └─< parts_finder (parent_sku_id, replacement_sku_id 双 FK)

customers ─┬─< addresses
           ├─< orders
           ├─< carts
           └─< support_tickets

orders ─┬─< order_items >─ products
        └─< refunds

assets ─┬─< asset_versions
        ├─.─ ugc_assets (asset_id FK)
        ├─.─ press_logos (asset_id FK)
        └─.─ blog_posts.hero_asset_id

users ─┬─< user_roles >─ roles
       └─< role_permissions  (via roles)

reviews ─< review_replies
```

## on_delete 策略

| 关系 | on_delete | 理由 |
|---|---|---|
| product_variants → products | `cascade` | 删商品就删变体 |
| inventory_levels → products | `cascade` | 同上 |
| reviews → products | `restrict` | 不能删有评价的商品；先归档 |
| review_replies → reviews | `cascade` | 评价没了，回复留着没意义 |
| order_items → orders | `cascade` | 订单删除是少见操作 |
| order_items → products | `restrict` | 历史订单永不丢失 SKU 引用 |
| addresses → customers | `cascade` | 销户带走地址 |
| ugc_assets → assets | `cascade` | 无图就无 ugc |
| ugc_assets → products | `set_null` | 商品删，UGC 留下来作展示 |
| user_roles → users | `cascade` | 删用户就解除其角色 |
| user_roles → roles | `restrict` | 不允许删还在用的角色 |
| audit_log → users (actor) | `set_null` | 用户离职，审计记录保留 |

## Junction 表（M:N）

每个 M:N 都是独立 entity：

| Junction | from | to | 额外字段 |
|---|---|---|---|
| product_collections | products | collections | sort_order int |
| product_audiences | products | audiences | (无) |
| user_roles | users | roles | granted_at, granted_by_user_id |
| role_permissions | roles | (resource enum + action enum) | constraint_json (jsonb，为可选 row-level filter) |

`role_permissions` 不接 entity 而是接资源 + 动作：

```sql
CREATE TABLE role_permissions (
  role_code text REFERENCES roles(code) ON DELETE RESTRICT,
  resource text NOT NULL,  -- 'products' | 'orders' | ...
  action text NOT NULL,    -- 'read' | 'write' | 'delete' | 'approve'
  PRIMARY KEY (role_code, resource, action)
);
```

## 双 FK 同表（self-reference 模式）

`parts_finder` 的两个 FK 都指 `products`：

```sql
parent_sku_id text REFERENCES products(id) ON DELETE CASCADE,
replacement_sku_id text REFERENCES products(id) ON DELETE RESTRICT,
CHECK (parent_sku_id <> replacement_sku_id)
```

## Audit 关系

`audit_log` 不强 FK 到具体业务表（resource_type 是字符串），但 `actor_user_id` FK 到 `users`。
`before` / `after` 是 `jsonb`，不规范化——审计就是要看历史快照。

## 交付

`relationships[]` 数组——每条 FK 一条记录。junction 表的 PK 在 entities[] 里声明，relationships[] 给出指向 from/to 的两条 one_to_many。
