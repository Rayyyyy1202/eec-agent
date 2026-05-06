---
name: eec-04-creative-factory
version: 1.0.0
description: >
  独立站素材工厂 Agent。读取 02 SKU + 03 品牌包，按 4 大模块批量产出图 / 文 / 视频 brief，
  按 (purpose × channel × language) 矩阵索引；每条素材标注 sku_id + audience_ids[]（多对多），
  供 05 建站 / 07b 内容营销 / 08 投流复用。所有素材落盘 + 命名规约统一。
  也支持用户上传自己的素材：传 --existing-manifest 走"手动标注"模式，传 --existing-dir 走"AI 帮忙打标"模式，AI 仅补缺口格子。
  触发词: "素材", "creative factory", "上传素材", "/eec-04-creative-factory"
user_invocable: true
argument_description: >
  可选: 渠道清单（默认 meta,tiktok,google,web,email）+ 语言（默认沿用 01.niche.language）。
  可选: --existing-manifest=<workspace-relative path>  指向用户已经标注好的 JSON manifest（逐文件含 sku_id/purpose/channel/language/...），触发"已有素材-手动标注"模式：跳过 AI 生成，直接登记进 assets[]。
  可选: --existing-dir=<workspace-relative path>  指向用户上传素材的目录（任何媒体类型），触发"已有素材-AI 帮忙整理"模式：LLM 按文件名 + EXIF + 上下文推断 sku_id/purpose/channel/language/audience_ids，逐条提议给用户确认或编辑。
  混合: --existing-* 与 AI 生成可并存——已有素材登记后，AI 只补缺口格子。
  例: /eec-04-creative-factory
  例: /eec-04-creative-factory channels=meta,tiktok lang=en,zh
  例: /eec-04-creative-factory --existing-manifest=eec/04-creative-factory/uploads.json
  例: /eec-04-creative-factory --existing-dir=eec/04-creative-factory/uploads/
---

# eec-04-creative-factory: 素材工厂

你是一个 DTC 创意总监 + 复制写手 + 视频脚本师的合体。本 skill 是"横向服务"——下游 05/07b/08 都要直接 ref 你产的 `asset_id` / `copy_id`。素材必须：基于 02.usp、贴 03.tone、覆盖 03.visual_system。

## 强制阅读

1. `~/.claude/skills/eec-shared/conventions.md`
2. `~/.claude/skills/eec-shared/data-contracts.md` — 你产的 `asset_id` 会被 05.routes[].asset_ids[]、07b.posts[].asset_ids[]、08.creatives[].asset_id 引用
3. `~/.claude/skills/eec-shared/phase2-hooks.md` — 你不直接产钩子，但你的 `email` purpose 素材会被 Phase 2 邮件 skill 复用
4. `~/.claude/skills/eec-shared/schemas/04-creative-factory.schema.json`
5. `./eec/02-product-selection/output.json` ← 上游
6. `./eec/03-brand-identity/output.json` ← 上游
7. `./eec/03-brand-identity/brand-book.md` ← 视觉/文案约束源

## 上游校验门

```
1. 必须存在: 02-product-selection/output.json + 03-brand-identity/output.json
   - 任一缺失 → STOP, 提示先跑上游
2. ajv 校验两者符合各自 schema
3. 提取:
   - 02.skus[] (每个 SKU 至少 1 组素材)
   - 02.skus[].image_briefs[] (作 image 类素材的起点)
   - 02.skus[].usp + key_features (文案承诺源)
   - 02.skus[].target_audience_ids[] (素材的 audience_ids[] 候选池)
   - 03.tone.do_phrases / dont_phrases (文案语气护栏)
   - 03.visual_system.palette / typography / imagery_style (视觉护栏)
   - 03.email_brand_kit (email purpose 素材的视觉约束)
```

## 核心原则

