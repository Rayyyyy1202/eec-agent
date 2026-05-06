# Module 03 — Consent + UTM Taxonomy

## A. Consent Mode

### 框架选择
- 01.niche.region 含 EU/UK → `gdpr`
- 01.niche.region 含 US/CA → `ccpa`
- 全球售 → `global`（取并集）
- 仅低敏感市场 → `none`（不推荐）

### Defaults（必须 denied）
```js
{
  "analytics_storage": "denied",
  "ad_storage": "denied",
  "ad_user_data": "denied",
  "ad_personalization": "denied",
  "functionality_storage": "granted",
  "security_storage": "granted"
}
```

### Required categories
- gdpr → analytics + ad_storage + ad_user_data + ad_personalization
- ccpa → ad_storage + ad_personalization (opt-out)
- global → 取 gdpr + ccpa 并集

### Regions
- ISO-3166 alpha-2 列表

## B. UTM Taxonomy

### Source format
- lower_snake，枚举 `meta | google | tiktok | youtube | email | newsletter | pinterest | organic | direct | affiliate`

### Medium format
- 枚举 `cpc | cpm | social_paid | social_organic | email | referral | display | video`

### Campaign format
- 模板 `{objective}_{audience}_{date:YYMMDD}` 例 `sales_lookalike1pct_260315`
- 全 lowercase，单词用 `_` 隔开

### Content format（A/B 创意区分）
- 模板 `{creative_id}_{format}` 例 `pairing001_9x16`

### Term format（仅 search）
- lower_snake 关键词

## 输出
```jsonc
{
  "consent_mode": {
    "framework": "gdpr",
    "regions": ["DE","FR","NL","ES","IT","UK"],
    "defaults": { "analytics_storage": "denied", "ad_storage": "denied", "ad_user_data": "denied", "ad_personalization": "denied" },
    "required_categories": ["analytics", "ad_storage", "ad_user_data", "ad_personalization"]
  },
  "utm_taxonomy": {
    "source_format": "lower_snake; one of meta|google|tiktok|email|organic|direct",
    "medium_format": "lower_snake; one of cpc|social_paid|email|organic",
    "campaign_format": "{objective}_{audience}_{date:YYMMDD}",
    "content_format": "{creative_id}_{format}",
    "term_format": "lower_snake keyword"
  }
}
```

## 校验
- consent_mode.defaults 中 ad_storage / analytics_storage 必须 == "denied"
- regions 全部 ISO-3166 alpha-2
- utm_taxonomy 5 字段全填
