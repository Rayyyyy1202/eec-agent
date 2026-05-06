# Module 04 — Competitor Analysis

## 目标
找头部 5–8 家 → `competitors[]`：卖什么角度、价格带、可见弱点。喂 02 选品 + 03 品牌差异化。

## 输入
- 主关键词、region

## 步骤
1. **Google search**：`<kw> brand` / `best <kw>` / `<kw> review`，取前 2 页非广告结果
2. **每家竞品 site fetch**：抓首页 hero copy、产品页价格 / USP、about 页定位、policy 页（保修 / 退货）
3. **流量段估**：Similarweb free（仅大类品牌可见）、SimilarSites、SemRush traffic estimate
4. **社媒**：Instagram bio + 最近 9 帖 hashtag（看 ad concept）

## 数据源
- Google + Bing 搜索
- `https://www.similarweb.com/website/<domain>/`
- 直接 fetch 域名首页
- IG: `https://www.instagram.com/<handle>/`

## 并行
- 每家竞品的 (homepage fetch + IG fetch + similarweb) 并行

## 抽取字段
- `brand`、`url`、`key_angle`（一句话）
- `price_band`（min-max in their currency）
- `traffic_estimate_band`（low/medium/high/unknown）
- `visible_weakness`（slow shipping / poor returns / no subscription / etc.）

## 输出
```jsonc
"competitors": [
  {
    "id": "comp_001",
    "brand": "<name>",
    "url": "<url>",
    "key_angle": "<one sentence>",
    "price_band": { "min": 19, "max": 79, "currency": "USD" },
    "visible_weakness": ["..."],
    "claim_meta": { ... }
  }
]
```

## 校验
- 至少 5 个 competitors
- 每个 id `^comp_[0-9]{3}$`
- 头部 3 家 confidence=high（必须直接 fetch 过站点）
