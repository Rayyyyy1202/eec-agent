# Module 01 — Events Spec（13 必有）

## 目标
设计 13 个必有事件 + 可选业务事件 → events_spec[]。schema allOf/contains 强制 13 个 named。

## 13 必有事件
| Name | Trigger | 关键 params | Phase 2 钩子 |
|---|---|---|---|
| page_view | 路由变化 | page_path, page_title | — |
| view_item | 商品页 mount | item_id, item_name, value, currency | — |
| add_to_cart | 加车按钮 click | item_id, quantity, value, currency | — |
| begin_checkout | /checkout mount | items[], total, currency | — |
| purchase | 订单成功 | order_id, items, total, customer_email_hash, is_first_purchase, shipping_address | H11 H18 |
| email_signup | newsletter form submit | email_hash, source | H9 H10 |
| cart_abandoned | begin_checkout 后 N 分钟未 purchase | cart_id, items, total | H15 |
| email_unsubscribed | unsubscribe link click | email_hash, list_id | H16 |
| return_initiated | RMA 表单提交 | order_id, return_reason | H17 |
| refund | 退款完成 | order_id, refund_amount, currency | H17 |
| order_shipped | 物流回调 | order_id, tracking_number, carrier | H17 |
| order_delivered | 物流回调 | order_id, delivered_at | H17 |
| order_canceled | 订单取消 | order_id, cancel_reason | H17 |

## 可选（按需加）
- view_item_list, select_item, add_to_wishlist, share, sign_up

## 步骤
1. 对每个事件填 trigger / params / destinations
2. params 中 PII 字段标 `pii: true`（customer_email, shipping_address 子字段）
3. destinations 至少 1 个（ga4 是默认必有）

## 命名规则
- `^[a-z][a-z0-9_]*$` (GA4 snake_case)
- 不超 40 字符

## 输出（events_spec[]）
```jsonc
{
  "name": "purchase",
  "trigger": "Stripe webhook payment_intent.succeeded → server emit",
  "params": [
    { "name": "order_id", "type": "string", "required": true },
    { "name": "items", "type": "array", "required": true },
    { "name": "total", "type": "number", "required": true },
    { "name": "currency", "type": "string", "required": true },
    { "name": "customer_email_hash", "type": "string", "required": true, "pii": true },
    { "name": "is_first_purchase", "type": "boolean", "required": true },
    { "name": "shipping_address", "type": "object", "required": true, "pii": true }
  ],
  "destinations": ["dest_001", "dest_002"]
}
```

## 并行
- 13 事件的 trigger / params 设计独立可并行

## 校验
- events_spec.length ≥ 13
- 全部 13 个 name 命中（schema allOf/contains 校验）
- 每个 event.destinations.length ≥ 1
