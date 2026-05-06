# Module 01 — Matrix Planning + Naming Convention

## 目标
1. 定 `naming_convention.pattern`（全 manifest 统一）
2. 列每个 SKU 在每个 (purpose × channel × language) 应有几条素材

## 步骤
### A. Naming
- 默认 pattern: `{sku}_{purpose}_{channel}_{lang}_{format}_{seq}`
- 例: `sku001_hero_meta_en_1x1_01.jpg`
- 给 example 字段一条真实命中

### B. 矩阵规划
1. 列 channels (默认 `meta,tiktok,google,web,email`)
2. 列 purposes 必有项：
   - `hero`(每 SKU × web × 主语言 ≥1)
   - `product`(每 SKU × web × 主语言 ≥1)
   - `ad`(每 SKU × 每个广告 channel × 主语言 ≥1)
   - `email`(主推 SKU × email × 主语言 ≥1) —— Phase 2 用
   - `social`(主推 SKU × tiktok|x|pinterest × 主语言 ≥1)
3. 列 languages：默认主语言 + en 兜底

### C. 矩阵 = SKU × purpose × channel × lang → target count
预算 logic：
- 主推 SKU：每格 2-3 条（A/B/C 测试）
- 次推 SKU：每格 1 条
- 已知不投的 channel：跳过（明确标注 N/A）

### D. 模式 B/C：扣减用户已覆盖的格子
若 Module 1.5 已经摄入 `assets[]`（`source: "user_uploaded"`）：
1. 遍历 `assets[]` 里 `source ∈ {user_uploaded, shot, stock}` 的条目
2. 对每条算 key = `<sku_id>_<purpose>_<channel>_<lang>`（与 `planned_matrix` 同 key 格式）
3. 把对应 `planned_matrix[key]` 的 target_count - 1（不能 < 0）
4. 把 target_count 减到 0 的格子从 `Module 2/3/4` 的待生成清单里移除
5. **不要**把用户上传也算进 AI 待生成数 —— 仅用于"扣减"

## 输出（中间，喂 Module 2-4）
```jsonc
{
  "naming_convention": { "pattern": "...", "example": "..." },
  "planned_matrix": {
    "sku001_hero_web_en": 1,
    "sku001_ad_meta_en": 3,
    "sku001_ad_tiktok_en": 2,
    ...
  }
}
```

## 校验
- pattern 含 ≥4 占位符
- example 实际能命中 pattern
- 主推 SKU 在主关键格子数 ≥ 1
