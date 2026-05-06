# Phase 2 Hooks — Reserved Fields for `eec-10-email-crm` & `eec-11-fulfillment`

Phase 2 skills are **not built in MVP**. But MVP skills MUST emit the fields below so Phase 2 can plug in **without retroactive rework** of upstream skills.

## Why bother carrying these now

If MVP skips them, every Phase 2 launch requires:

1. Reopening MVP skills to add fields to schemas
2. Re-running every upstream module to backfill
3. Retesting the full chain end-to-end

Carrying "unused" fields now costs ~0 schema bytes and saves a full retrofit later.

---

## Hook ownership table

| # | Field path | Owned by | Required in MVP? | Consumed by Phase 2 |
|---|---|---|---|---|
| H1 | `skus[].email_friendly_name` | `eec-02-product-selection` | YES | `eec-10-email-crm` |
| H2 | `skus[].subscription_eligible` | `eec-02-product-selection` | YES | `eec-10-email-crm` |
| H3 | `skus[].cost` | `eec-02-product-selection` | YES | `eec-11-fulfillment` |
| H4 | `skus[].moq` | `eec-02-product-selection` | YES | `eec-11-fulfillment` |
| H5 | `skus[].lead_time_days` | `eec-02-product-selection` | YES | `eec-11-fulfillment` |
| H6 | `skus[].supplier_id` | `eec-02-product-selection` | YES | `eec-11-fulfillment` |
| H7 | `skus[].supplier_country` | `eec-02-product-selection` | YES | `eec-11-fulfillment` |
| H8 | `email_brand_kit.*` | `eec-03-brand-identity` | YES | `eec-10-email-crm` |
| H9 | `events_spec[]` includes `email_signup` event | `eec-06-tracking` | YES | `eec-10-email-crm` |
| H10 | `email_consent_event` block | `eec-06-tracking` | YES | `eec-10-email-crm` |
| H11 | `purchase_event_full_spec` block (must list `order_id`, `items`, `shipping_address`, `customer_email_hash`, `total`, `is_first_purchase`) | `eec-06-tracking` | YES | `eec-11-fulfillment` |
| H12 | `skus[].return_policy_days` | `eec-02-product-selection` | YES | `eec-11-fulfillment` (returns workflow + customer FAQ) |
| H13 | `skus[].restricted_geo[]` | `eec-02-product-selection` | YES | `eec-11-fulfillment` (shipping eligibility) AND `eec-08-paid-ads` (geo exclusion at MVP) |
| H14 | `skus[].low_stock_threshold` | `eec-02-product-selection` | YES | `eec-11-fulfillment` (replenishment alerts) |
| H15 | `events_spec[]` includes `cart_abandoned` event | `eec-06-tracking` | YES | `eec-10-email-crm` (abandoned cart flow) |
| H16 | `events_spec[]` includes `email_unsubscribed` event | `eec-06-tracking` | YES | `eec-10-email-crm` (list hygiene / send suppression) |
| H17 | `events_spec[]` includes `return_initiated`, `refund`, `order_shipped`, `order_delivered`, `order_canceled` events | `eec-06-tracking` | YES | `eec-11-fulfillment` (full order lifecycle) |
| H18 | `purchase_event_full_spec.must_emit_fields` includes `is_first_purchase` | `eec-06-tracking` | YES | `eec-10-email-crm` (welcome vs returning fork) |
| H19 | `cs_tone` block | `eec-03-brand-identity` | YES | `eec-11-fulfillment` (CS auto-replies / templates) |
| H20 | `welcome_offer` block | `eec-03-brand-identity` | YES | `eec-10-email-crm` (welcome series anchor) |

### Locked technical decisions (apply to all hooks)

| Decision | Locked value | Where enforced |
|---|---|---|
| PII hashing algorithm | **SHA-256** (lowercase hex, after trim+lowercase normalization for emails per platform spec) | `eec-06-tracking.pii_hash_algorithm` (`const: "sha256"`) |
| GTM writeback path | `eec-06-tracking` writes back to `eec-05-site-build.repo_path`, then runs `analytics_endpoints.rebuild_protocol.rebuild_command` | `eec-06-tracking.site_build_writeback` |
| Audience binding | Many-to-many at SKU level (`02.skus[].target_audience_ids[]`) and asset/copy level (`04.assets[].audience_ids[]`); singular at paid-ad level | Per schema |
| Currency | Per-SKU (each `Money` carries its own ISO-4217 currency); no single store-wide lock | `_common#/$defs/Money` per use site |
| Market scope | MVP = single market (`01.niche.region` is a string). Multi-market is Phase 2+ work, would propagate to 03/06/08 | `eec-01-research` |

---

## Hook detection in schemas

Hook fields are flagged in JSON Schema via the `description` field, prefixed `phase2_hook:`. Example:

```json
"cost": {
  "$ref": "_common#/$defs/Money",
  "description": "phase2_hook: landed cost — required by 11 fulfillment for margin calc"
}
```

Validation tooling can grep schemas for `phase2_hook:` to enumerate all reserved fields.

---

## Placeholder policy

When real data is unavailable in MVP (e.g. supplier not yet selected):

- **String fields**: emit `"TBD"` or `"phase2_pending"` — NEVER omit the key
- **Number fields**: emit `0` or `-1` and add a `confidence: "low"` claim flag — NEVER omit the key
- **Object fields**: emit the object shell with placeholder values — NEVER omit the key

Phase 2 skills will detect placeholders and prompt the user to fill them. Absent keys would be silent failures.

---

## Adding a new hook (process)

When a Phase 2 design surfaces a new field need:

1. Add the field to the upstream MVP skill's `output.schema.json`
2. Mark with `"description": "phase2_hook: ..."` 
3. Update this doc (insert new row in the ownership table)
4. Bump the upstream skill's `version` (minor — additive change)
5. Re-run the dry-run validation across the chain (Phase 4 of master plan)

---

## What is NOT a hook

The following Phase 2 needs are **derived at Phase 2 time**, not reserved upfront:

- Email templates (10 generates from `email_brand_kit` + `copy_blocks`)
- Customer segments (10 derives from event history + `audience_profiles`)
- Shipping rates (11 fetches from carriers using `supplier_country` + `dim_cm`/`weight_g`)
- Returns workflow (11 derives from `payment_methods` + `purchase_event_full_spec`)

These are listed here to make the boundary explicit: anything not in the ownership table above is fair game to design freely in Phase 2.
