# Module 05 — Applied Changes（写回 05 仓库）

## 目标
能修的 issue 直接写回 05 仓库，列 diff_summary。

## 可写回项
| change_type | target | 例 |
|---|---|---|
| sitemap_xml | repo/public/sitemap.xml | 重生 sitemap，含全 routes |
| robots_txt | repo/public/robots.txt | 加 sitemap 引用 + Disallow 规则 |
| canonical_meta | repo/app/<route>/page.tsx | 注入 `<link rel="canonical">` |
| schema_org_jsonld | repo/app/<route>/page.tsx | 注入 JSON-LD |
| redirect_rule | repo/next.config.js | 加 301/308 |
| meta_tag_fix | repo/app/<route>/page.tsx | 修 title/description |
| image_optimization | repo/app/<asset paths> | 改 img 为 next/image |
| header_cache | repo/next.config.js | 加 cache-control |

## 步骤
1. 读 Module 01 technical_issues[]，按 severity 排序
2. 对 critical / high：尝试自动修
3. 对 medium：列 fix 但不自动应用（避免误改）
4. 对 low：仅报告
5. 每个改动校验：target 路径必须在 05.repo_path 下
6. 关键文件改动必须在 05.writeback_target_files[]（若覆盖到，否则 SKILL.md 交互点 3 提示）

## 输出
```jsonc
{
  "applied_changes": [
    {
      "change_type": "sitemap_xml",
      "target": "repo/public/sitemap.xml",
      "applied_at": "2026-04-21T10:32:00Z",
      "diff_summary": "Generated sitemap with 24 URLs (8 products + 4 collections + 12 blog placeholders)"
    },
    {
      "change_type": "schema_org_jsonld",
      "target": "repo/app/products/[slug]/page.tsx",
      "applied_at": "2026-04-21T10:34:00Z",
      "diff_summary": "Injected Product JSON-LD with offers + brand"
    }
  ]
}
```

## 校验
- 每条 applied_changes target 实际存在 (改后)
- diff_summary 非空
- critical issues 全部要么在 applied_changes，要么在 report 中说明无法本期修
- redirects_recommended[] 单独列（用户审过再加到 next.config）
