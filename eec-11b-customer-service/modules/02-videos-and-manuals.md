# Module 2: Videos + Manuals

## video_tutorials 拓扑

每个产品至少需要 3 个角度：

| topic | 必有 | 时长目标 |
|---|---|---|
| setup | yes | 60-180s |
| troubleshooting | yes (覆盖 #1 FAQ) | 60-120s |
| maintenance | yes | 30-90s |
| feature_walkthrough | optional | 60-180s |

### youtube_id

- 必须是真实可访问 ID (11 字符 base64-style: `[A-Za-z0-9_-]{11}`)
- MVP 允许占位 (例如 `dQw4w9WgXcQ` — Rick Astley，故意可识别为占位) 但 report.md 必须显眼标记
- transcript_summary ≤ 600 字 — 用于 caption / SEO

## manuals (per SKU)

### pdf_url 路径约定

- MVP 占位: `/manuals/<sku_id>.pdf` (相对 public/, 文件可后置)
- 真文件存在: 同上，public/manuals/<sku_id>.pdf 实际放进去
- 外链: 完整 https URL (e.g., S3 / Dropbox)

### 多语言

- MVP 至少 1 份 en
- 其他语言：每份独立 entry (sku_id + language 唯一组合)

### 字段建议

```jsonc
{
  "sku_id": "sku_001",
  "pdf_url": "/manuals/sku_001-en.pdf",
  "language": "en",
  "version": "v1.2",
  "file_size_kb": 4200,
  "page_count": 32
}
```

`file_size_kb` 用于 download 显示 ("4.2 MB PDF"); `page_count` 给读者预期。

## 写出 manual_briefs (可选)

如果 PDF 还不存在，可在 `eec/11b-customer-service/manual_briefs/<sku>.md` 写大纲，供后续印刷流程用：

```md
# <SKU name> Manual

## TOC
1. Safety (battery / charging / Prop 65)
2. Quick start
3. Pairing
4. Daily operation
5. Cleaning + maintenance
6. Troubleshooting (cross-link to videos)
7. Warranty card
8. Contact + replacement parts

## Critical safety items
- Do NOT submerge dock
- Do NOT use after liquid spill until 24h dry
- Battery disposal — call <local hazardous waste line>
```

## 输出

```jsonc
"video_tutorials": [
  { "id": "video_001", "title": "Roborock setup in 90 seconds", "youtube_id": "<11ch>", "duration_seconds": 90, "topic": "setup", "related_sku_ids": ["sku_001", "sku_002"], "transcript_summary": "..." }
],
"manuals": [
  { "sku_id": "sku_001", "pdf_url": "/manuals/sku_001-en.pdf", "language": "en", "version": "v1.2", "file_size_kb": 4200, "page_count": 32 }
]
```
