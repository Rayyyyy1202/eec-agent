# Module 05 — Applied Changes

## 目标
真改 OR dry-run；before/after 必填；理想情况调 08 平台 API 真改。

## 步骤
### A. 真改路径（destructive — 必须用户确认）
- Meta：Marketing API `POST /act_<id>/campaigns` (status='PAUSED' 等)
- Google Ads：MutateOperations
- TikTok：Marketing API
- Shopify / Stripe：通常只读，不改

### B. SKILL.md 交互点 3
- 如果用户没显式同意"真改" → 默认 dry-run
- dry-run：before/after 都填，但只输出建议人工应用
- 真改：API call 成功后再写 applied_changes[].applied_at

### C. before / after 结构
- 必须是 object，不能 null
- 至少包含 status / daily_budget / 关键变更字段
- 例 pause：
  - before: { status: "ACTIVE", daily_budget: 50 }
  - after: { status: "PAUSED", daily_budget: 50 }
- 例 swap_creative：
  - before: { creative_pairing_ids: ["pairing_002"] }
  - after: { creative_pairing_ids: ["pairing_005"] }

## 并行
- 不同 platform 的 API call 并行（受限于各自 rate limit）

## 输出
```jsonc
{
  "applied_changes": [
    {
      "decision_id": "dec_001",
      "applied_at": "2026-04-21T10:15:00Z",
      "before": { "status": "ACTIVE", "daily_budget": { "amount": 30, "currency": "USD" } },
      "after": { "status": "PAUSED", "daily_budget": { "amount": 30, "currency": "USD" } }
    },
    {
      "decision_id": "dec_002",
      "applied_at": "2026-04-21T10:18:00Z",
      "before": { "creative_pairing_ids": ["pairing_002"] },
      "after": { "creative_pairing_ids": ["pairing_005"] }
    }
  ]
}
```

## 校验
- 每 decision_id ∈ Module 04 decisions[]
- before / after 都是 object（不允许 null/string）
- applied_at 是 ISO datetime
- dry-run 模式下 applied_at 仍填（标 dry-run 在 report 里说明）
