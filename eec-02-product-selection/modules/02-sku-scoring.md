# Module 02 — SKU Scoring

## 目标
按 4 维评分筛 top N（用户 $ARGUMENTS 指定，默认 3-5）。

## 评分维度（每维 0-10）
| 维度 | 权重 | 怎么算 |
|---|---|---|
| 痛点匹配度 | 0.30 | 引用 ≥ 2 pain (frequency=very_common) → 10；引用 1 → 6；推理 → 3 |
| 竞争烈度 | 0.20 | 头部已有 ≥ 5 家强对手 → 3；2-4 → 6；空白 → 10 |
| 毛利空间 | 0.30 | margin ≥ 60% → 10；50-60 → 8；30-50 → 5；<30 → 直接 0 |
| 履约难度 | 0.20 | 可空运 + lead_time ≤ 14d → 10；海运 / lead > 30d → 4 |

## 步骤
1. 对每个 Module 01 候选打 4 个分数 + 加权 total
2. 排序，取 top N
3. 若 top N 平均 margin_pct < 50% → 暂停问用户（SKILL.md 交互点 2）

## 输出（中间）
```jsonc
[
  { "candidate_id": "...", "scores": {...}, "weighted_total": 8.2, "ranked": 1 }
]
```

## 并行
- 4 维度评分独立 → 可并行

## 校验
- 至少 1 个候选 weighted_total ≥ 6（否则品类不可做，退回 01）
