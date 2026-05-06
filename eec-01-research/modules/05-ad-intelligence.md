# Module 05 — Ad Intelligence

## 目标
摸竞品在投什么 hook、什么格式、CPM 大概多少。喂 04 创意 + 08 投流。

## 输入
- 头部竞品 brand 名（Module 04）

## 步骤
1. **Meta Ad Library**：`https://www.facebook.com/ads/library/?country=<ISO>&q=<brand>` —— 抓在投广告创意（image/video/carousel）+ 文案 hook
2. **TikTok Creative Center** (free): `https://ads.tiktok.com/business/creativecenter/` —— 抓 trending creative + 类目
3. **Google Ads Transparency Center**：`https://adstransparency.google.com/?region=<ISO>` —— 抓 SERP / display / YouTube ads
4. **CPM benchmarks**：用 WordStream / Statista 公开数据估 niche 的 CPM 段

## 数据源（全免费）
- Meta Ad Library (官方)
- TikTok Creative Center
- Google Ads Transparency Center

## 并行
- Meta + TikTok + Google 三平台并行抓

## 抽取
- `top_creatives[]`：format (image/video/carousel)、hook 一句话、平台
- `common_hooks[]`：抽取出现频次 ≥ 3 次的 hook 范式（例 "Tired of X?"）
- `avg_cpm_band`：low (<5 USD) / medium (5-15) / high (>15) / unknown

## 输出
```jsonc
"ad_intelligence": {
  "top_creatives": [{ "format": "video", "hook": "...", "platform": "meta" }],
  "common_hooks": ["..."],
  "avg_cpm_band": "medium",
  "claim_meta": { ... }
}
```

## 校验
- top_creatives 至少 5 条
- common_hooks 至少 3 条