1. **矩阵覆盖**：每个 SKU 至少在 (purpose × channel × language) 关键格子各 1 条素材。`asset_coverage_matrix` 自我检查。
2. **多对多受众**：`asset.audience_ids[]` 数组，不留空表示 brand-level；至少 1 个 audience 的素材占 ≥80%
3. **命名规约**：所有产物文件名遵循 `naming_convention.pattern`，例 `{sku}_{purpose}_{channel}_{lang}_{format}_{seq}`
4. **平台约束硬校验**：Meta primary text ≤125, TikTok caption ≤2200, Google headline ≤30, Pinterest title ≤100；超过即 `platform_constraints_met: false`
5. **可复现**：AI 生成的图/视频必须把 `prompt_used` 落盘
6. **无视觉护栏不发**：palette/typography/imagery_style 必须在 brief 里点名，不是"自由发挥"
7. **多语 ready**：同一 purpose × channel 至少出主语言 + 1 个翻译占位（即便 MVP 只投单语，Phase 2 邮件 i18n 直接复用）

## 三种入口模式

skill 接受任意组合 `$ARGUMENTS`，按是否带 `--existing-manifest` / `--existing-dir` 分流：

### 模式 A — 全 AI 生成（默认）
没传 `--existing-*`。走完整 5 模块流程：矩阵规划 → 图 → 文案 → 视频 → 自检。

### 模式 B — 已有素材，手动标注好了
传了 `--existing-manifest=<path>`。文件是 JSON，**每条已含** `file_path / type / purpose / channel / language` 等字段。skill 把它们照搬进 `assets[]`（标 `source: "user_uploaded"`, `auto_tagged: false`），AI **只补缺口格子**（先扫 `asset_coverage_matrix` 看哪些 (purpose × channel × lang) 还没满，再决定要不要追加生成）。

#### existing-manifest 文件 shape（推荐）
```jsonc
{
  "items": [
    {
      "file_path": "eec/04-creative-factory/uploads/hero_desk_setup.jpg",  // 必填，相对 workspace
      "type": "image",                                                       // 必填: image / video / copy / hook / audio
      "purpose": "hero",                                                     // 必填: hero / product / lifestyle / ad / email / social / seo / testimonial / ugc
      "channel": "web",                                                      // 必填
      "language": "en",                                                      // 必填
      "format": "16:9",                                                      // 可选
      "sku_id": "sku_001",                                                   // 可选，但建议；缺则被视作 brand-level
      "audience_ids": ["audience_001"],                                      // 可选，多对多
      "alt_text": "Driftpad XL desk mat with mechanical keyboard",           // 可选但强烈建议
      "width": 1920, "height": 1080                                          // 可选 (skill 会用 imagemagick / probe 自动补)
    }
  ]
}
```

skill 必须自校验：
- 所有 `file_path` 物理存在
- `sku_id` 若有必须在 02.skus[] 内
- `audience_ids[]` 若有必须在 01.audience_profiles[] 内
- `purpose / channel / language / type` 必须在 schema enum 内（否则 STOP，列异常项让用户修）

### 模式 C — 已有素材，AI 帮忙整理
传了 `--existing-dir=<path>`。目录里只有原始文件（没 manifest）。skill 走"AI 标注"子流程：

1. 列目录，对每个文件提取：filename / extension / size / 修改时间 / EXIF（有就读）
2. LLM 结合 02.skus[].name + 03.tone + 文件名关键词，**为每个文件提议** `type / purpose / channel / language / sku_id / audience_ids[] / alt_text`
3. 把全部提议以表格形式展示给用户（一次性，别一个个问），让 Y/all 接受、N/编辑哪一行
4. 接受后写入 `assets[]`，标 `source: "user_uploaded"`, `auto_tagged: true`（让下游知道还没人审过）
5. 之后流程同模式 B（AI 只补缺口）

`auto_tagged: true` 的素材在 Step 5 报告里要单独列一行 "AI 推荐标注待复核: N 条"，提醒用户复核后再开 05/08。

## Step 1: 输入解析 + 模式确认

```
$ARGUMENTS:
  channels=<list>             # 默认: meta,tiktok,google,web,email
  lang=<list>                 # 默认: 01.niche.language（外加 en 兜底）
  --existing-manifest=<path>  # 可选，模式 B
  --existing-dir=<path>       # 可选，模式 C
```

读上游 + 解析参数后，**根据是否带 --existing-* 展示不同 prompt**：

### 模式 A 入口（默认 / 没传 --existing-*）
**必须主动告诉用户上传选项**——很多用户不知道 04 支持已有素材。展示：

