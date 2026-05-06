# Module 03 — Schema.org Injection + Validation

## 目标
注入 JSON-LD + 跑 validator → schema_org_emitted[]。

## 必有 type
| Route | type |
|---|---|
| / | Organization + WebSite |
| /products/[slug] | Product (含 offers, aggregateRating 占位) |
| /collections/[slug] | ItemList |
| /blog/[slug] | Article |
| 含面包屑 | BreadcrumbList |
| 含 FAQ 区 | FAQPage |
| /policy/* | WebPage |

## Product 模板（必有字段）
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{{sku.name}}",
  "image": ["{{asset.url}}"],
  "description": "{{sku.description_short}}",
  "sku": "{{sku.id}}",
  "brand": { "@type": "Brand", "name": "{{brand_name}}" },
  "offers": {
    "@type": "Offer",
    "url": "{{route}}",
    "priceCurrency": "{{sku.retail_price.currency}}",
    "price": "{{sku.retail_price.amount}}",
    "availability": "https://schema.org/InStock"
  }
}
```

## 步骤
1. 对每条目标 route 生 JSON-LD
2. 注入 05 仓库 head 模板（component or per-route）
3. 跑 validator：
   - https://validator.schema.org/ (Google)
   - https://search.google.com/test/rich-results (Rich Results Test)
4. 失败 → 修 → 再校验

## 并行
- 每条 type 的 validator 调用并行

## 输出
```jsonc
{
  "schema_org_emitted": [
    { "route": "/", "type": "Organization", "validated": true, "validator": "schema-validator" },
    { "route": "/", "type": "WebSite", "validated": true, "validator": "schema-validator" },
    { "route": "/products/steel-mug", "type": "Product", "validated": true, "validator": "rich-results-test" },
    { "route": "/products/steel-mug", "type": "BreadcrumbList", "validated": true, "validator": "rich-results-test" }
  ]
}
```

## 校验
- 至少 1 条 validated=true
- 主推 SKU 有 Product type
- /  必有 Organization + WebSite

## 写回
- JSON-LD 注入 05 模板（在 writeback_target_files 内）
- 同步 applied_changes[]
