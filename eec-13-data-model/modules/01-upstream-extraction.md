# Module 1 — 上游字段提取

每个上游 skill 的 output.json 提取哪些字段进 DB。下表是「最小落库字段集」——其他 JSON 字段按需扩展。

## 02-product-selection → catalog

| JSON path | 落到表 | 列 |
|---|---|---|
| `$.skus[*].id` | products | id (PK, natural key) |
| `$.skus[*].name / shortName / tagline / description` | products | name, short_name, tagline, description |
| `$.skus[*].route_path` | products | slug (unique) |
| `$.skus[*].price.amount / currency` | product_variants | price_amount, currency (一个 SKU 一个 variant 起步；扩展时拆) |
| `$.skus[*].compare_at_price` | product_variants | compare_at_price |
| `$.skus[*].launch_status / launch_date` | products | launch_status, launch_date |
| `$.skus[*].subscriptionEligible / conciergeEligible` | products | subscription_eligible, concierge_eligible |
| `$.skus[*].inventory_status` | inventory_levels | status_band (in_stock / low / preorder) |
| `$.skus[*].audience_ids[]` | product_audiences (junction) | product_id, audience_id |
| `$.collections{handle: {...}}` | collections | handle (PK), title, description |
| `$.skus[*].collection_handles[]` | product_collections (junction) | product_id, collection_id |

## 03-brand-identity → settings

只有 1 行，进 `merchant_settings` 单例表（id 固定为 'default'）：

| JSON path | 列 |
|---|---|
| `$.brand_name` | brand_name |
| `$.tagline / mission / story_short` | tagline, mission, story_short |
| `$.palette` | palette (jsonb) |
| `$.welcome_offer` | welcome_offer (jsonb) |
| `$.cs_tone` | cs_tone (jsonb) |
| `$.founders[]` | → 独立表 founders |
| `$.values[]` | → 独立表 brand_values |

## 03b-legal-pack → cms

| JSON path | 落到表 | 列 |
|---|---|---|
| `$.docs[*]` (privacy/terms/cookies/ccpa/prop65/warranty/gdpr/dmca) | pages_legal | slug (PK), title, body_md, last_reviewed_at |

## 04-creative-factory → cms

| JSON path | 落到表 | 列 |
|---|---|---|
| `$.assets[*].id` | assets | id (PK) |
| `$.assets[*].kind / use_case / status` | assets | kind, use_case, status |
| `$.assets[*].brief_md_path / delivered_file_path / width / height` | assets | brief_path, delivered_path, width, height |
| `$.assets[*].alt_text / caption` | assets | alt_text, caption |
| 上传新版本 → 不替换原行 | asset_versions | asset_id (FK), version, file_path, uploaded_at |

## 04b-social-proof → marketing

| JSON path | 落到表 | 列 |
|---|---|---|
| `$.reviews[*]` | reviews | id, sku_id, rating, title, body, author_name, author_location, verified_purchase, published_at |
| `$.reviews[*].merchantResponse` | review_replies | review_id (FK), body, responded_at |
| `$.aggregate_ratings[*]` | (派生视图) | — 不落表，从 reviews 聚合 |
| `$.ugc_assets[*]` | ugc_assets | id, source_handle, source_url, asset_id (FK to assets), product_id (FK) |
| `$.case_studies[*]` | case_studies | id, title, body_md, customer_name |
| `$.press_logos[*]` | press_logos | id, outlet, headline, url, asset_id (FK) |

## 05-site-build → cms (路由清单)

`$.routes[*]` → 不落表（路由由代码决定）；只把 `noindex` 配置进 `pages` 表（如果要 CMS-backed routing）。MVP 跳过。

## 05b-merchant-console → auth

| JSON path | 落到表 | 列 |
|---|---|---|
| `$.auth_strategy.scope = role_based` 时 | users / roles / role_permissions / user_roles | 标准 RBAC 四表 |
| (本 skill 默认从 4-role MVP) | roles | 'owner', 'marketing', 'cs', 'developer' |
| `$.admin_routes[*]` 的权限 | role_permissions | role_id, resource, action |

## 06-tracking → audit

| JSON path | 落到表 | 列 |
|---|---|---|
| `$.events_spec[*]` | (不落表，是 schema) | — |
| 运行时事件 | events_log | id, event_name, params (jsonb), session_id, occurred_at, consent_state (jsonb) |

## 07b-content-marketing → cms

| JSON path | 落到表 | 列 |
|---|---|---|
| `$.drafts[*]` | blog_posts | id, slug (PK), title, body_md, published_at, hero_asset_id (FK to assets), author_id (FK) |
| `$.drafts[*].author` | blog_authors | id, name, bio |
| `$.content_calendar[*]` | (不落表，是计划) | — |

## 11b-customer-service → ops

| JSON path | 落到表 | 列 |
|---|---|---|
| `$.contact_methods[*]` | contact_methods | id, kind (email/phone/chat), value, hours_window, sla |
| `$.video_tutorials[*]` | video_tutorials | id, title, youtube_id, related_sku_id (FK) |
| `$.manuals[*]` | manuals | id, sku_id (FK), pdf_url, language, page_count |
| `$.parts_finder[*]` | parts_finder | id, parent_sku_id (FK), replacement_sku_id (FK), fitment_note |
| 运行时工单 | support_tickets | id, customer_id (FK), subject, body, status, assigned_to_user_id, created_at |

## Synthesized (无上游 JSON)

| 表 | 用途 |
|---|---|
| customers | 注册客户。auth.users 1:1。 |
| addresses | 收货地址。customer_id (FK)。 |
| sessions | 登录 session。Stamped JWT 替代时可去掉。 |
| carts / cart_items | 进行中的购物车。customer_id 可空（游客）。 |
| orders / order_items / refunds | 订单。Stripe webhook 灌入。 |
| audit_log | 所有写操作。actor_user_id, action, resource_type, resource_id, before (jsonb), after (jsonb), occurred_at。 |

## Phase 2 占位

| 表 | owner_skill | 现在状态 |
|---|---|---|
| email_subscribers | 10-email-crm | 表建出来；列：email_hash, source, subscribed_at (nullable), unsubscribed_at (nullable), tags (text[])。今天没数据 |
| email_campaigns | 10-email-crm | 仅 id + name 列；body / sent_at 等等 10 跑完再加列 |
| shipments | 11-fulfillment | order_id (FK), carrier, tracking_number, status, shipped_at (nullable) |
| fulfillment_centers | 11-fulfillment | id, name, address。今天空表 |

## 交付

`raw/entity_inventory.md` 列出每张表 → 哪个上游 skill → 字段 mapping。
