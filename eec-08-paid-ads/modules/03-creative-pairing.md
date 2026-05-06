# Module 03 — Creative Pairing

## 目标
asset_ids[] × copy_block_id × audience_id → pairing_NNN。每对都能在 04 trace。

## 步骤
1. 为每个 audience（Module 02）：
   - 选 1-3 组 asset (来自 04.assets[]) — 优先匹配 audience_ids[] 重叠的
   - 选 1 个 copy_block (来自 04.copy_blocks[]) — purpose=ad_primary 或 ad_headline
2. 用 hook 字段写 3 秒钩子（可来自 04.video_briefs[].hook）
3. format 标 (1:1 / 9:16 / 16:9)

## 配对反模式（避免）
- 同一 asset_id 配 ≥3 个 audience 同时 → 重复内卷
- audience 与 asset.audience_ids 完全无交集 → 通常表现差
- copy 与 asset 语境冲突（高端 lifestyle 图配 "limited time discount" copy）

## 配对矩阵（推荐 minimum）
- 每个 prospecting audience：≥3 pairing（A/B/C）
- 每个 retargeting audience：≥2 pairing
- 每个 prospecting：跨 ≥2 format（1:1 + 9:16）

## 并行
- 每平台 / 每 audience 的 pairing 设计并行

## 输出
```jsonc
{
  "creative_pairing": [
    {
      "id": "pairing_001",
      "asset_ids": ["asset_001", "asset_002"],
      "copy_block_id": "copy_001",
      "audience_id": "paud_001",
      "hook": "Tired of cold coffee by 9am?",
      "format": "1:1"
    }
  ]
}
```

## 校验
- ≥ 1 pairing
- 每 pairing id `^pairing_[0-9]{3}$`
- asset_ids[≥1] 全 ∈ 04.assets[]
- copy_block_id ∈ 04.copy_blocks[]
- audience_id ∈ Module 02 audiences[].id
