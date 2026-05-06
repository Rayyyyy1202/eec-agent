# Module 06 — Experiments + Next Actions

## A. Experiments

### 何时设计
- 决策不确定（A/B 优于直接拍板）
- 重大改动前要验证（landing 页面改版、定价策略变更）

### 模板
- variant_a / variant_b 互相清晰对照
- success_metric：单一指标（CVR / ROAS / CTR），不能多目标
- duration_days：≥ 7 (7 天以下统计不显著)
- minimum_sample_size：基于现有 traffic 估（用户数 → 每变体 1000+ 转化事件 ≈ 95% confidence）

### 例
```jsonc
{
  "experiments": [
    {
      "id": "exp_001",
      "hypothesis": "Adding free shipping over $50 banner on /products/* will lift CVR by 15%",
      "variant_a": "Current PDP without banner",
      "variant_b": "PDP with sticky free-shipping banner above hero",
      "success_metric": "CVR",
      "duration_days": 14,
      "status": "proposed",
      "minimum_sample_size": 4000
    }
  ]
}
```

## B. Next Actions

### 必填字段
- action：人话的下一步
- owner_role：例 "creative_team" / "engineering" / "founder" / "agency"
- due：日期 (YYYY-MM-DD)

### 模板
- 每个 critical / high decision 至少派生 1 个 next_action（或本次已 applied）
- 每个 experiment.status="proposed" 至少派生 1 个 next_action 启动它
- 推荐下次 09 跑的时间（一般 7-14 天后）

### 例
```jsonc
{
  "next_actions": [
    { "action": "Brief 04-creative-factory to swap pairing_002 → produce 3 new variants", "owner_role": "creative_team", "due": "2026-04-25" },
    { "action": "Launch experiment exp_001 (free shipping banner) via 05 deploy", "owner_role": "engineering", "due": "2026-04-23" },
    { "action": "Re-run /eec-09-optimization to evaluate exp_001 + post-pause performance", "owner_role": "growth_lead", "due": "2026-05-05" }
  ]
}
```

## 并行
- 实验设计 + next_actions 起草并行

## 校验
- 每 experiment id `^exp_[0-9]{3}$`
- 每 next_action 三字段全填
- next_actions 至少 1 条（否则交付不完整）
