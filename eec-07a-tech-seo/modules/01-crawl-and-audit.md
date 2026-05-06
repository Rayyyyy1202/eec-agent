# Module 01 — Crawl & Audit

## 目标
跑 Lighthouse + 抓 robots.txt / sitemap.xml / canonical / headers，输出 lighthouse_scores + technical_issues[]。

## 步骤
1. **Lighthouse**（每路由）：`lighthouse <url> --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=./eec/07a-tech-seo/lighthouse/<route>.json`
2. **Fetch HTML**：`curl -s <url> | check`：
   - meta robots 是否 noindex
   - canonical 是否合理
   - h1 唯一
   - alt 全填
3. **robots.txt + sitemap.xml**：抓 `/robots.txt` 和 `/sitemap.xml`，检查可访问 + 包含核心路由
4. **HTTP headers**：检查 `cache-control`, `x-robots-tag`, security headers (CSP, HSTS, etc.)

## 并行
- 每条 route × Lighthouse + curl + headers 全并行

## 问题分类
| Category | 例 |
|---|---|
| crawlability | robots.txt 阻断 / 5xx / soft 404 |
| indexing | 缺 canonical / noindex 误配 |
| performance | LCP > 2.5s / 大图未压缩 |
| metadata | title 重复 / description 缺失 |
| structured_data | JSON-LD 校验错 |
| accessibility | alt 缺 / contrast 不足 |
| i18n | hreflang 错配 |
| mobile | tap target 太小 |
| security | mixed content / 无 HSTS |

## 输出
```jsonc
{
  "audit_report": {
    "lighthouse_scores": { "performance": 78, "accessibility": 95, "best_practices": 92, "seo": 100 },
    "technical_issues": [
      {
        "severity": "high",
        "category": "performance",
        "description": "LCP 3.4s on /products/* due to unoptimized hero image",
        "affected_routes": ["/products/steel-mug", "/products/glass-bottle"],
        "fix_recommendation": "Convert hero JPG to AVIF + add preload hint + sizes attr"
      }
    ]
  }
}
```

## 校验
- lighthouse_scores 4 项全填（≥0）
- technical_issues 中 severity=critical 项 → SKILL.md Step 4 必须在 applied_changes 处理
- 每条 issue 必有 fix_recommendation
