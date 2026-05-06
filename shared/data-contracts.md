# EEC Skills — Data Contracts (Phase 1 deliverable)

This is the **single source of truth** for how the 9 MVP skills + 2 Phase 2 skills exchange data. Everything else (skill `SKILL.md`, modules, templates) is generated FROM this contract.

If you change a contract here, every downstream skill must be re-validated.

> **Companion files (must read together):**
> - `conventions.md` — paths, naming, language, currency, validation rules
> - `phase2-hooks.md` — fields reserved for Phase 2 skills (10/11)
> - `schemas/_common.schema.json` — shared `$defs` (Money, Confidence, Source, AudienceProfile, Meta)
> - `schemas/NN-*.schema.json` — full JSON Schema per module

---

## 1. End-to-end data flow

```
                                                          USER INPUT (品类关键词)
                                                                     │
                                                                     ▼
                                                          ┌─────────────────────┐
                                                          │ 01 RESEARCH         │
                                                          │ ─────────────────── │
                                                          │ niche, trends,      │
                                                          │ pain_points[],      │
                                                          │ competitors[],      │
                                                          │ audience_profiles[],│ ◄────────── audience_profiles[]
                                                          │ ad_intel,           │            (referenced by 02, 04, 07b, 08)
                                                          │ supply_signals      │
                                                          └────────┬────────────┘
                                                                   │
                              ┌────────────────────────────────────┼─────────────────────────────────────┐
                              │                                    │                                     │
                              ▼                                    ▼                                     ▼
                    ┌──────────────────┐               ┌─────────────────────┐                ┌──────────────────────┐
                    │ 02 PRODUCT       │               │ 03 BRAND IDENTITY   │                │ 07b CONTENT (later)  │
                    │ SELECTION        │◄──────────────│                     │                │ uses audiences +     │
                    │ ──────────────── │ uses skus     │ brand_name, tone,   │                │ pain_points          │
                    │ skus[] (incl.    │ for brand     │ palette, fonts,     │                └──────────────────────┘
                    │   image_briefs,  │ context       │ logo_brief,         │
                    │   email_friendly,│               │ email_brand_kit ◄───┼─── PHASE 2 HOOK (10 email)
                    │   cost/moq/      │               └──────────┬──────────┘
                    │   lead_time/     │                          │
                    │   supplier ←────┼─── PHASE 2 HOOK (11)      │
                    │   subscription_ ◄─── PHASE 2 HOOK (10)      │
                    │   eligible)      │                          │
                    └────────┬─────────┘                          │
                             │                                    │
                             │   ┌────────────────────────────────┘
                             ▼   ▼
                    ┌─────────────────────────┐
                    │ 04 CREATIVE FACTORY     │
                    │ ─────────────────────── │
                    │ assets[] (id, purpose,  │
                    │   channel, lang, sku),  │
                    │ copy_blocks[],          │
                    │ video_briefs[],         │
                    │ naming_convention       │
                    └────────┬────────────────┘
                             │
                             │ ┌──────────────────┐
                             │ │ 02 skus + 03     │
                             │ │ brand + 04       │
                             │ │ assets/copy      │
                             ▼ ▼
                    ┌─────────────────────────┐
                    │ 05 SITE BUILD           │
                    │ ─────────────────────── │
                    │ site_url, tech_stack,   │
                    │ routes[] (refs SKUs +   │
                    │   copy + assets),       │
                    │ checkout_flow,          │
                    │ seo_meta[],             │
                    │ analytics_endpoints ────┼─── empty slots + rebuild_protocol
                    │   (gtm_placeholder,     │     (declares which files 06
                    │    consent_layer_slot,  │      may writeback + rebuild_command)
                    │    rebuild_protocol)    │             ▲
                    └────────┬────────────────┘             │
                             │                              │ writeback +
                             │                              │ rebuild loop
                             ▼                              │
                    ┌─────────────────────────┐             │
                    │ 06 TRACKING             │             │
                    │ ─────────────────────── │             │
                    │ events_spec[] (13 req'd:│             │
                    │   page_view, view_item, │             │
                    │   add_to_cart, begin_   │             │
                    │   checkout, purchase,   │             │
                    │   email_signup, cart_   │             │
                    │   abandoned ★H15,       │             │
                    │   email_unsubscribed ★H16,             │
                    │   return_initiated,     │             │
                    │   refund, order_shipped,│             │
                    │   order_delivered,      │             │
                    │   order_canceled ★H17), │             │
                    │ destinations[],         │             │
                    │ consent_mode,           │             │
                    │ utm_taxonomy,           │             │
                    │ email_consent_event ◄───┼─── ★H10 (10)│
                    │ purchase_event_full ◄───┼─── ★H11+H18 │
                    │   _spec                 │     (10/11) │
                    │ pii_hash_algorithm: ────┼─── locked   │
                    │   "sha256"              │     SHA-256 │
                    │ site_build_writeback ───┼─────────────┘
                    └────┬──────────┬─────────┘
                         │          │
              ┌──────────┘          └────────────┐
              ▼                                  ▼
    ┌──────────────────────┐           ┌─────────────────────────┐
    │ 07a TECH SEO         │           │ 08 PAID ADS             │
    │ ──────────────────── │           │ ─────────────────────── │
    │ audit_report,        │           │ account_structure[],    │
    │ core_web_vitals,     │           │ audiences[]             │
    │ schema_org_emitted,  │           │   (ref 01.audiences +   │
    │ keyword_opportunities│──────┐    │    06.events for retgt),│
    │   (→ 07b)            │      │    │ creative_pairing[]      │
    │ applied_changes      │      │    │   (ref 04.assets +      │
    └──────────────────────┘      │    │    04.copy),            │
                                  │    │ budget_plan,            │
                                  ▼    │ utm_taxonomy_applied,   │
                       ┌───────────────┤ destinations_required,  │
                       │ 07b CONTENT   │ pixels_required,        │
                       │ MARKETING     │ launch_checklist        │
                       │ ───────────── │ └──────────┬─────────────┘
                       │ keyword_      │            │
                       │   clusters[], │            │
                       │ content_      │            │
                       │   calendar[], │            │
                       │ drafts[],     │            │
                       │ internal_link │            │
                       │   _map        │            │
                       └───────┬───────┘            │
                               │                    │
                               └────────┬───────────┘
                                        │
                                        ▼
                               ┌──────────────────────────┐
                               │ 09 OPTIMIZATION          │
                               │ ──────────────────────── │
                               │ data_sources[] ──────────┼──► EXTERNAL APIs
                               │   (Meta Marketing,       │     (auth method,
                               │    Google Ads,           │      env vars,
                               │    GA4 Data API,         │      metrics &
                               │    TikTok Marketing,     │      dimensions
                               │    Shopify Admin,        │      pulled, status)
                               │    Stripe, ...)          │
                               │ data_pull,               │
                               │ diagnostics[],           │
                               │ experiments[],           │
                               │ decisions[],             │
                               │ applied_changes[],       │
                               │ next_actions[]           │
                               └──────────────────────────┘
```