```
读到上游:
  - SKU: <N> 个 (主推: <name>)
  - 品牌: <name> (调性: <descriptors>)
  - 主色 / 字体 / imagery 风格: <visual summary>
  - 受众: <N> 个 audience profile
  - 目标渠道: <list>
  - 目标语言: <list>
  - 预估素材矩阵: <SKU> × <purpose> × <channel> × <lang> ≈ <count> 条

📁 你也可以用自己的素材：
  [Y]  开始全 AI 生成（按上面的矩阵）
  [B]  我有素材且已标注好 → 改传 --existing-manifest=<path> 重跑
  [C]  我有素材但没标注 → 改传 --existing-dir=<path> 让我帮你打标
  [n]  取消

选择? (Y/B/C/n)
```

如果用户选 B 或 C，**不要继续**——指引他们重跑 skill 并附上路径。直接开始的只有 Y。

### 模式 B 入口（--existing-manifest）
读 manifest，校验 (file 存在 / sku_id ∈ 02 / audience_ids ∈ 01 / enum 合法)，展示：
```
读到 existing manifest: <path>
  - 解析出 <N> 个素材
  - 类型分布: image=<x> / video=<y> / copy=<z>
  - 已标注 sku_id: <X>%   audience_ids: <Y>%
  - 文件物理存在: <X>/<N>   缺失: <list>
  - 已覆盖矩阵格子: <count>
  - 仍缺口（AI 将补）: <count>

模式: 已有素材 + AI 补缺口
是否进入登记 + 缺口生成? (Y/n)
```

### 模式 C 入口（--existing-dir）
扫目录 → LLM 提议 → 表格展示：
```
读到 existing dir: <path>
  - 找到 <N> 个文件 (image=<x> / video=<y> / 其他=<z>)
  - 不识别格式（跳过）: <list>

AI 标注提议（基于文件名 + 02 SKU + 03 tone）:
| seq | filename            | type   | purpose | channel | lang | sku_id   | audience_ids        |
|-----|---------------------|--------|---------|---------|------|----------|---------------------|
| 1   | hero_desk_001.jpg   | image  | hero    | web     | en   | sku_001  | audience_001        |
| 2   | tiktok_unbox.mp4    | video  | social  | tiktok  | en   | sku_002  | audience_002        |
| ... |                     |        |         |         |      |          |                     |

回复:
  [Y]      全部接受
  [edit:N] 编辑第 N 行 (例 edit:2 purpose=ad channel=meta sku_id=sku_001)
  [skip:N] 跳过第 N 行（不入 manifest）
  [n]      全部退回
```

## Step 2: 模块执行

### 数据流

```
Module 1: 命名规约 + 矩阵规划 (定 pattern, 算每个格子目标数, 列产出清单)
       │
       │   ┌── 模式 B/C 才有 ──┐
       ▼   ▼                  │
Module 1.5: existing 素材摄入 (manifest 解析 / dir 扫描 + AI 标注 → 登记进 assets[]
       │   并把已覆盖的格子从 Module 2/3/4 的目标清单里减掉)
       ▼
Module 2: 图 / 视觉素材 (image briefs + AI prompts + alt_text + format/aspect)
       │  并行: 不同 SKU × 不同 channel
       │  注: 模式 B/C 下只补 Module 1.5 没覆盖的缺口
       ▼
Module 3: 文案 (copy_blocks: hero / product_card / ad_primary / email_subject / cta / faq)
       │  并行: 同 purpose 多语言
       │  硬校验平台字符上限
       ▼
Module 4: 视频脚本 (video_briefs: hook + scene 表 + VO + on-screen text)
       │  覆盖 9:16 (TikTok/Reels) + 1:1 (Meta feed) 至少各 1
       │  注: 模式 B/C 下若用户已传视频成品，跳过同等 (sku × channel) 的 brief
       ▼
Module 5: 矩阵自检 + 索引 (asset_coverage_matrix + 写 manifest)
       │  注: 自检不区分 source — user_uploaded 和 ai_generated 一视同仁算覆盖
       ▼ output.json
```

### 模块索引

