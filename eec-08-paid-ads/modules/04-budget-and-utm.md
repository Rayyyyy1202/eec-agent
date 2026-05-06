# Module 04 — Budget Plan + UTM

## A. Budget Plan

### 步骤
1. `total_test_budget` (Money)：来自 $ARGUMENTS
2. `allocation_by_platform[]`：默认 Meta 50% / TikTok 30% / Google 20%（可按品类调）
   - 加总必须 = 100
3. `kill_threshold`：标准 "spend > 3x AOV with 0 purchases" 或 "CTR < 0.5% after 2 days"
4. `scaling_rule`：标准 "ROAS > 2 for 3 consecutive days → +20% daily budget"

### 输出
```jsonc
{
  "budget_plan": {
    "total_test_budget": { "amount": 1000, "currency": "USD" },
    "allocation_by_platform": [
      { "platform": "meta", "pct": 50 },
      { "platform": "tiktok", "pct": 30 },
      { "platform": "google", "pct": 20 }
    ],
    "kill_threshold": "spend > 3x AOV with 0 purchases",
    "scaling_rule": "ROAS > 2 for 3 consecutive days → +20% daily budget"
  }
}
```

## B. UTM Taxonomy Applied

### 必须遵循 06.utm_taxonomy
- 读 06 的 source_format / medium_format / campaign_format
- 对每条 campaign：生 UTM 模板
- campaign_format 例：`{objective}_{audience}_{date:YYMMDD}` → `sales_lookalike1pct_260315`

### 步骤
1. 对每条 campaign 生一组 UTM example
2. 给到 utm_templates.md（人类速查）

### 输出
```jsonc
{
  "utm_taxonomy_applied": {
    "examples": [
      {
        "campaign_id": "campaign_001",
        "utm_source": "meta",
        "utm_medium": "cpc",
        "utm_campaign": "sales_lookalike1pct_260315",
        "utm_content": "pairing001_1x1",
        "utm_term": ""
      }
    ]
  }
}
```

## 校验
- allocation_by_platform pct 加总 = 100
- 每 utm_campaign 命中 06.utm_taxonomy.campaign_format pattern
- kill_threshold + scaling_rule 非空
