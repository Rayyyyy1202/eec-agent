# Module 02 — Destinations

## 目标
配置 destinations[]：每个 platform 一个 dest_NNN，留 container_id 占位（08 投流前还要填）。

## 默认必有
| Type | scope | 何时 |
|---|---|---|
| ga4 | 全部 events | 永远必有 |
| meta_pixel | view_item / add_to_cart / purchase | 投 Meta 必有 |
| consent_layer | 接收 consent 状态 | GDPR/CCPA 必有 |
| internal_db | email_signup, order events | Phase 2 邮件 / 履约预留 |

## 按需加
| Type | 何时 |
|---|---|
| tiktok_pixel | 投 TikTok |
| google_ads | 投 Google Ads (conversion 专用) |
| pinterest | 投 Pinterest |
| snapchat | 投 Snap |
| gtm_server | 服务端 tracking (高可信场景) |

## 步骤
1. 读 03/08 的渠道倾向（若 08 已跑）
2. 列 default 必有 + 按需
3. 每个 dest 给 id `dest_NNN` + scope 描述 + container_id_placeholder（"TBD" 若未建）
4. 每个 events_spec[].destinations[] 必须 ref 已声明的 dest id

## 输出
```jsonc
"destinations": [
  { "id": "dest_001", "type": "ga4",          "scope": "all events",                  "container_id_placeholder": "G-TBD" },
  { "id": "dest_002", "type": "meta_pixel",   "scope": "ecommerce funnel",            "container_id_placeholder": "TBD" },
  { "id": "dest_003", "type": "tiktok_pixel", "scope": "purchase + add_to_cart",      "container_id_placeholder": "TBD" },
  { "id": "dest_004", "type": "consent_layer","scope": "consent state propagation",   "container_id_placeholder": "n/a" },
  { "id": "dest_005", "type": "internal_db",  "scope": "email_signup + lifecycle",    "container_id_placeholder": "phase2_pending" }
]
```

## 校验
- destinations.length ≥ 1
- 至少包含 1 个 ga4 type
- 至少包含 1 个 internal_db (Phase 2 钩子准备)
- 每个 id `^dest_[0-9]{3}$`
