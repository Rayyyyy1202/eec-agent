# Module 4: Contact Form Config

## route_path

固定 `/contact` — schema 强制。05 据此渲染表单页。

## fields[] 设计

最少 5 个字段 (强制 ≥2)：

| id | label | type | required | 说明 |
|---|---|---|---|---|
| name | Your name | text | true | max_length 100 |
| email | Email address | email | true | max_length 200 |
| order_number | Order number (optional) | text | false | placeholder "RBR-12345" |
| reason | What's this about? | select | true | options: ["Order status", "Return / refund", "Warranty claim", "Product question", "Press / wholesale", "Other"] |
| message | Message | textarea | true | max_length 2000 |

## stub_until

- 默认 `never` — MVP 永久 stub: 表单提交触发本地 dataLayer event `contact_form_submit`，前端展示 "Thanks — we got your message and will reply within 1 business day"，但**不真正发送邮件**。
- 真发送：mode=ses 或 resend 时，stub_until 为 `RESEND_API_KEY` (etc.); 后端 endpoint 在 .env 配齐后才 POST 200，否则返回 501。

## post_endpoint

固定 `/api/contact` — 05 在 `app/api/contact/route.ts` 实现：
- stub_until=never: 返回 200 + JSON `{ ok: true, stub: true }`
- stub_until=<env_var> 且 env 未设: 返回 501 + JSON `{ ok: false, reason: "ESP not configured" }`
- env 设齐: 真实 ESP API 调用

## success_redirect

可选 — 默认表单 inline 显示 "Thanks". 若有 `success_redirect: "/help"` 则提交后重定向。

## tone-aligned 文案

heading + intro 文本写到 `eec/11b-customer-service/output.json#/contact_form_config` 时，必须用 03.cs_tone 的 do_phrases 风格：

- ✗ "Please fill out the form below and we will respond at our earliest convenience."
- ✓ "Tell us what's up — we read every message and reply within a business day."

## 输出

```jsonc
"contact_form_config": {
  "route_path": "/contact",
  "post_endpoint": "/api/contact",
  "stub_until": "never",
  "fields": [
    { "id": "name", "label": "Your name", "type": "text", "required": true, "max_length": 100 },
    { "id": "email", "label": "Email", "type": "email", "required": true, "max_length": 200 },
    { "id": "order_number", "label": "Order # (optional)", "type": "text", "required": false, "placeholder": "RBR-12345", "max_length": 30 },
    { "id": "reason", "label": "What's this about?", "type": "select", "required": true, "options": ["Order status", "Return / refund", "Warranty claim", "Product question", "Press / wholesale", "Other"] },
    { "id": "message", "label": "Message", "type": "textarea", "required": true, "max_length": 2000 }
  ]
}
```
