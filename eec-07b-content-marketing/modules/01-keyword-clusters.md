# Module 01 — Keyword Clusters

## 目标
聚合 01.pain + 02.usp + 07a.opp 成主题簇 → cluster_NNN。

## 输入池
- `01.pain_points[]` → informational/commercial intent 起点
- `01.audience_profiles[]` → cluster.audience_id 候选
- `02.skus[]` → cluster.linked_sku_ids 候选 + cta source
- `02.skus[].usp` → commercial/transactional intent 词根
- `07a.keyword_opportunities[]` (可选) → 直接补全

## 步骤
### A. 聚类规则
1. 按 head_keyword 共同祖先合并相关长尾
2. 同 search_intent 的归一簇
3. 同 audience_id 的优先聚一起
4. 头长尾比例：每簇 1 head + 5-15 long tails

### B. Search intent 分类
- `informational`: how to / what is / guide / tips
- `commercial`: best / vs / review / comparison
- `transactional`: buy / discount / order / coupon
- `navigational`: <brand> + suffix

### C. Audience 绑定
- 1 cluster → 1 audience_id（最相关的）
- 跨受众通用 → 不绑

### D. SKU 绑定
- linked_sku_ids[]：能在文中自然提到的 SKU
- 0 个 SKU 也允许（纯品牌内容）

## 并行
- 每个 (audience × intent) 组合的关键词聚合并行

## 输出
```jsonc
{
  "keyword_clusters": [
    {
      "id": "cluster_001",
      "topic": "Travel mug care & lifespan",
      "head_keyword": "how to clean steel travel mug",
      "long_tails": ["how to remove coffee stains from steel mug", "best way to clean insulated bottle", "..."],
      "search_intent": "informational",
      "audience_id": "audience_001",
      "linked_sku_ids": ["sku_001"]
    }
  ]
}
```

## 校验
- ≥ 1 cluster
- 每 cluster id `^cluster_[0-9]{3}$`
- audience_id (若有) ∈ 01.audience_profiles
- linked_sku_ids[] (若有) 全部 ∈ 02.skus
