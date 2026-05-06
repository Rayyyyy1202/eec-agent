# Module 03 — User Insights

## 目标
挖痛点、场景、决策卡点 → `pain_points[]`（02 USP 起点）+ 帮 06 模块 audience_profiles。

## 输入
- 主关键词、Module 02 的 long_tails

## 步骤
1. **Reddit**：在相关子版块搜痛点关键词（"hate"、"problem with"、"alternatives to"），抓 top 30 帖子的标题 + 高赞回复
2. **Quora**：搜问句 ("best ... for ..."、"why does ... not work")，抓 top 5 答案
3. **YouTube comments**：top 5 review 视频的高赞评论
4. **Amazon 1-3 星 reviews**：抓 30 条最近 critical review 摘要差评类型

## 数据源
- `https://www.reddit.com/r/<sub>/search/?q=<kw>&restrict_sr=1`
- `https://www.quora.com/search?q=<kw>`
- YouTube `&sp=CAMSAhgB` (sort by view count)
- Amazon: 类目 best-seller → 1-star reviews

## 并行
- Reddit + Quora + YouTube + Amazon 四源并行

## 痛点抽取规则
- 一个痛点必须出现在 ≥ 2 个独立源 → confidence=high
- 单源 → confidence=medium
- 推理来的（无源） → 不写

## 输出
```jsonc
"pain_points": [
  {
    "id": "pain_001",
    "summary": "<≤80 chars>",
    "frequency": "very_common|common|occasional",
    "claim_meta": { "sources": [...], "confidence": "..." }
  }
]
```

## 校验
- 至少 5 条 pain_points
- 每条 id 满足 `^pain_[0-9]{3}$`
- frequency=very_common 必须 ≥ 2 源