---

## 2. Per-skill input/output contract

| # | Skill | Reads (required) | Reads (optional) | Writes |
|---|---|---|---|---|
| 01 | research | — (user input only) | — | `./eec/01-research/output.json` |
| 02 | product-selection | 01 | — | `./eec/02-product-selection/output.json` |
| 03 | brand-identity | 01, 02 | — | `./eec/03-brand-identity/output.json` |
| 04 | creative-factory | 02, 03 | 01 (for audience tone) | `./eec/04-creative-factory/output.json` |
| 05 | site-build | 02, 03, 04 | — | `./eec/05-site-build/output.json` + `./eec/05-site-build/repo/` |
| 06 | tracking | 05 | 02 (SKU IDs in events), 08 (utm format hints) | `./eec/06-tracking/output.json` + GTM container `.json` |
| 07a | tech-seo | 05, 06 | — | `./eec/07a-tech-seo/output.json` (+ writes back to repo) |
| 07b | content-marketing | 01, 02, 03 | 07a (`keyword_opportunities`) | `./eec/07b-content-marketing/output.json` + `drafts/*.md` |
| 08 | paid-ads | 02, 03, 04, 06 | 01 (audience source), 05 (landing routes) | `./eec/08-paid-ads/output.json` |
| 09 | optimization | 06, 08 (live data fetched at runtime) | all upstream artifacts (for cross-checks) | `./eec/09-optimization/output.json` |

