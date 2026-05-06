# Module 4 — 索引与性能

## 索引规则

1. **PK 自动有索引** — 不用手动建
2. **每个 FK 列建索引** — Postgres 不自动建。少了它 `JOIN` + `DELETE CASCADE` 都退化成全表扫
3. **WHERE 高频列建索引** — `status / published_at / deleted_at`
4. **ORDER BY 高频列建索引** — `created_at DESC` 配合 PK
5. **复合索引按"等值在前、范围在后"** — `(customer_id, created_at)` 比 `(created_at, customer_id)` 更适合 "某客户的近 30 天订单"
6. **唯一约束当索引用** — `unique` flag 自动建唯一索引
7. **partial index 给非常稀疏的状态** — `WHERE deleted_at IS NULL` 给软删表
8. **JSONB 用 GIN 索引** — `params jsonb` 加 `USING gin (params)` 才能 `params @> '{"key":"x"}'` 走索引
9. **`pg_trgm` 给模糊搜索** — `customers.email` 用 `gin_trgm_ops` 才能 `ILIKE '%foo%'` 走索引

## 每域必有索引清单

### catalog
- `products(slug)` UNIQUE — 路由查找
- `products(launch_status) WHERE launch_status != 'archived'` — 列表只显示在售
- `product_variants(product_id)` — JOIN
- `inventory_levels(product_id, sku_variant_id)` UNIQUE — 一个 variant 一行

### customers
- `customers(email_hash)` UNIQUE — 登录查找（不存明文 email，存 hash）
- `addresses(customer_id)` — JOIN
- `sessions(token_hash)` UNIQUE
- `sessions(expires_at)` — 清理任务

### orders
- `orders(customer_id, created_at DESC)` — "我的订单"
- `orders(status) WHERE status IN ('pending','processing')` — Ops 工作台
- `orders(stripe_payment_intent_id)` UNIQUE — Stripe webhook
- `order_items(order_id)` — JOIN
- `order_items(product_id)` — 反查"这个 SKU 卖了几单"

### marketing
- `reviews(product_id, published_at DESC)` — PDP 评价列表
- `reviews(rating)` + `reviews(verified_purchase)` — 过滤
- `review_replies(review_id)` UNIQUE — 一评一回
- `ugc_assets(product_id)` — PDP UGC 区
- `press_logos(published_at DESC)` — 首页 trust bar

### cms
- `assets(status)` + `assets(use_case)` — 商家筛选
- `asset_versions(asset_id, version DESC)` — 拿最新版
- `blog_posts(slug)` UNIQUE
- `blog_posts(published_at DESC) WHERE published_at IS NOT NULL` — 列表
- `pages_legal(slug)` UNIQUE

### ops
- `support_tickets(customer_id, created_at DESC)`
- `support_tickets(status) WHERE status IN ('open','pending')`
- `support_tickets(assigned_to_user_id) WHERE status != 'closed'`

### audit
- `audit_log(actor_user_id, occurred_at DESC)`
- `audit_log(resource_type, resource_id)`
- `events_log(event_name, occurred_at DESC)`
- `events_log(session_id)`
- `events_log USING gin (params)` — 按 params 内字段查

### auth
- `users(email_hash)` UNIQUE
- `user_roles(user_id)` — 取用户所有角色
- `user_roles(role_code)` — 取角色所有用户

## row_count 估算 → 索引/分区决策

| Band | 行数 | 索引策略 |
|---|---|---|
| tiny | <100 | 不建索引也行（lookup 表） |
| small | <10k | 标准 btree 够用 |
| medium | <1M | FK + 高频列 btree；考虑 partial index |
| large | <100M | 一定要复合索引 + partial；考虑 brin 给时序列 |
| huge | ≥100M | 分区表 (PARTITION BY RANGE on created_at) |

本项目预估：
- `events_log` → large（每日 10k 事件 → 1 年 4M）；`audit_log` → medium
- 其他业务表 → small / medium 起步
- `assets` → small（≤500 张）但 GIN 索引必要因为 metadata jsonb 经常查

## 索引反模式（不要做）

- 给 boolean 列单独建索引（选择性差到忽略）
- 给低基数列建普通索引（用 partial 替代）
- 同一组列建多个前缀重叠的索引（保留最长那个）

## 交付

每个 entities[].indexes[] 数组。每条索引带 `rationale` 字段——说出来"为哪个查询模式建的"。
