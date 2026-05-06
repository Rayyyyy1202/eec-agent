# Module 01 — Market Trends

## 目标
判断品类是上升 / 稳定 / 下降，量化季节性，给后续 5 个模块决定是否值得继续。

## 输入
- `keyword` (英文)、`region` (默认 North America)

## 步骤
1. **Google Trends**（5 年 + 12 月双视图）：抓主关键词曲线，记录方向、峰谷月份
2. **Pinterest Trends**：搜同义关键词，记录 trending 增长 % 与 saved pins
3. **YouTube 搜索 + 排序按 upload date**：top 30 天内是否有 explosive content
4. **Reddit 子版块**：搜近 90 天发帖频次（反映社群热度）

## 数据源（免费）
- `https://trends.google.com/trends/explore`
- `https://trends.pinterest.com/`
- YouTube 搜索 URL 加 `&sp=CAISBAgCEAE%253D` (date filter)
- `https://www.reddit.com/search/?q=<kw>&sort=new&t=year`

## 并行
- Google Trends + Pinterest Trends + YouTube 搜索同时 fetch（独立源）

## 输出（写入 output.json）
```jsonc
"trends": {
  "direction_12mo": "rising|stable|declining",
  "seasonality": [{ "month": "12", "lift_pct": 35 }],
  "claim_meta": { "sources": [{"url": "...", "title": "..."}], "confidence": "high|medium|low" }
}
```

## 校验
- direction_12mo 必填；若 declining 且 5y 也下行 → SKILL.md Step 1 暂停问用户

## 失败模式
- Google Trends 0 数据 → 用近义词扩展再试一次
- Pinterest Trends 区域不支持 → 标 confidence=low + verification_path
