# Module 1.5: existing 素材摄入

> 仅在 `$ARGUMENTS` 含 `--existing-manifest=<path>` 或 `--existing-dir=<path>` 时执行。模式 A 跳过此模块。

## 目的

把用户已经上传的素材（成品图/视频）登记进 `assets[]`，标 `source: "user_uploaded"`。后续 Module 2/3/4 只补缺口格子，**不重复生成**已被用户覆盖的 (sku_id × purpose × channel × lang) 组合。

## 模式 B：--existing-manifest

### 输入
用户传 JSON 路径，shape 见 SKILL.md 顶部"existing-manifest 文件 shape"。

### 步骤
1. `read_file <path>` → 解析 JSON
2. 校验顶层是 `{ "items": [...] }`，否则 STOP（提示用户改 shape）
3. 对 `items[]` 每条逐项校验：
   - `file_path` 物理存在（用 `read_file` 探一下，404 即记入失败列表）
   - `type` ∈ schema enum（image/video/copy/hook/audio）
   - `purpose` ∈ schema enum
   - `channel` ∈ schema enum
   - `language` ∈ `_common#/$defs/LanguageCode`
   - `sku_id`（若有）∈ `02.skus[].id`
   - `audience_ids[]`（若有）∈ `01.audience_profiles[].id`
4. 任一失败 → 暂停展示**全部**问题（不要一个个 ping），让用户一次性修 manifest
5. 全过 → 为每条生成 `asset_NNN` id（接续主流程的序号），写入 `assets[]`，置：
   - `source: "user_uploaded"`
   - `auto_tagged: false`
   - `status: "approved"`（用户既然标注了就视作已批）
   - `delivered_file_path`: 把 `file_path` 转换成 `/<rel>` 形式（必须以 `/` 开头，对应 `public/` 下的路径）；如果用户上传到 `eec/04-creative-factory/uploads/` 之外，先 copy 到 `public/og/<asset_id>.<ext>` 再写 `delivered_file_path: /og/<asset_id>.<ext>`
   - `width` / `height`：用 `run_shell` 调 `identify -format "%w %h" <file>`（imagemagick）或 `ffprobe`（视频）补齐；调不出就让用户手填后重跑

### 输出（模式 B）
```
✓ existing manifest 摄入完成
  - 登记 <N> 条 user_uploaded 素材
  - 文件已 copy 到 public/og/: <count>
  - 已覆盖矩阵格子: hero_web_en×1, social_tiktok_en×2, ...
  - 仍缺口: ad_meta_en, product_web_zh, ... (Module 2/3/4 将补)
```

## 模式 C：--existing-dir

### 输入
用户传目录路径，目录里只有原始文件，没 manifest。

### 步骤
1. `list_dir <path>` 拿全部文件
2. 按扩展名过滤可识别媒体：`.jpg .jpeg .png .webp .avif .svg .mp4 .webm .mov`；其他文件单独列出告诉用户已跳过
3. 对每个文件提取信号：
   - filename（拆 token：`hero_desk_setup_001.jpg` → ["hero", "desk", "setup", "001"]）
   - 扩展名（决定 `type`：图 → image、视频 → video）
   - 文件大小、修改时间（modified_at → 用作 `uploaded_at`）
   - 若有 EXIF（视频也有 metadata），用 `run_shell` 跑 `exiftool` 拿尺寸 + GPS（若有可推测 lifestyle/studio 区别，但不强求）
4. **逐文件 LLM 推断**：对每个文件让 LLM 结合上面信号 + `02.skus[]` + `03.tone` + `01.audience_profiles[]`，提议：
   - `type`（已可推）
   - `purpose`（基于 filename 关键词：含 "hero" / "banner" → hero；"unbox" / "review" → social/ugc；"ad" → ad；"product" / "sku" → product；"life" / "scene" → lifestyle；都不像 → 让 LLM 选最合理的，标低置信度）
   - `channel`（filename 含 "tiktok" / "tk" → tiktok；"meta" / "fb" / "ig" → meta；"google" / "ga" → google；默认 web）
   - `language`（filename 含 zh/en/jp/... → 对应；默认 01.niche.language）
   - `sku_id`（按 filename 含 SKU name 的关键词匹配 02.skus[].name；无匹配 → null = brand-level）
   - `audience_ids[]`（按 sku_id → 02.skus[sku_id].target_audience_ids[]；无 sku_id → 选 01 里覆盖度最广的 1 个 audience，标低置信度）
   - `alt_text`（LLM 基于 filename + 推断的 purpose/sku 写一句中性描述）
5. 把全部提议汇成 markdown 表格，**一次性**展示给用户（最多分批，每批 ≤30 行），让用户回 Y / edit:N field=value / skip:N / n（见 SKILL.md Step 1 模式 C 入口）
6. 接受/编辑后 → 写入 `assets[]`，置：
   - `source: "user_uploaded"`
   - `auto_tagged: true`（关键：让下游和审核者知道还没人 100% 复核）
   - `status: "approved"`
   - 其他字段同模式 B

### LLM 提议时的"硬保守原则"
- 关键词不匹配时**优先 brand-level**（不绑 sku_id），别瞎绑
- audience 不确定时**留空**而不是猜
- purpose 不确定时**默认 lifestyle**（最低风险 fallback）
- 任何字段都给 0-1 的 `confidence`（在表格的最右一列），用户看了好快速判定哪行要改

### 输出（模式 C）
```
✓ existing dir AI 标注完成
  - 扫描 <N> 个文件 (跳过 <K> 个不识别格式)
  - LLM 提议 <M> 条素材
  - 用户接受: <accept_count>   编辑: <edit_count>   跳过: <skip_count>
  - 已登记 <final_count> 条 user_uploaded 素材 (auto_tagged=true)
  - 已覆盖矩阵格子: ...
  - 仍缺口: ... (Module 2/3/4 将补)
```

## 边界 / 失败模式

1. **路径不存在** → STOP，提示用户检查 path（不要静默走 mode A）
2. **dir 是空的** → 提示"目录里没文件，是否改用 --existing-manifest 或不传任何 --existing-* 走全 AI 生成?"
3. **manifest items[] 是空的** → 同上
4. **文件大小 = 0 bytes** → 当作不存在，记入失败列表
5. **同一 file_path 被登记两次** → 合并为一条，警告
6. **(模式 C) LLM 提议 sku_id 但 02 不存在该 sku** → 改成 null + brand-level
7. **(模式 C) 全部文件 confidence < 0.4** → 走完表格但额外提示"AI 信心普遍偏低，强烈建议改用模式 B 手动标注"