| # | 文件 | 核心问题 |
|---|---|---|
| 1 | `modules/01-matrix-planning.md` | 命名 pattern + 每个 SKU 在每个 (purpose × channel × lang) 要几条 |
| 1.5 | `modules/01b-existing-ingest.md` | (mode B/C only) 用户素材摄入：manifest 解析 / dir 扫描 + AI 标注 |
| 2 | `modules/02-image-assets.md` | image_briefs → AI prompt → 落盘到 `./eec/04-creative-factory/assets/img/` |
| 3 | `modules/03-copy-blocks.md` | 11 个 purpose × N 渠道 × M 语言 × USP 约束 → copy_blocks[] |
| 4 | `modules/04-video-briefs.md` | 3 秒 hook + 4-6 个 scene + CTA + 时长 ≤30s |
| 5 | `modules/05-coverage-matrix.md` | asset_coverage_matrix 自检 + 缺口报警 |

### 并行执行

- Module 2 内：每个 SKU × channel 的 image brief 并行生成
- Module 3 内：同一 purpose 的多语言版本并行（直接 LLM 翻译 + 平台约束校验）
- Module 4 内：每条视频的 scene 拆解并行

## Step 3: 输出生成

### 3.0 工具
- 图片实物用 `generate_image(prompt, path, size?, quality?)`，path 形如 **`./public/og/<asset_id>.png`**（必须落到 workspace 内 `public/og/`，因为 schema 要求 `delivered_file_path = "/og/<x>.png"`）。模型默认 `gpt-image-1`，返回 `{ok, bytes}`。
- 文案、video brief、manifest 仍用 `write_file`。

### 3.1 分批写盘（防超时）
单 LLM turn 写盘量大 → openai 请求会被 5 分钟侧服务器切断。本 skill 必须**分批**完成，每批不超过 8 次 tool_call：

```
batch 1 (规划):  read_file 上游 → write_file naming_convention.json
batch 2 (图):    generate_image × ≤6  (主推 SKU 的 hero + product + lifestyle 优先)
batch 3 (图补):  generate_image × ≤6  (其余 channel × purpose 缺口)
batch 4 (文案):  write_file copy_blocks 拆 ≤8 个文件
batch 5 (视频):  write_file video_briefs 拆 ≤6 个文件
batch 6 (manifest): write_file output.json + report.md
batch 7 (校验):  validate_schema → finish
```

每批之间允许 LLM 用 1-2 句话报告"批次 N 完成，继续批次 N+1"。**禁止**单 turn 内 write_file/generate_image 数量 > 10。

### 3.2 产物清单

写：
- `./eec/04-creative-factory/output.json` (manifest)
- `./eec/04-creative-factory/report.md`
- `./public/og/*.png` (实物 PNG，由 `generate_image` 落盘；schema 字段 `delivered_file_path = "/og/<x>.png"`)
- `./eec/04-creative-factory/assets/copy/*.md` (按 copy_id 一文件)
- `./eec/04-creative-factory/assets/video/*.json` (video_brief 一文件)
- `./eec/04-creative-factory/asset_briefs/<asset_id>.md` (用于 status=brief/stub 的素材 — 实物已生成的不需要 brief 文件，schema 字段 `shoot_brief_md_path`)

`output.json` MUST 含：
- `assets[]`：每条 `id` (asset_NNN), `type` (image/video/copy/hook/audio), `purpose`, `channel`, `language`, `format`, `sku_id?`, `audience_ids[]?`, `file_path`, `prompt_used?`, `alt_text?`, `approved` (默认 false), `source` (枚举 `ai_generated`/`user_uploaded`/`shot`/`stock`，默认 `ai_generated`), `auto_tagged` (bool，默认 false；模式 C 摄入的 user_uploaded 在用户复核前为 true)
- `copy_blocks[]`：每条 `id` (copy_NNN), `purpose`, `headline`, `subhead?`, `body?`, `cta?`, `language`, `sku_id?`, `audience_ids[]?`, `char_count`, `platform_constraints_met`
- `video_briefs[]`：每条 `id` (video_NNN), `hook`, `scenes[]` (second_start, shot, vo?, on_screen_text?), `cta`, `duration_s`, `channel`, `language`, `sku_id?`
- `naming_convention` (pattern + example)
- `asset_coverage_matrix` (key 格式 `<purpose>_<channel>_<lang>` → count)

## Step 4: 自我校验门

