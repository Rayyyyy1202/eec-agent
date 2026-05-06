# output.json 模板

```jsonc
{
  "cookie_policy": {
    "effective_date": "<YYYY-MM-DD>",
    "controller_contact_email": "<email>",
    "categories": [
      { "id": "strictly_necessary", "label": "Strictly necessary", "purpose": "...", "default_state": "granted", "examples": ["session", "csrf"], "retention_days": 30 },
      { "id": "analytics", "label": "Analytics", "purpose": "...", "default_state": "denied", "examples": ["GA4"], "retention_days": 730 },
      { "id": "marketing", "label": "Marketing", "purpose": "...", "default_state": "denied", "examples": ["Meta pixel"], "retention_days": 365 }
    ],
    "body_md": "..."
  },
  "accessibility_statement": {
    "wcag_level": "AA",
    "wcag_version": "2.2",
    "axe_score": { "pass": 0, "violations": 0, "measured_at": "<YYYY-MM-DD>" },
    "conformance_status": "partial",
    "known_issues": [],
    "contact_email": "<email>",
    "body_md": "..."
  },
  "ccpa_disclosure": {
    "effective_date": "<YYYY-MM-DD>",
    "do_not_sell_link": {
      "route_path": "/pages/ccpa-do-not-sell",
      "header_label": "Do Not Sell My Info",
      "footer_label": "Do Not Sell My Info"
    },
    "categories_collected": ["identifiers", "commercial information", "internet activity", "geolocation"],
    "third_parties_shared": [
      { "name": "Stripe", "purpose": "Payment processing" },
      { "name": "Google", "purpose": "Analytics + advertising" }
    ],
    "request_form_email": "<email>",
    "body_md": "..."
  },
  "prop65_warning": {
    "applies_to_sku_ids": [],
    "chemical_list": [],
    "body_md": "Based on current product catalog and CA OEHHA guidance, no Prop 65 warning is required for any product currently sold."
  },
  "warranty_terms": {
    "per_sku": [
      { "sku_id": "sku_001", "duration_months": 24, "covers": ["..."], "excludes": ["..."], "transferable": false }
    ],
    "claim_process": "...",
    "claim_contact_email": "<email>",
    "body_md": "..."
  },
  "gdpr_data_request_contact": {
    "email": "<email>",
    "response_sla_days": 30,
    "dpo_name": "...",
    "supervisory_authority": "..."
  },
  "dmca_contact": {
    "agent_name": "...",
    "email": "<email>",
    "address": "...",
    "phone": "..."
  },
  "footer_link_group": {
    "heading": "Legal",
    "links": [
      { "label": "Privacy", "route_path": "/pages/privacy" },
      { "label": "Terms", "route_path": "/pages/terms" },
      { "label": "Cookies", "route_path": "/pages/cookies" },
      { "label": "Accessibility", "route_path": "/pages/accessibility" },
      { "label": "Do Not Sell My Info", "route_path": "/pages/ccpa-do-not-sell" },
      { "label": "Warranty", "route_path": "/pages/warranty" },
      { "label": "DMCA", "route_path": "/pages/dmca" },
      { "label": "GDPR data request", "route_path": "/pages/gdpr-data-request" }
    ]
  },
  "meta": {
    "generated_at": "<ISO-8601>",
    "generator": "eec-03b-legal-pack@1.0.0",
    "schema_version": "1.0.0",
    "upstream_refs": [
      "eec/02-product-selection/output.json",
      "eec/03-brand-identity/output.json",
      "eec/05-site-build/output.json"
    ]
  }
}
```