A "read" means: skill MUST `Read` the upstream `output.json` and validate it against the upstream schema before starting.

---

## 3. Cross-module field references

Every cross-module reference uses an **ID**, never a duplicated value. Renames in upstream propagate via ID lookup.

| Field in downstream | References | Notes |
|---|---|---|
| `02.skus[].target_audience_ids[]` | `01.audience_profiles[].id` | many-to-many: one SKU may serve N audience profiles (minItems 1) |
| `04.assets[].sku_id` | `02.skus[].id` | optional (some assets are brand-level) |
| `04.assets[].audience_ids[]` | `01.audience_profiles[].id` | optional, many-to-many; empty/omitted = brand-level asset |
| `04.copy_blocks[].sku_id` | `02.skus[].id` | optional |
| `04.copy_blocks[].audience_ids[]` | `01.audience_profiles[].id` | optional, many-to-many |
| `05.routes[].sku_ids[]` | `02.skus[].id` | product detail / collection routes |
| `05.routes[].copy_block_ids[]` | `04.copy_blocks[].id` | which copy blocks render on which routes |
| `05.routes[].asset_ids[]` | `04.assets[].id` | which assets render on which routes |
| `05.cms_handles[].sku_id` | `02.skus[].id` | CMS-side SKU mirror |
| `06.events_spec[].params.sample` may include | `02.skus[].id` | e.g. `view_item.item_id` sample |
| `07a.keyword_opportunities[].suggested_target_route` | `05.routes[].path` | informs 07b clustering |
| `07b.keyword_clusters[].audience_id` | `01.audience_profiles[].id` | content targeting |
| `07b.keyword_clusters[].linked_sku_ids[]` | `02.skus[].id` | which SKUs to cross-sell |
| `07b.drafts[].cta_sku_id` | `02.skus[].id` | bottom-of-page CTA |
| `08.audiences[].source_audience_id` | `01.audience_profiles[].id` | LAL / interest seeds |
| `08.audiences[].source_event_name` | `06.events_spec[].name` | retargeting source |
| `08.creative_pairing[].asset_ids[]` | `04.assets[].id` | which creatives to use |
| `08.creative_pairing[].copy_block_id` | `04.copy_blocks[].id` | which copy to pair |
| `08.account_structure[].campaigns[].landing_route` | `05.routes[].path` | where the ad clicks go |
| `08.account_structure[].campaigns[].optimization_event` | `06.events_spec[].name` | which conversion to optimize for |
| `08.utm_taxonomy_applied.examples[]` MUST conform to | `06.utm_taxonomy.*_format` | format compliance |
| `08.destinations_required[]` MUST be a subset of | `06.destinations[].id` | destinations must exist |
| `09.data_pull.metrics_by_dim[].rows[].key` | `08.account_structure[].campaigns[].id`, `08.audiences[].id`, `08.creative_pairing[].id`, `02.skus[].id`, `05.routes[].path` | depending on dimension |
| `09.decisions[].target` | same as above | what's being changed |
| `09.data_sources[]` | external APIs (Meta / GA4 / TikTok / Google Ads / Shopify Admin / etc.) | each connector specifies platform, auth method, env vars, metrics & dimensions pulled, status |
| `06.site_build_writeback.target_repo_path` | `05.repo_path` | closes the loop: 06 writes GTM ID into 05's repo files listed in `05.analytics_endpoints.rebuild_protocol.writeback_target_files`, then runs `rebuild_command` |
| `06.site_build_writeback.files_modified[].path` | MUST be in `05.analytics_endpoints.rebuild_protocol.writeback_target_files` | guard rail: 06 cannot edit arbitrary files in 05's repo |

---

## 4. Phase 2 hook summary (20 hooks — abridged from `phase2-hooks.md`)

