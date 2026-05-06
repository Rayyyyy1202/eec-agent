# Module 02 — Image Assets

## 目标
按 Module 01 矩阵生 image briefs → AI prompts → 落盘到 `./eec/04-creative-factory/assets/img/`。

## 输入
- Module 01 的 planned_matrix
- 02.skus[].image_briefs[]（起点）
- 03.visual_system（palette / typography / imagery_style）

## 步骤
### A. Brief 起草
对每个目标格子（SKU × purpose × channel × lang）：
1. 抽 02.image_briefs 起点（角度 / 主体）
2. 叠 03.imagery_style.mood + lighting
3. 叠 channel 限制：
   - meta feed → 1:1 或 4:5
   - meta story / reels → 9:16
   - tiktok → 9:16
   - pinterest → 2:3
   - google ads → 1:1 + 1.91:1
   - web hero → 16:9
   - email header → 1.91:1
4. 叠 03.palette 主色调要求

### B. AI prompt 生成
模板：
```
[mood], [subject + scene], [composition], [lighting], 
brand palette: [hex list], style: [imagery_style.mood], 
no text, --ar [format] --v 6
```
- 落 `prompt_used` 字段保留可复现性

### C. 落盘
- 文件名严格遵循 Module 01 的 pattern
- 默认输出格式: `.png`（gpt-image-1 输出）
- 每条素材 alt_text 同步生成（≤120 字符，含主体 + SKU 关键词）

### D. 实物生成（默认）
默认调用执行器 `generate_image` 工具，将 PNG 落到 **`./public/og/<asset_id>.png`**（注意：必须落到 workspace 内的 `public/og/` 下，因为 schema 要求 `delivered_file_path` 形如 `/og/<x>.png`，由 05 站点的 `/public/` 直接服务）：

```
generate_image({
  prompt: "<完整 AI prompt，含 mood + subject + composition + lighting + palette>",
  path: "./public/og/asset_001.png",
  size: "1024x1024" | "1024x1536" | "1536x1024",
  quality: "low" | "medium" | "high"   // 默认 medium
})
```

成功后该 asset 必须填以下 schema 字段（status ∈ {shot, retouched, approved} 时硬要求）：
- `status: "shot"`（generate_image 视为 final-quality render）
- `delivered_file_path: "/og/<asset_id>.png"`（绝对、`/`-起头，与文件物理位置去掉 `public` 前缀对应）
- `width`: 像素宽（按下表）
- `height`: 像素高
- `prompt_used`：完整 prompt 字符串

尺寸映射：
| 矩阵 format | size 参数 | width / height |
|---|---|---|
| 1:1 / 4:5 / 1.91:1 | `1024x1024` | 1024 / 1024 |
| 9:16 / 2:3 | `1024x1536` | 1024 / 1536 |
| 16:9 / 1.91:1 hero | `1536x1024` | 1536 / 1024 |

注意：每批 image 调用 ≤6 个，避免 LLM 单 turn 写太多。完成一批就回报"批次 N 完成"再继续下一批，参考 SKILL.md §3.1。

### E. Brief fallback（仅当 generate_image 报错）
若 `generate_image` 返回 `ok=false`（账户配额 / 内容策略 / 网络），或 MVP 故意先不生：
- 写 brief 文件到 `./eec/04-creative-factory/asset_briefs/<asset_id>.md`
- 该 asset 必须填（status ∈ {brief, stub} 时硬要求）：
  - `status: "brief"` 或 `"stub"`
  - `shoot_brief_md_path: "./eec/04-creative-factory/asset_briefs/<asset_id>.md"`（相对 workspace 根，文件必须物理存在）
  - **不要**填 `delivered_file_path` / `width` / `height`（schema 在 status<shot 时不要求）
- 在 report.md "未生成清单" 段列出原因

## 并行
- 每个 SKU × channel 独立可并行起 brief
- AI 调用 batch 并行（受 API rate 限制）

## 输出（写到 assets[]）
status=shot（实物已生成）：
```jsonc
{
  "id": "asset_001",
  "type": "image",
  "purpose": "hero",
  "channel": "web",
  "language": "en",
  "format": "16:9",
  "sku_id": "sku_001",
  "audience_ids": ["audience_001"],
  "status": "shot",
  "delivered_file_path": "/og/asset_001.png",  // 绝对，/ 起头，对应 ./public/og/asset_001.png
  "width": 1536,
  "height": 1024,
  "alt_text": "...",
  "prompt_used": "...",
  "approved": false
}
```

status=brief（仅 brief，未生）：
```jsonc
{
  "id": "asset_007",
  "type": "image",
  "purpose": "hero",
  "channel": "tiktok",
  "language": "en",
  "format": "9:16",
  "sku_id": "sku_001",
  "audience_ids": ["audience_001"],
  "status": "brief",
  "shoot_brief_md_path": "./eec/04-creative-factory/asset_briefs/asset_007.md",
  "alt_text": "...",
  "prompt_used": "...",
  "approved": false
}
```

## 校验
- status=shot/retouched/approved → `delivered_file_path` 物理存在于 `./public<delivered_file_path>`，且 width/height 必填
- status=brief/stub → `shoot_brief_md_path` 物理存在
- alt_text 非空
- audience_ids[] 全部 ∈ 01.audience_profiles
- format 与 channel 兼容（schema 允许枚举外，但 SKILL.md Step 4 会查）
