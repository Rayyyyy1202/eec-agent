# Module 02 — Demand Validation

## 目标
量化真实月搜索量段位 + 抓 rising queries（02 选品的 SKU 候选起点）。

## 输入
- 主关键词、region
- Module 01 的 related_queries

## 步骤
1. **Google Trends related queries**：top + rising 各取 top 20
2. **AnswerThePublic** (free, daily quota)：抓 5W1H 问句长尾
3. **Keyword Surfer / Ubersuggest free tier**：估月搜索量段（精确数会要付费，取段位即可）
4. **Bing Webmaster Tools keyword research** (免费)：交叉验证

## 输出
```jsonc
"demand": {
  "volume_band": "0-1k|1k-10k|10k-100k|100k+",
  "rising_queries": ["..."],
  "long_tails": ["..."],
  "claim_meta": { "sources": [...], "confidence": "..." }
}
```

## 段位准则
- 0-1k：niche too small，需 SKILL.md 警告
- 1k-10k：DTC 起步合适
- 10k-100k：竞争中等
- 100k+：高竞争，需差异化

## 并行
- Google Trends related + AnswerThePublic + Keyword Surfer 三源并行

## 校验
- volume_band 必填；rising_queries 至少 5 条（少于 → 扩 region 再试）
