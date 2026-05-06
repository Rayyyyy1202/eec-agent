# Module 3: Parts Finder + Escalation Policy

## parts_finder 映射规则

每条记录 = "拥有 parent SKU 的人，应该买 replacement SKU"。

### 来源

- 02.skus[].id 中找 consumable 类（filter / brush / mop_pad / battery / dustbin / kit）
- 与 robot SKU 映射：每个 robot SKU + 每种部件 = 一条记录

### fitment_note (≤200 字)

明确写出兼容范围 + 替换流程一行内：
- "Fits all S-Series Pro generations (2024+). Snap-out replacement, no tools."
- "Fits both S-Series Pro and E-Series Essential. Replace every 60 days for pet households, 90 days otherwise."

### replacement_interval_days

来自实测/行业标准：
- HEPA filter: 60-90
- 主刷: 180-365
- 边刷: 90-180
- 拖布: 30-50 次洗
- 电池: 730-1095 (2-3 年)

### part_type 枚举

`filter | brush | mop_pad | battery | wheel | dustbin | kit`
— `kit` 表示打包套装（如 6-month replenish），通常映射多个 part_type 用一条记录覆盖。

## escalation_policy

### cs_tone_ref 强制

字符串必须形如 `eec/03-brand-identity/output.json#/cs_tone` — 这是契约，05 据此读 do/dont phrases。

### rules 设计模式

| trigger | action | sla_minutes |
|---|---|---|
| Refund > $200 | Escalate to human supervisor | 60 |
| Negative sentiment 2+ messages | Hand off to senior CS | 30 |
| Safety concern (battery/fire/injury) | Page on-call lead immediately | 5 |
| Warranty claim with photo evidence | Auto-RMA + ship label | 1440 |
| Order missing > 7 days post-ship | Refund preauth + investigate carrier | 240 |

至少 3 条；safety 必出（产品类目相关 — 锂电池 → fire/battery rule 必出）。

### sla_minutes 与 contact_methods sla 对齐

不能比相应渠道 SLA 还快（例：email SLA 60min，escalation SLA 5min — 5min 必须保证有 phone or live_chat 渠道支撑，否则无法兑现）。

## 输出

```jsonc
"parts_finder": [
  { "parent_sku_id": "sku_001", "replacement_sku_id": "sku_003", "fitment_note": "Fits all S-Series Pro. Snap-out filter + brush; covers 6 months for pet households.", "replacement_interval_days": 180, "part_type": "kit" }
],
"escalation_policy": {
  "cs_tone_ref": "eec/03-brand-identity/output.json#/cs_tone",
  "rules": [
    { "trigger": "Refund request > $200", "action": "Escalate to human supervisor + email courtesy reply within 1h", "sla_minutes": 60 },
    { "trigger": "Negative sentiment in 2+ consecutive messages", "action": "Hand off to senior CS rep + tag thread 'recovery'", "sla_minutes": 30 },
    { "trigger": "Battery / fire / personal injury report", "action": "Page on-call lead immediately; do NOT respond by template", "sla_minutes": 5 }
  ]
}
```
