# Module 03 — Drafts & Outlines

## 目标
对前 N 条 content (默认 N=5)，出 outline + body_md 落盘。

## 步骤
### A. Outline 模板
按 H1-H4 层级：
- H1：page title (含主关键词)
- H2：3-6 个章节（覆盖长尾 + 用户高频问题）
- H3：每章 1-3 子节
- H4：可选

### B. 写作约束
- 套 03.tone.do_phrases / dont_phrases（ref `editorial_voice_ref`，不复制）
- 每段 ≤ 5 行
- 至少 1 个内链（向其他 content 或 05.routes[].path）—— 前 5 条草稿至少 2 个内链
- 至少 1 个 cta（指向 cta_sku_id 的 product 页）

### C. body_md 落盘
- 路径：`./eec/07b-content-marketing/drafts/<content_id>.md`
- frontmatter：
  ```yaml
  ---
  id: content_001
  title: "..."
  target_keyword: "..."
  cluster_id: cluster_001
  language: en
  status: drafted
  ---
  ```
- 正文 markdown

### D. 估读时长
- words / 200 = minutes（向上取整）

## 并行
- 不同 content 的 outline 并行
- body_md 落盘并行

## 输出
```jsonc
{
  "drafts": [
    {
      "id": "draft_001",
      "content_id": "content_001",
      "title": "How to Clean Your Steel Travel Mug (Without Ruining the Insulation)",
      "outline": [
        { "h": 1, "text": "How to Clean Your Steel Travel Mug" },
        { "h": 2, "text": "Why hand-washing matters for vacuum mugs" },
        { "h": 2, "text": "Step-by-step: daily clean" },
        { "h": 3, "text": "What you need" },
        { "h": 3, "text": "The 4-step routine" },
        { "h": 2, "text": "Removing stubborn coffee stains" },
        { "h": 2, "text": "When to replace your mug" }
      ],
      "body_md_path": "./eec/07b-content-marketing/drafts/content_001.md",
      "target_keyword": "how to clean steel travel mug",
      "secondary_keywords": ["remove coffee stains steel mug", "best way to clean insulated bottle"],
      "internal_links": ["/products/steel-travel-mug", "content_004"],
      "cta_sku_id": "sku_001",
      "language": "en",
      "estimated_reading_time_min": 5
    }
  ]
}
```

## 校验
- 每个 draft.content_id ∈ content_calendar[]
- 每个 draft.cta_sku_id (若有) ∈ 02.skus[]
- 前 5 条 internal_links ≥ 2
- body_md_path 物理存在
