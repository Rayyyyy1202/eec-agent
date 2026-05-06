# Module 01 — Data Sources + Env Vars

## 目标
声明每个 connector：platform / auth_method / required_env_vars / metrics / dimensions / status。

## 平台 → 推断的来源
| 06 destination type | 09 平台 | required_env_vars |
|---|---|---|
| meta_pixel | meta_marketing_api | META_ACCESS_TOKEN, META_AD_ACCOUNT_ID |
| google_ads | google_ads_api | GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID |
| ga4 | ga4_data_api | GA4_PROPERTY_ID, GOOGLE_APPLICATION_CREDENTIALS |
| tiktok_pixel | tiktok_marketing_api | TIKTOK_ACCESS_TOKEN, TIKTOK_ADVERTISER_ID |
| internal_db (orders) | shopify_admin_api | SHOPIFY_SHOP_DOMAIN, SHOPIFY_ADMIN_API_TOKEN |
| internal_db (revenue) | stripe_api | STRIPE_SECRET_KEY |
| (organic SEO) | search_console_api | GOOGLE_APPLICATION_CREDENTIALS, GSC_SITE_URL |
| pinterest | pinterest_api | PINTEREST_ACCESS_TOKEN |
| youtube | youtube_analytics_api | GOOGLE_APPLICATION_CREDENTIALS, YOUTUBE_CHANNEL_ID |

## 步骤
1. 读 06.destinations[] → 推 09 平台
2. 对每 platform：
   - api_endpoint：例 `insights` (Meta), `runReport` (GA4), `searchStream` (Google Ads)
   - api_version：例 `v19.0` (Meta), `v17` (Google Ads)
   - auth_method：oauth2_user (Meta/Google individual) / oauth2_system_user (Meta business) / service_account (Google) / api_key (Stripe) / session_token (legacy)
   - required_env_vars：列出
   - metrics_pulled：核心 ['impressions','clicks','spend','purchase_value','purchase'] + 平台特定
   - dimensions_pulled：['campaign_id','adset_id','ad_id','date'] + 按需
3. **环境变量 check**：
   - 全部 set → status="ok"（拉数前默认）
   - 任一 missing → status="missing_env_vars" + error_detail "Missing: META_ACCESS_TOKEN"
   - 不能因为缺 var 就跳过该 source（必须如实记录）

## 并行
- 每平台的 env check 并行

## 输出
```jsonc
{
  "data_sources": [
    {
      "platform": "meta_marketing_api",
      "api_endpoint": "act_<id>/insights",
      "api_version": "v19.0",
      "auth_method": "oauth2_system_user",
      "required_env_vars": ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"],
      "account_id_placeholder": "act_TBD",
      "metrics_pulled": ["impressions","clicks","spend","purchase","purchase_value","add_to_cart"],
      "dimensions_pulled": ["campaign_id","adset_id","ad_id","date"],
      "pull_frequency": "daily",
      "rate_limit_observed": "Tier-2 60k calls/hour",
      "last_pulled_at": "2026-04-21T08:00:00Z",
      "status": "ok",
      "rows_fetched": 0
    }
  ]
}
```

## 校验
- 至少 1 source
- required_env_vars[] 全 `^[A-Z][A-Z0-9_]*$`
- status != "ok" → error_detail 必填
