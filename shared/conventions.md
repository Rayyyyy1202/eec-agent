# EEC Skills — Shared Conventions

Universal rules every `eec-NN-*` skill follows. Skills MUST conform; they are NOT free to invent their own paths/naming/formats.

## 1. Output paths

Every skill writes its artifact to the **user's current working directory** under:

```
./eec/<NN>-<slug>/
├── output.json     # machine-readable, MUST validate against output.schema.json
├── report.md       # human-readable summary
└── raw/            # optional: source dumps, screenshots, .csv, html
```

- `<NN>` = zero-padded module number: `01`, `02`, ..., `07a`, `07b`, ..., `09`
- `<slug>` = skill name suffix: `research`, `product-selection`, `brand-identity`, `creative-factory`, `site-build`, `tracking`, `tech-seo`, `content-marketing`, `paid-ads`, `optimization`

## 2. Reading upstream artifacts

A downstream skill MUST:

1. **Look for required upstream files** at `./eec/<NN>-*/output.json` (see contract per skill in `data-contracts.md`)
2. **Validate** the upstream JSON against that skill's `output.schema.json` before consuming it
3. **If missing or invalid**: STOP and tell the user which upstream skill to run first. NEVER fabricate or estimate the missing data.

```
# Pseudocode every downstream skill follows
required = ["./eec/01-research/output.json", "./eec/02-product-selection/output.json"]
for path in required:
    if not exists(path): STOP("Run upstream skill: " + skill_for(path))
    if not validates(path): STOP("Upstream artifact invalid: " + path)
```

## 3. Language

| What | Language |
|---|---|
| User-facing chat | Mirror the user (CN → CN, EN → EN) |
| `report.md` | Mirror the user |
| External search queries | English (broader source coverage) |
| `output.json` field VALUES | English for international research data; user's language for brand copy / on-site content |

Brand copy and on-site content carry an explicit `language` field per item.

## 4. Confidence labeling

Every claim derived from external data carries a `confidence` field:

| Level | Meaning |
|---|---|
| `high` | 2+ independent sources agree |
| `medium` | 1 reliable source, OR multiple sources partially agree |
| `low` | Single weak source, OR estimate / extrapolation |

`low`-confidence claims MUST also include a `verification_path` describing how to upgrade them.

## 5. Source citation

Every external claim carries a `sources[]` array. Each entry conforms to `_common#/$defs/Source`:

```json
{
  "url": "https://example.com/...",
  "accessed_at": "2026-04-21",
  "type": "web"
}
```

Allowed `type` values: `web | trends | social | competitor | gov | tool | internal`.

## 6. Schema validation gate

Each skill's final step MUST validate its `output.json` against its own `output.schema.json`. Validation is non-optional:

- Pass → report success + summary to user
- Fail → fix the artifact, do NOT silently mark the skill complete

Skills SHOULD use `ajv` (Node) or `jsonschema` (Python) — installed lazily via `npx`/`uvx` when needed.

## 7. Phase 2 hook fields

Fields whose `description` starts with `phase2_hook:` are MANDATORY in MVP — even though no MVP skill consumes them.

See `phase2-hooks.md` for the full list and ownership table. Skills MAY emit placeholder values (e.g. `supplier_id: "TBD"`) when real data is not yet available, but the field MUST be present so downstream Phase 2 skills can detect "missing" vs "absent."

## 8. Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Skill name | `eec-NN-<slug>` | `eec-02-product-selection` |
| Skill ID prefix | First letters of slug | `sku_001`, `audience_001` |
| Cross-module IDs | `<thing>_<3-digit zero-padded>` | `sku_001`, `asset_042`, `campaign_007` |
| Field names | `snake_case` | `lead_time_days` |
| Enum values | `lower_snake` | `pricing_strategy.mode = "premium"` |
| File names | `kebab-case` | `01-market-trends.md` |

ID stability: Once a skill assigns an ID, downstream skills reference that ID. Never renumber across runs in the same project.

## 9. Currency, time, units

| Type | Format | Example |
|---|---|---|
| Money | `{ "amount": <number>, "currency": "<ISO-4217>" }` | `{ "amount": 29.9, "currency": "USD" }` |
| Date | `YYYY-MM-DD` (UTC) | `"2026-04-21"` |
| Datetime | ISO-8601 with timezone | `"2026-04-21T10:30:00Z"` |
| Duration | Suffix-encoded integer | `lead_time_days: 21`, `duration_s: 30` |
| Length | Suffix `_cm` / `_mm` | `weight_g: 350`, `dim_cm: { l: 12, w: 8, h: 4 }` |

## 10. Skill versioning

Each skill's `SKILL.md` frontmatter MUST include `version`. Each skill's output `meta.skill_version` MUST match. When schema changes:

- Backward-compatible (added optional field) → minor bump (`1.1.0` → `1.2.0`)
- Breaking (removed/renamed required field, changed enum) → major bump + add to `phase2-hooks.md` if the breakage affects Phase 2

## 11. State recovery

Skills are resumable. If `./eec/<NN>-<slug>/output.json` already exists when a skill runs:

