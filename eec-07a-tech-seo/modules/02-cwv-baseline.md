# Module 02 — Core Web Vitals Baseline

## 目标
LCP / INP / CLS 三件套 p75 整体 + by_route，作为 09 后续优化的对照基线。

## 数据来源
1. **CrUX (Chrome User Experience Report)** —— 真实用户数据，需站点 ≥ 千 PV/月才有数据
2. **Lighthouse Lab data** —— 模拟，新站可用
3. **PageSpeed Insights API** —— 包二者
4. **web-vitals.js** 注入 → 06 dataLayer 上报实测（与 06 闭环）

## 步骤
1. 跑 PageSpeed Insights API per route（公开免费）
2. 优先 CrUX 数据；缺则用 Lighthouse Lab
3. p75 阈值：
   - LCP ≤ 2500ms = good, ≤ 4000ms = needs_improvement, > 4000ms = poor
   - INP ≤ 200ms = good, ≤ 500ms = needs_improvement, > 500ms = poor
   - CLS ≤ 0.1 = good, ≤ 0.25 = needs_improvement, > 0.25 = poor

## 并行
- 每路由的 PageSpeed Insights API 并行调

## 输出
```jsonc
{
  "core_web_vitals_baseline": {
    "lcp_p75_ms": 2200,
    "inp_p75_ms": 180,
    "cls_p75": 0.05,
    "by_route": [
      { "route": "/", "lcp_p75_ms": 1800, "inp_p75_ms": 120, "cls_p75": 0.02 },
      { "route": "/products/steel-mug", "lcp_p75_ms": 2400, "inp_p75_ms": 200, "cls_p75": 0.06 }
    ]
  }
}
```

## 校验
- 三件套 ≥ 0
- by_route 至少包含 / 和主推 product

## 失败模式
- 数据全无（新站零流量）→ 标 confidence=low, 用 Lighthouse Lab 兜底
