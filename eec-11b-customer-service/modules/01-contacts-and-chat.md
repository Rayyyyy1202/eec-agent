# Module 1: 渠道 + Live Chat

## contact_methods 渠道选择

| 渠道 | 默认 | 何时加 |
|---|---|---|
| email | 必出 | 所有 brand |
| web_form | 必出 (/contact) | 所有 brand |
| live_chat | optional | provider != none |
| phone | optional | include_phone=true (B2B / 高 ASP) |
| social_dm | optional | 03.social_handles 有 ≥1 active |

### sla_minutes 推荐

- email: 60-1440 (1h-24h，看产品复杂度)
- web_form: 1440 (24h，与 email 相当 — 因为 form 也走 email)
- phone: 5-30 (实时接听窗口内)
- live_chat: 5-15
- social_dm: 240 (社交渠道延迟容忍度高)

### hours_window 约定

格式 "Mon-Fri 9am-6pm PT" 或 "24/7" — 显式时区 (PT/ET/UTC)。

## live_chat_provider 配置

### 5 种 mode 选择树

```
B2C 高频咨询 + 已有 CS 团队 → intercom (功能最全; SaaS 贵)
B2C 中等量 + 想要 ticketing → zendesk (老牌; 集成多)
B2B 或想要免费起步 → crisp (免费档可用)
ToB 销售线索导向 → drift
轻量插件式 → tidio
没有 CS 团队 / MVP → none (前端不渲染 widget; 只走 email + form)
```

### consent_category 决定

- intercom / drift / tidio 默认 `marketing` (因为带 retargeting + lead capture)
- zendesk / crisp 默认 `functional` (纯支持，无营销)

`functional` ⇒ 默认 granted，widget 立即加载
`marketing` ⇒ 默认 denied，等 ConsentBanner 用户 opt-in 后才加载

### writeback_target_files 模板

mode 切换为非 none 时，本 skill 允许写入 05 repo 的：
```
[
  "eec/05-site-build/repo/.env.example",
  "eec/05-site-build/repo/components/ChatWidget.tsx",
  "eec/05-site-build/repo/app/layout.tsx"
]
```
其他文件不许碰 — 否则违反 mount-don't-clone。

## 输出

```jsonc
"contact_methods": [
  { "id": "contact_001", "channel": "email", "value": "support@<brand>.com", "hours_window": "Mon-Fri 9am-6pm PT", "sla_minutes": 60, "languages": ["en"], "label": "Email support" },
  { "id": "contact_002", "channel": "web_form", "value": "/contact", "hours_window": "24/7 (replies in business hours)", "sla_minutes": 1440, "label": "Contact form" }
],
"live_chat_provider": {
  "mode": "none",
  "stub_until": "never",
  "consent_category": "functional"
}
```