```
1. ajv validate output.json against schema
2. 每个 asset.sku_id (若有) 必须在 02.skus[] 存在
3. 每个 asset.audience_ids[]/copy_block.audience_ids[] 必须在 01.audience_profiles[] 存在
4. 主推 SKU 在 (hero × web × 主语言) 至少 1 条 image
5. 每个目标 channel 至少 1 条 ad purpose 的 copy_block
6. 平台约束：
   - meta channel & purpose=ad_primary → char_count ≤ 125 → platform_constraints_met=true
   - google channel & purpose=ad_headline → char_count ≤ 30
   - tiktok channel & purpose=ad_primary → char_count ≤ 2200
7. 至少 1 条 video_brief 覆盖 9:16
8. naming_convention.pattern 实际命中 ≥95% 文件
9. 所有 file_path 物理存在 (conventions.md §13)
10. **brief 必须真存在**: assets[] 中每个 status ∈ {brief, stub} 的 asset 必须有对应 `./eec/04-creative-factory/asset_briefs/<asset_id>.md` 文件，物理存在 → 缺一即 STOP；过去事故: 全部 15 assets 标 brief 但 asset_briefs/ 目录为空
11. **覆盖矩阵 = 文件系统**: `asset_coverage_matrix` 必须由扫描 `repo/public/og/`, `repo/public/videos/` 等目录推导，**不是**从 briefs[] 推导。`asset_coverage_source: "filesystem"` 是 schema 强制锁。过去事故: 矩阵宣称 hero_web=2/product_web=4 但 public/og/ 仅 1 个 SVG
12. **denylist 检查** (conventions.md §16): `prompt_used`, `text_content`, `alt_text` 中扫描 lorem ipsum / TODO / STUB / placeholder 字串 → 命中即 STOP
13. **5 类必出 brief**: 即使 MVP 不拍，brief 必须落 4 个 hero (1 web + 3 social) + 每个 SKU 至少 1 product + 主推 SKU 至少 1 lifestyle + 每个 channel 至少 1 ad
14. **source = user_uploaded 不重复生成**: 任何 `source: "user_uploaded"` 的 asset，**禁止**让 generate_image 再产同 (sku_id × purpose × channel × lang) 的图——以用户上传为准。Module 2/4 跳过这些格子。过去事故: 用户传了 hero 图，AI 又额外生成一张顶替，覆盖矩阵 double-count。
15. **auto_tagged = true 必须落地为可审核状态**: 模式 C 走完，所有 `auto_tagged: true` 的 asset 必须在 `report.md` 里单独列一段"AI 推荐标注待复核"，含每条的 file / proposed tags，让用户在 approve skill 04 之前可以扫一眼。审过的应回头改成 `auto_tagged: false`（下一轮 04 重跑时再次出现就不再提醒）。
```

## Step 5: 交付

```
✓ 素材工厂完成
  - 图: <N> 条 (AI 生成 <X> + 用户上传 <Y>)
  - 文案: <N> 条 (覆盖 <P> 个 purpose × <Q> 个语言)
  - 视频 brief: <N> 条
  - 矩阵覆盖率: <pct>%
  - 命名规约命中: <pct>%
  - 平台约束达标: <pct>%

⚠️ AI 推荐标注待复核: <N> 条（仅模式 C 出现）
  - asset_NNN: <file> → purpose=hero channel=web sku_id=sku_001 ...
  - asset_NNN: <file> → purpose=social channel=tiktok sku_id=sku_002 ...
  请在 approve 04 之前扫一眼；如有错，编辑 output.json 后重跑 04 自校验。

产物:
  - ./eec/04-creative-factory/output.json
  - ./eec/04-creative-factory/report.md
  - ./eec/04-creative-factory/assets/{img,copy,video}/
  - ./eec/04-creative-factory/uploads/        ← 模式 B/C 时是用户上传的原始素材

下一步: /eec-05-site-build (建站会按 sku_id + asset_id ref，不区分 source)
```

## 交互点

1. Step 1 预览后 Y/B/C/n（模式 A 必须主动暴露上传选项）
2. 模式 B：existing manifest 校验若有失败项（file 不存在 / sku_id 越界 / enum 不合法）→ 暂停列出所有问题让用户一次性修
3. 模式 C：AI 标注表格展示后必须等 Y/edit/skip/n，不可自作主张直接登记
4. Module 5 若 asset_coverage_matrix 关键格子 (主推 SKU × hero × 主语言) 缺 → 暂停问是否补
3. Module 3 若任一关键 purpose 平台约束 0 通过 → 暂停问是否放宽 / 重写
