# Module 05 — Coverage Matrix Self-Check

## 目标
对照 Module 01 的 planned_matrix，跑实际产出 vs 目标 → asset_coverage_matrix。

## 步骤
1. 遍历 assets[] + copy_blocks[] + video_briefs[]
2. 按 (purpose × channel × language) 聚合 count
3. 比对 planned vs actual：
   - actual ≥ planned → 标 ✓
   - actual < planned → 缺口
4. 缺口处理：
   - 关键格子缺（主推 SKU × hero × 主语言） → SKILL.md 交互点 2 暂停
   - 次要缺 → 报告 + 标 deferred

## 输出（写到 output.json）
```jsonc
{
  "asset_coverage_matrix": {
    "hero_web_en": 2,
    "ad_meta_en": 5,
    "ad_tiktok_en": 3,
    "email_email_en": 1,
    ...
  }
}
```

## report.md 矩阵渲染
```
| Purpose × Channel × Lang | Planned | Actual | Status |
|---|---|---|---|
| hero × web × en | 1 | 2 | ✓ |
| ad × meta × en | 3 | 5 | ✓ |
| email × email × en | 1 | 0 | ⚠ DEFERRED |
```

## 校验
- 关键格子（SKILL.md Step 4 校验项 4）实际 count ≥ 1
- 总素材数 ≥ planned_matrix 加总 × 0.8（≥80% 覆盖）
