# Module 04 — SEO Meta + Schema.org + Accessibility

## 目标
每条 route 一组 seo_meta + JSON-LD + WCAG AA。

## 步骤
### A. SEO meta（每路由）
- `title`：≤60，含主关键词；非首页用 `[Page Title] | [Brand]` 模板
- `description`：≤160，含 USP + CTA 动词
- `og_image`：取 04.assets[] 中对应 hero asset 的 file_path
- `canonical`：自指 OR 多变体路由统一
- `schema_org_type`：依 route 类型选
  - `/` → Organization + WebSite
  - `/products/[slug]` → Product (含 offers, aggregateRating 占位)
  - `/blog/[slug]` → Article
  - `/policy/*` → WebPage
  - 含 FAQ 区块 → FAQPage
  - 面包屑 → BreadcrumbList

### B. Schema.org JSON-LD 注入
- 在 `<head>` 里写 `<script type="application/ld+json">` 块
- Product 必填：name, image, description, sku, brand, offers (price, priceCurrency, availability)

### C. Accessibility
- 全 image 有 alt_text（来自 04.assets[].alt_text）
- 颜色对比 ≥ 4.5:1（用 03.palette 校验）
- 全 input 有 label
- focus 状态可见
- semantic HTML（h1-h6 层级合理）
- 跑 axe-core 自检 → axe_score ≥ 90

## 并行
- 每路由的 meta 生成 + axe 跑分并行

## 输出
```jsonc
{
  "seo_meta": [
    {
      "route": "/products/steel-mug",
      "title": "Steel Travel Mug — keeps drinks hot 12h | Brand",
      "description": "Double-wall vacuum insulation, BPA-free, 16oz. Free shipping over $35.",
      "og_image": "./eec/04-creative-factory/assets/img/sku001_hero_web_en_16x9_01.jpg",
      "canonical": "https://example.com/products/steel-mug",
      "schema_org_type": "Product"
    }
  ],
  "accessibility_baseline": {
    "axe_score": 92,
    "wcag_level": "AA",
    "known_issues": []
  }
}
```

## 校验
- 全 title.length ≤ 60
- 全 description.length ≤ 160
- 至少 / + 主推 product 有 schema_org_type
- accessibility_baseline.wcag_level == "AA"