```
1. Read existing output.json
2. Show user: "Existing artifact found from {meta.generated_at}. Re-run from scratch / Resume / Cancel?"
3. Default: Resume — only re-execute modules whose data is missing or stale
```

## 12. No silent overwrites

Skills MUST NOT overwrite a previous run's `output.json` without explicit user confirmation. Renamed to `output.{timestamp}.json.bak` on overwrite.

## 13. Existence assertions are MANDATORY

Every output field whose name ends in `_path`, `_url`, `_pdf`, `_md_path`, `_image_path`, `_video_url`, `_export_path`, or carries semantics of "this is a file/URL someone can open" MUST be filesystem-or-network-verified by the EMITTING skill before `output.json` is written.

```
# Pseudocode every skill runs as part of self-check
for field in output.walk(matching=[*_path, *_url, ...]):
    if field.starts_with("./") or field.starts_with("/"):
        assert os.path.exists(repo_root + field), f"{field} → file missing"
    elif field.starts_with("http"):
        assert head(field).status == 200, f"{field} → 404/timeout"
```

Missing/404 → exit non-zero; do NOT write `output.json`. (Past incident: 04 emitted 15 asset paths but `asset_briefs/` was empty; 11b emitted manual PDF paths that never existed; 04b cited press URLs absent from 03.)

## 14. Cross-skill referential integrity

When skill X consumes IDs/URLs/paths produced by skill Y, X MUST validate the references against Y's actual `output.json` before writing X's own output.

| Edge | What X checks against Y |
|---|---|
| 04b → 03 | every `press_widget[*].url` ∈ `03.press_mentions[*].url` |
| 06 ↔ 05 | `events_spec[*].name` ↔ actual `track(` callsites in `05.repo_path` (set parity, both directions) |
| 08 → 06 | `pixels_required[]` derived (NOT manually authored) from `unique(campaigns[*].destinations[])` |
| 13 → 02/03/04/etc. | every `entities[*].fields[*].from_json_path` resolves to a non-undefined value in the referenced upstream JSON |
| 05 → 02 | every product card `category`, copy, enum value sourced from 02/03; no hardcoded vertical (e.g. "robot_vacuum") |

Drift → STOP. Fix the upstream contract or rename, do not silently ship a broken reference.

## 15. Terminal-status terminology

Critical gates (rebuild verification, schema validation, accessibility audit, schema.org validation, data-source connectivity) MUST report one of:

- `pass` — checked and green
- `fail` — checked and red → STOP, do not emit output
- `blocked` — preconditions unmet (e.g. missing env var) + REQUIRED `blocking_reason` string → counted as failure by pipeline runner

The string `"skipped"` is FORBIDDEN as a terminal status for any critical gate. (Past incident: 06 reported `post_rebuild_validation_status:"skipped"` and the schema permitted it, so the rebuild gate was silently bypassed.)

## 16. Placeholder & secret denylist

Before writing `output.json` or any file in a `repo/` writeback target, every string field MUST be checked against this denylist:

| Pattern | Why |
|---|---|
| `dQw4w9WgXcQ`, `9bZkp7q19f0`, `kJQP7kiw5Fk`, `L_jWHffIx5E` | Rick Roll / Gangnam Style / Despacito / Bruno Mars — common placeholder YT IDs |
| `lorem ipsum`, `Lorem ipsum` | unrendered Lipsum |
| `example.com`, `example.org`, `localhost` (in production fields) | placeholder hostnames |
| `TODO`, `FIXME`, `STUB`, `TBD` (in user-visible copy fields) | unfilled author intent |
| `GTM-XXXXXXX`, `G-XXXXXXXXXX`, `UA-` | placeholder analytics IDs in production env |
| `sk_test_`, `pk_test_`, `whsec_`, `ghp_`, `xoxb-`, `AKIA[A-Z0-9]{16}` | leaked secrets in any committed file |

Match → STOP. The placeholder must either be filled with real data, or moved out of a user-visible / build-time field. Secret matches additionally trigger `git --no-pager log -- <file>` for impact assessment.

## 17. Spec ↔ code parity

Skills that emit a spec consumed by another skill's repo (06's events_spec, 04b's UGC carousel, 11b's chat widget) MUST run a parity check between the spec and actual callsites in the consumer repo:

```
declared = set(output.events_spec[*].name)
fired    = grep_callsites('track(', '05.repo_path/**/*.{ts,tsx}')
declared_not_fired = declared - fired
fired_not_declared = fired - declared
if declared_not_fired or fired_not_declared:
    fail with both sets listed
```

Both directions must be empty. (Past incident: 06 declared 8 events that 05 never fires, and 05 fires 6 events 06 never declared.)

## 18. No secrets in committed `repo/`

Any skill that materializes a `repo/` directory MUST:

1. Write a `.gitignore` that excludes `.env*` (allowlist `.env.example` only)
2. Run a secret-scan pass over the repo before declaring complete (regex set from §16 + entropy heuristic for any 32+ char hex/base64 string)
3. Never commit a `.env.local` / `.env.production` file with real values; use `.env.example` with placeholders only

(Past incident: 05 committed `.env.local` containing the real GTM container ID `GTM-PXFM7Q9`.)
