# Module 02 — Content Calendar

## 目标
按 weeks × per_week 排期，每条 content_NNN 绑 cluster_id + target_keyword。

## 输入
- Module 01 的 keyword_clusters
- $ARGUMENTS: weeks (默认 8) + per_week (默认 2) + start (默认下周一)

## 内容类型组合
| Type | 频次比例 | 用途 |
|---|---|---|
| blog | 50% | informational long-form |
| comparison | 15% | commercial intent (vs / best) |
| guide | 15% | top-of-funnel + linkable asset |
| landing | 5% | targeted 关键词搜索结果页 |
| video | 5% | YouTube SEO |
| social | 5% | distribution piece |
| email_newsletter | 3% | nurture |
| ugc_repost | 2% | social proof |

## 步骤
1. 算总条数 N = weeks × per_week
2. 按比例分配 type
3. 排日期：weekly cadence (例 周二 + 周四)
4. 对每条 content_NNN：
   - 取一个 cluster_id 作为来源
   - target_keyword 取 cluster.head_keyword 或 long_tail
   - 标 owner（默认 "content_team"）
   - status=planned
   - **`route_path`**：当 content_type ∈ {blog, comparison, guide, landing, video} 必填。命名规约：
     - blog / comparison / landing → `/blog/<slug>`
     - guide → `/guides/<slug>`
     - video → `/videos/<slug>`
     - news → `/news/<slug>`
     - social / email_newsletter / ugc_repost → 不出 route_path（不是 indexable page）
   - slug 只允许 `[a-z0-9-]+`，由 title 转 (lowercase + dash + dedupe)

## 并行
- 每周内容并行起标题（独立）

## 输出
```jsonc
{
  "content_calendar": [
    {
      "id": "content_001",
      "scheduled_date": "2026-04-28",
      "content_type": "blog",
      "title": "How to Clean Your Steel Travel Mug (Without Ruining the Insulation)",
      "target_keyword": "how to clean steel travel mug",
      "cluster_id": "cluster_001",
      "owner": "content_team",
      "status": "planned",
      "route_path": "/blog/how-to-clean-steel-travel-mug"
    }
  ]
}
```

## 校验
- ≥ 1 条
- 每条 id `^content_[0-9]{3}$`
- scheduled_date 全部 ≥ today
- cluster_id (若有) ∈ keyword_clusters
- 全部 status ∈ {planned, drafted, reviewed, published}
- content_type ∈ {blog, comparison, guide, landing, video, news} → `route_path` 必填，pattern `^/(blog|guides|videos|news)/[a-z0-9-]+$`
- content_type ∈ {social, email_newsletter, ugc_repost} → 不出 route_path
