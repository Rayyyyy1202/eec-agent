# Module 02 — Data Pull

## 目标
按 period × dimension × metrics 拉每个 source，落到 metrics_by_dim[]。

## 维度（schema enum）
- campaign / audience / creative / product / landing_route / device / geo / hour / day_of_week

## 步骤
### A. Period
- 默认：past 7 days (period_end = yesterday, period_start = end - 7)
- $ARGUMENTS 可覆盖
- < 7 天 → 警告（统计不显著）

### B. 拉取
- 对每个 status="ok" 的 data_source 平行调 API
- 每个维度 × 每个时段 一次 query
- rate limit 命中 → 退避（指数回避）+ 标 status="rate_limited" + 不重试死循环

### C. 失败模式
| 平台错误 | status | 处理 |
|---|---|---|
| 401/403 | auth_error | 报告 + 提示 refresh token |
| 429 | rate_limited | 等冷却 / 跳到下次 |
| 5xx | endpoint_error | 重试 1 次 → 仍失败标 fail |
| 缺 env | missing_env_vars | Module 01 已检 |
| 数据延迟 | stale | 注明 (Meta attribution window 等) |

### D. 汇总
- metrics_by_dim[]：每条 dimension 一项 → rows[] (key = campaign_id 等, metrics)
- spend / cpa / revenue 都是 Money（per-SKU currency 沿用）
- 落 raw response 到 `./eec/09-optimization/raw_data/<source>__<period>.json` (audit 用)

## 并行
- 每 source × 每 dimension 的 query 并行
- 但单 source 内顺序（避免触 rate limit）

## 输出
```jsonc
{
  "data_pull": {
    "period_start": "2026-04-14",
    "period_end": "2026-04-20",
    "source_data_source_ids": [0, 1, 2],
    "metrics_by_dim": [
      {
        "dimension": "campaign",
        "rows": [
          {
            "key": "campaign_001",
            "impressions": 102341,
            "clicks": 1842,
            "spend": { "amount": 412.50, "currency": "USD" },
            "ctr": 0.018,
            "cvr": 0.022,
            "cpa": { "amount": 10.20, "currency": "USD" },
            "roas": 2.4,
            "purchases": 41,
            "revenue": { "amount": 990.00, "currency": "USD" }
          }
        ]
      }
    ]
  }
}
```

## 校验
- period_end >= period_start
- metrics_by_dim ≥ 1
- 每 source 至少试拉过一次（即使 status != ok）
- 至少 1 source status=ok（否则 SKILL.md Step 4 校验 9 STOP）
