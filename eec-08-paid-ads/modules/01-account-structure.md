# Module 01 — Account Structure

## 目标
每平台一棵 campaign 树：campaign → ad_set (audience) → ad (creative_pairing)。

## 默认结构（per platform）
| Platform | 推荐起步结构 |
|---|---|
| meta | 1 prospecting (lookalike + interest broad) + 1 retargeting (engaged_users) |
| tiktok | 1 broad creative-led (Smart+) + 1 retargeting |
| google | 1 PMax (catalog + signals) + 1 search brand-defense |
| youtube | 1 video views (TOFU) |
| pinterest | 1 catalog conversion |

## 步骤
1. 对每个目标 platform：
   - 决定 campaign 个数（MVP 每平台 ≤ 3）
   - 给每个 campaign：
     - id `campaign_NNN`
     - name 命名 `<platform>_<objective>_<funnel>_<lang>` 例 `meta_sales_prospect_en`
     - objective ∈ schema enum
     - daily_budget Money（按 budget_plan.allocation_by_platform 分摊）
     - audience_ids[≥1] (来自 Module 02)
     - creative_pairing_ids[≥1] (来自 Module 03)
     - landing_route ∈ 05.routes[].path
     - optimization_event ∈ 06.events_spec[].name (例 `purchase` / `add_to_cart`)
     - bidding_strategy: 默认 `lowest_cost` / `target_cpa`

## 并行
- 每平台的 campaign 设计独立可并行

## 输出
```jsonc
{
  "account_structure": [
    {
      "platform": "meta",
      "account_id_placeholder": "act_TBD",
      "campaigns": [
        {
          "id": "campaign_001",
          "name": "meta_sales_prospect_en",
          "objective": "sales",
          "daily_budget": { "amount": 30, "currency": "USD" },
          "audience_ids": ["paud_001", "paud_002"],
          "creative_pairing_ids": ["pairing_001", "pairing_002", "pairing_003"],
          "landing_route": "/products/steel-travel-mug",
          "bidding_strategy": "lowest_cost",
          "optimization_event": "purchase"
        }
      ]
    }
  ]
}
```

## 校验
- 至少 1 platform
- 每 campaign id `^campaign_[0-9]{3}$`
- landing_route ∈ 05.routes[].path（若 05 存在）
- optimization_event ∈ 06.events_spec[].name
- audience_ids/creative_pairing_ids 全部 ref 真实
