# Module 03 — Diagnostics

## 目标
对每个维度找异常 → diag_NNN (observation + hypothesis + severity)。

## 异常识别规则（粗）
| 维度 | 异常信号 | severity 候选 |
|---|---|---|
| campaign | spend ≥ 3x AOV，purchases = 0 | critical |
| campaign | CTR < 0.5% × 2 days | high |
| campaign | ROAS < 0.5 × 3 days | high |
| audience | CTR > 2x 平均 但 CVR < 0.5x | medium (虚高) |
| audience | size_band=narrow + frequency > 5 | high (受众疲劳) |
| creative | CTR < 0.3% (Meta) | medium |
| creative | hook 完播率 < 30% (TikTok) | medium |
| product | view_item 高 + add_to_cart 极低 (<1%) | high (PDP 问题) |
| landing_route | bounce > 80% | high |
| device | mobile CVR < desktop CVR × 0.3 | medium (mobile UX 问题) |
| geo | 某 geo CPA > 平均 × 3 | medium (geo 不匹配) |

## 步骤
1. 遍历 metrics_by_dim[] 各维度
2. 对每条 row 跑规则 → 命中即生 diagnostic
3. **observation 必须 factual**（数字 + 时段）
4. **hypothesis 必须可测**（"creative fatigue" 而不是 "运气差"）
5. severity 按规则表
6. related_dims：列其他可能相关维度（例 PDP 问题 → ["product", "landing_route", "device"]）

## 并行
- 6 维度的诊断并行

## 输出
```jsonc
{
  "diagnostics": [
    {
      "id": "diag_001",
      "observation": "Campaign campaign_001 spent $412.50 over 7 days with 0 purchases (3.2x AOV)",
      "hypothesis": "Creative pairing_001 + audience paud_001 misalignment; or landing /products/steel-mug PDP not converting",
      "severity": "critical",
      "related_dims": ["creative", "audience", "landing_route"]
    },
    {
      "id": "diag_002",
      "observation": "Audience paud_002 has frequency 6.2 with declining CTR (1.8% → 0.9% over 5 days)",
      "hypothesis": "Audience fatigue; need new creative refresh or audience expansion",
      "severity": "high",
      "related_dims": ["audience", "creative"]
    }
  ]
}
```

## 校验
- 每 id `^diag_[0-9]{3}$`
- observation / hypothesis 非空
- severity ∈ enum
