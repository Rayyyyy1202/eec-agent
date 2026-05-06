# eec-04b-social-proof — output template

```json
{
  "review_provider": {
    "mode": "self_hosted",
    "stub_until": "never",
    "provider_env_vars": [],
    "writeback_target_files": ["app/reviews/page.tsx", "components/ReviewWidget.tsx"]
  },
  "reviews": [
    {
      "id": "review_001",
      "sku_id": "sku_001",
      "rating": 5,
      "title": "...",
      "body": "...",
      "author_name": "Kim L.",
      "author_location": "Brooklyn, NY",
      "published_at": "2026-03-15",
      "verified_purchase": true,
      "synthetic": true
    }
  ],
  "aggregate_ratings": [
    {
      "sku_id": "sku_001",
      "rating_average": 4.7,
      "review_count": 8,
      "rating_distribution": { "1": 0, "2": 0, "3": 1, "4": 1, "5": 6 }
    }
  ],
  "ugc_assets": [],
  "case_studies": [],
  "press_widget": {
    "display_mode": "logos_only",
    "logos": [
      { "outlet": "Wirecutter", "url": "https://www.nytimes.com/wirecutter/..." }
    ]
  },
  "meta": {
    "generated_at": "2026-04-22T00:00:00Z",
    "skill_version": "1.0.0",
    "schema_version": "1.0.0"
  }
}
```