### To unlock `eec-10-email-crm`

| Hook | Where it lives in MVP schema |
|---|---|
| H1 | `02.skus[].email_friendly_name` |
| H2 | `02.skus[].subscription_eligible` |
| H8 | `03.email_brand_kit.*` (full block) |
| H9 | `06.events_spec[]` contains `email_signup` |
| H10 | `06.email_consent_event` block |
| H15 | `06.events_spec[]` contains `cart_abandoned` |
| H16 | `06.events_spec[]` contains `email_unsubscribed` |
| H18 | `06.purchase_event_full_spec.must_emit_fields` contains `is_first_purchase` |
| H20 | `03.welcome_offer` block |

### To unlock `eec-11-fulfillment`

| Hook | Where it lives in MVP schema |
|---|---|
| H3 | `02.skus[].cost` |
| H4 | `02.skus[].moq` |
| H5 | `02.skus[].lead_time_days` |
| H6 | `02.skus[].supplier_id` |
| H7 | `02.skus[].supplier_country` |
| H11 | `06.purchase_event_full_spec.must_emit_fields` contains `order_id`, `items`, `shipping_address`, `customer_email_hash`, `total` |
| H12 | `02.skus[].return_policy_days` |
| H13 | `02.skus[].restricted_geo[]` (also informs 08 geo exclusion) |
| H14 | `02.skus[].low_stock_threshold` |
| H17 | `06.events_spec[]` contains `return_initiated`, `refund`, `order_shipped`, `order_delivered`, `order_canceled` |
| H19 | `03.cs_tone` block |

### Locked technical decisions

- **PII hashing**: `06.pii_hash_algorithm` is locked to `"sha256"` (SHA-256, lowercase hex, after trim+lowercase normalization for emails per platform spec)
- **GTM closing-the-loop**: 05 declares `analytics_endpoints.rebuild_protocol` (which files 06 may write, what command rebuilds the site). 06 records writeback in `site_build_writeback`. After 06 writes the GTM ID, the rebuild_command MUST run.
- **Audience binding**: many-to-many at 02 (SKU) and 04 (asset/copy) levels; singular at 08 (paid-ad) level
- **Currency**: per-SKU (each `Money` carries its own ISO-4217); no single store-wide lock
- **Market scope**: MVP single market (`01.niche.region` is a string)

If MVP runs and any required hook is absent → Phase 2 launch is blocked until upstream is re-run. **Carrying them costs ~0; skipping them costs full retrofit.**

---

## 5. Common types (defined in `_common.schema.json`)

| Type | Purpose | Schema ref |
|---|---|---|
| `Confidence` | high / medium / low | `_common#/$defs/Confidence` |
| `Source` | url + accessed_at + type | `_common#/$defs/Source` |
| `SourcedClaim` | sources[] + confidence + verification_path | `_common#/$defs/SourcedClaim` |
| `Money` | amount + ISO-4217 currency | `_common#/$defs/Money` |
| `LanguageCode` | BCP-47 | `_common#/$defs/LanguageCode` |
| `Meta` | generated_at + skill_version + schema_version | `_common#/$defs/Meta` |
| `AudienceProfile` | one user segment, defined once in 01 and referenced everywhere | `_common#/$defs/AudienceProfile` |

---

## 6. Validation rules (all skills must enforce)

1. **Self-validation gate**: every skill validates its own `output.json` against its own schema before reporting success.
2. **Upstream validation gate**: before reading an upstream artifact, validate it against the upstream schema.
3. **ID format check**: every ID matches its declared `pattern` (e.g. `sku_001`, `audience_001`).
4. **Reference integrity**: every cross-module ID reference resolves (the referenced ID exists in the upstream).
5. **Phase 2 hook presence**: every `phase2_hook:` field is present, even if value is `"TBD"` / `0` placeholder.
6. **Confidence-source coupling**: any `claim_meta` block has `sources.length >= 1` AND `confidence ∈ {high, medium, low}`.
7. **No silent overwrite**: if `output.json` already exists, prompt user (see `conventions.md` §11).

