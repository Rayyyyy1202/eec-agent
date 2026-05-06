# Module 04 — Decisions

## 目标
对每个 critical / high diagnostic：决定 action → dec_NNN (绑 ≥1 diagnostic_id)。

## 9 个 action（schema enum）
| Action | 适用 |
|---|---|
| pause | spend ≥ 3x AOV 0 purchase, ROAS < 0.3 长期 |
| scale_up | ROAS > 2 × 3+ days |
| scale_down | ROAS 1.0-1.5（保留观察） |
| swap_creative | 创意疲劳 / CTR 低 |
| change_audience | 受众疲劳 / 受众错配 |
| change_landing | landing bounce > 80% / PDP 转化低 |
| duplicate | 表现好的 ad set 复制再投 |
| consolidate | 多个 ad set 重叠受众 → 合并 |
| no_change | 数据不足判断 |

## 步骤
1. 对每条 critical / high diagnostic：选 action
2. target = 被作用的 ID（campaign_NNN / paud_NNN / pairing_NNN / route）
3. target_type ∈ enum
4. rationale = 一句话解释为什么这个 action（结合 diagnostic）
5. expected_impact = 期望（"CPA 降 30%" / "ROAS 升至 1.8"）
6. diagnostic_ids[] ≥ 1（必绑）

## 决策矩阵
| Diagnostic 模式 | 推荐 action |
|---|---|
| campaign 无转化 | pause（先停损）|
| audience 疲劳 | swap_creative + duplicate（受众不变创意换） |
| creative 低 CTR | swap_creative |
| audience 错配 | change_audience |
| PDP 低转化 | change_landing（回 05 改） |
| ROAS > 2 持续 | scale_up |
| 多受众重叠 | consolidate |

## 并行
- 每条 diagnostic 的决策独立可并行

## 输出
```jsonc
{
  "decisions": [
    {
      "id": "dec_001",
      "action": "pause",
      "target": "campaign_001",
      "target_type": "campaign",
      "rationale": "Campaign exceeded 3x AOV in spend with 0 purchases; further spend not justified without changes",
      "expected_impact": "Stop loss; redirect $50/day budget to top performer campaign_002",
      "diagnostic_ids": ["diag_001"]
    },
    {
      "id": "dec_002",
      "action": "swap_creative",
      "target": "pairing_002",
      "target_type": "creative_pairing",
      "rationale": "Creative fatigue indicated by CTR halving over 5 days at frequency 6.2",
      "expected_impact": "CTR recovery to 1.5% baseline within 3 days",
      "diagnostic_ids": ["diag_002"]
    }
  ]
}
```

## 校验
- ≥ 1 decision
- 每 id `^dec_[0-9]{3}$`
- 每 decision.diagnostic_ids[] ≥ 1
- target ID 必须在 08 (campaign / paud / pairing) 或 05 (route) 中找到
