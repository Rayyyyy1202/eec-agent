# Module 04 — Keyword Opportunities (喂给 07b)

## 目标
基于已有 ranking + 01 niche + 竞品 SERP gap 挖关键词机会，给 07b 内容营销做 cluster 起点。

## 数据源
1. **Google Search Console**（免费，需站点已 verify）—— 已有 query × impression × click × position
2. **Google Trends related queries**（rising 那栏）
3. **Bing Webmaster Tools** —— 类似 GSC
4. **AnswerThePublic** —— 5W1H 长尾
5. **Competitor SERP scraping**（01.competitors[].url 的 ranking 词）

## 步骤
1. **从 GSC 拉**（若可访问）：position 5-20 的词 → 提升机会
2. **从 01 niche.primary_keyword + 长尾词扩**
3. **从 07a Module 01 抓的 competitor pages title** 反推关键词
4. **去重 + intent 分类** (informational / commercial / transactional / navigational)
5. **难度估**（粗）：
   - low：long_tail (≥4 词) + 0 强对手
   - medium：mid_tail + 中等对手
   - high：head term + 头部对手强
6. **建议落地路由** suggested_target_route：
   - informational → /blog/[slug]
   - commercial → /collections/[slug] OR /products/[slug]
   - transactional → /products/[slug]

## 并行
- 不同 source 的拉取并行
- intent 分类并行（per keyword 独立判断）

## 输出
```jsonc
{
  "keyword_opportunities": [
    {
      "keyword": "best steel travel mug for hiking",
      "intent": "commercial",
      "current_rank": 0,
      "difficulty": "low",
      "monthly_volume_estimate": 480,
      "suggested_target_route": "/blog/best-travel-mug-hiking"
    }
  ]
}
```

## 校验
- 至少 5 条机会
- 每条 intent 必填
- suggested_target_route 若有 → 必须 ∈ 05.routes[].path 或为新路由（07b 会决定）