A reference validator script (Phase 4 of master plan) will walk the entire `./eec/` tree and check 1–7 in one pass.

---

## 7. What's intentionally NOT in this contract

- **Pixel/account credentials**: stay in env vars / 1Password, never in JSON
- **Real customer data**: never written to `output.json` (use hashes in `purchase_event_full_spec` only)
- **Skill internal state**: skills may use scratch files in `./eec/<NN>-*/raw/` — not part of the contract
- **Phase 2 skills' own outputs**: 10/11 will define their own `output.schema.json` when built — they only consume from MVP, never write back into MVP artifacts

---

## 8. Resolved design decisions (Phase 1 sign-off)

| # | Question | Decision | Schema impact |
|---|---|---|---|
| Q1 | Audience binding cardinality | **Many-to-many** at SKU and asset/copy levels | `02.skus[].target_audience_ids[]` (was singular); `04.assets[].audience_ids[]`, `04.copy_blocks[].audience_ids[]` (was singular) |
| Q2 | Currency model | **Per-SKU** | No change — `Money` already carries currency per instance |
| Q3 | Market scope | **Single market in MVP** | No change — `01.niche.region` stays string |
| Q4 | SKU variant attrs | **Open dict** (no locked keys) | No change — `variants[].attrs: { [k: string]: string }` |
| Q5 | 09 live data shape | **Must be specified** | Added `09.data_sources[]` block: platform enum, auth_method, required_env_vars, metrics_pulled, dimensions_pulled, pull_frequency, last_pulled_at, status, error_detail, rows_fetched |
| Q6 | 07a → 07b keyword feed | **Optional** (not hard-required) | No change — `07b` does not require `07a` artifact |
| Q7 | GTM closing-the-loop | **Required** | Added `05.analytics_endpoints.rebuild_protocol` (rebuild_command, writeback_target_files, post_rebuild_validation) AND `06.site_build_writeback` (target_repo_path, files_modified, rebuild_required, rebuild_executed, post_rebuild_validation_status) |
| Q8 | PII hash algorithm | **SHA-256 locked** | Added `06.pii_hash_algorithm` with `const: "sha256"` |
| Q9 | Additional Phase 2 hooks | **+9 hooks (H12–H20)** | See below |

### New Phase 2 hooks added (H12–H20)

| Hook | Field | Why it must exist in MVP |
|---|---|---|
| H12 | `02.skus[].return_policy_days` | 11 returns workflow + customer FAQ |
| H13 | `02.skus[].restricted_geo[]` | 11 shipping eligibility + 08 paid-ad geo exclusion |
| H14 | `02.skus[].low_stock_threshold` | 11 replenishment alerts |
| H15 | `06.events_spec[]` requires `cart_abandoned` | 10 abandoned cart flow |
| H16 | `06.events_spec[]` requires `email_unsubscribed` | 10 list hygiene |
| H17 | `06.events_spec[]` requires `return_initiated`, `refund`, `order_shipped`, `order_delivered`, `order_canceled` | 11 full order lifecycle |
| H18 | `06.purchase_event_full_spec.must_emit_fields` adds `is_first_purchase` | 10 welcome vs returning customer fork |
| H19 | `03.cs_tone` block | 11 customer-service auto-replies (tone distinct from marketing) |
| H20 | `03.welcome_offer` block | 10 welcome series anchor incentive |

Total Phase 2 hooks: **20** (H1–H20). All enforced in MVP schemas.

---

## 9. File map (Phase 1 deliverable)

```
eec_skills/shared/
├── conventions.md              # universal rules
├── phase2-hooks.md             # reserved fields for 10/11
├── data-contracts.md           # ← THIS FILE (the contract overview)
└── schemas/
    ├── _common.schema.json
    ├── 01-research.schema.json
    ├── 02-product-selection.schema.json
    ├── 03-brand-identity.schema.json
    ├── 04-creative-factory.schema.json
    ├── 05-site-build.schema.json
    ├── 06-tracking.schema.json
    ├── 07a-tech-seo.schema.json
    ├── 07b-content-marketing.schema.json
    └── 09-optimization.schema.json
```
