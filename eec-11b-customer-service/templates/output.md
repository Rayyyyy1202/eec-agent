# output.json 模板

```jsonc
{
  "contact_methods": [
    { "id": "contact_001", "channel": "email", "value": "support@<brand>.com", "hours_window": "Mon-Fri 9am-6pm PT", "sla_minutes": 60, "languages": ["en"], "label": "Email support" },
    { "id": "contact_002", "channel": "web_form", "value": "/contact", "hours_window": "24/7 (replies in business hours)", "sla_minutes": 1440, "label": "Contact form" }
  ],
  "live_chat_provider": {
    "mode": "none",
    "stub_until": "never",
    "consent_category": "functional"
  },
  "video_tutorials": [
    { "id": "video_001", "title": "<title>", "youtube_id": "<11ch>", "duration_seconds": 90, "topic": "setup", "related_sku_ids": ["sku_001"], "transcript_summary": "..." }
  ],
  "manuals": [
    { "sku_id": "sku_001", "pdf_url": "/manuals/sku_001-en.pdf", "language": "en", "version": "v1.2", "file_size_kb": 4200, "page_count": 32 }
  ],
  "parts_finder": [
    { "parent_sku_id": "sku_001", "replacement_sku_id": "sku_003", "fitment_note": "...", "replacement_interval_days": 180, "part_type": "kit" }
  ],
  "escalation_policy": {
    "cs_tone_ref": "eec/03-brand-identity/output.json#/cs_tone",
    "rules": [
      { "trigger": "Refund > $200", "action": "Escalate to supervisor", "sla_minutes": 60 }
    ]
  },
  "contact_form_config": {
    "route_path": "/contact",
    "post_endpoint": "/api/contact",
    "stub_until": "never",
    "fields": [
      { "id": "name", "label": "Your name", "type": "text", "required": true },
      { "id": "email", "label": "Email", "type": "email", "required": true }
    ]
  },
  "meta": {
    "generated_at": "<ISO>",
    "skill_version": "1.0.0",
    "schema_version": "1.0.0"
  }
}
```
