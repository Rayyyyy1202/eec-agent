# Module 02 — Tone (Marketing + CS H19 + Welcome Offer H20)

## 目标
- 营销 tone: voice descriptors / persona archetype / do-dont phrases
- **H19** cs_tone: 区别于营销 tone，更共情，给 Phase 2 客服模板用
- **H20** welcome_offer: 欢迎券（Phase 2 邮件第一封 anchor）

## 输入
- 01.audience_profiles[].psychographics（语境）
- 01.competitors[].key_angle（避免雷同）

## 步骤
### A. Marketing Tone
1. 从 audience psychographics 抽 ≥ 3 个 voice descriptors（如 "warm, witty, no-jargon"）
2. 选 1 个 persona archetype（参考 12 archetypes：caregiver / explorer / sage / etc.）
3. 列 5-8 do_phrases（英文）+ 5-8 dont_phrases（英文）

### B. CS Tone (H19)
- 比 marketing 更共情、更慢
- 必须有 ≥ 3 voice descriptors（独立于 marketing）
- 列 do/dont（英文）
- `escalation_threshold`: 描述什么场景升人工（例 "退款 > 100 USD" 或 "用户 3 次重复问"）
- `default_signoff`: 一句签名话

### C. Welcome Offer (H20)
- `enabled`: 默认 true（即便 MVP 不发邮件，Phase 2 自动接）
- `type`: percent_off | fixed_amount | free_shipping | free_gift
- `value`: 数值（percent → 10 / 15；fixed → 5）
- `currency`: type=fixed_amount 时必须给 ISO-4217（沿用主 SKU 币种）
- `one_time_use`: 默认 true
- `expires_after_days`: 默认 14

## 输出
```jsonc
{
  "tone": {
    "voice_descriptors": ["warm","witty","no-jargon"],
    "persona_archetype": "caregiver",
    "do_phrases": ["..."],
    "dont_phrases": ["..."]
  },
  "cs_tone": {
    "voice_descriptors": ["empathic","patient","clear"],
    "do_phrases": ["..."],
    "dont_phrases": ["..."],
    "escalation_threshold": "refund > 100 USD or 3rd-time issue",
    "default_signoff": "Always here, — <Brand> Care"
  },
  "welcome_offer": {
    "enabled": true,
    "type": "percent_off",
    "value": 10,
    "one_time_use": true,
    "expires_after_days": 14
  }
}
```

## 校验
- tone.voice_descriptors.length ≥ 3
- cs_tone.voice_descriptors.length ≥ 3
- welcome_offer 块完整（enabled=false 也必须有 type）
- type=fixed_amount → currency 必填
