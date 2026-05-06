# Module 04 — PII Hashing + Purchase Full Spec + Email Consent Event

## A. PII Hash Algorithm（const "sha256"）

### 锁定理由
- Meta CAPI / Google Ads enhanced conversions / TikTok Events API 全部要求 SHA-256
- 锁 const 防止下游手抖换 MD5 / SHA-1

### Normalization 规则
- email: trim + lowercase
- phone: 去空格/连字符/括号 + E.164 格式 + 加国家码
- name: trim + lowercase
- address: trim + lowercase + 标准化后缀 ("street" → "st")

### 实施位置
- 客户端 emit dataLayer 时 hash（绝不发明文）
- GTM 自定义 JS 变量 SHA-256 函数 + crypto.subtle.digest
- 服务端 webhook 也 hash

## B. email_consent_event (H10)
即便 MVP 不发邮件，事件必须 ready：
```jsonc
{
  "email_consent_event": {
    "event_name": "email_signup",
    "params": [
      { "name": "email_hash", "type": "string", "required": true },
      { "name": "consent_source", "type": "string", "required": true },
      { "name": "consent_text_version", "type": "string", "required": true },
      { "name": "consented_at", "type": "string", "required": true }
    ],
    "destinations_phase2": ["dest_005"]
  }
}
```

## C. purchase_event_full_spec (H11 + H18)
6 字段必有 (must_emit_fields):
- order_id
- items
- shipping_address
- customer_email_hash
- total
- is_first_purchase ← H18

可加：currency, shipping_cost, tax, discount_code

```jsonc
{
  "purchase_event_full_spec": {
    "event_name": "purchase",
    "must_emit_fields": [
      "order_id", "items", "shipping_address",
      "customer_email_hash", "total", "currency",
      "shipping_cost", "tax", "discount_code",
      "is_first_purchase"
    ]
  }
}
```

### is_first_purchase 推断
- 后端通过 customer_email_hash 查历史订单：0 笔 → true；≥1 → false
- 第一方 cookie 缺失场景 → 默认 false（Phase 2 邮件不会错发 welcome 给老客）

## 输出
- 上述三块全部写入 output.json

## 校验
- pii_hash_algorithm == "sha256"
- email_consent_event.destinations_phase2 至少 1 项
- purchase_event_full_spec.must_emit_fields 至少 6 + 必含 is_first_purchase + customer_email_hash
- validation_checklist[] 加一项 "PII fields hashed via SHA-256" status=pass
