# 品牌识别 — {{brand_name}}

**handle**: `@{{brand_handle}}`　|　**生成**: {{meta.generated_at}}　|　Skill v{{meta.skill_version}}

---

## TL;DR
- **品牌名**: {{brand_name}}
- **Tagline**: "{{tagline}}"
- **Mission**: {{mission}}
- **Persona**: {{tone.persona_archetype}}
- **主色**: {{visual_system.palette.primary}}　·　{{visual_system.palette.secondary}}　·　{{visual_system.palette.accent}}

---

## 1. Naming
- **品牌名**: {{brand_name}}
- **handle 备用**: {{handle_alternates | join ", "}}
- **由来**: {{naming_rationale}}
- **域名候选**: {{domain_candidates | bullets}}

## 2. Story
- **Mission**: {{mission}}
- **Story (short)**: {{story_short}}
- **Origin one-liner**: {{origin_one_liner}}

## 3. Tone (品牌人设)

- **Persona archetype**: {{tone.persona_archetype}}
- **Voice descriptors** (≥3): {{tone.voice_descriptors | bullets}}

**Do 用语**:
{{tone.do_phrases | bullets}}

**Don't 用语**:
{{tone.dont_phrases | bullets}}

## 4. Visual System

### Palette
| 角色 | Hex | 用途 |
|---|---|---|
| Primary | {{visual_system.palette.primary}} | 品牌主色 |
| Secondary | {{visual_system.palette.secondary}} | 辅色 |
| Accent | {{visual_system.palette.accent}} | CTA/高亮 |
{{#each visual_system.palette.neutrals}}
| Neutral{{@index+1}} | {{this}} | 中性 |
{{/each}}

### Typography
- **Display**: {{visual_system.typography.display.family}} ({{visual_system.typography.display.weights | join "/"}})
- **Body**: {{visual_system.typography.body.family}} ({{visual_system.typography.body.weights | join "/"}})
- **配对理由**: {{visual_system.typography.pairing_rationale}}

### Logo
- **Mark concept**: {{visual_system.logo_brief.mark_concept}}
- **Wordmark treatment**: {{visual_system.logo_brief.wordmark_treatment}}
- **Motif**: {{visual_system.logo_brief.motif}}

---

## Phase 2 钩子（已填）

### H8 — email_brand_kit
- header_color: `{{email_brand_kit.header_color}}`
- footer_layout: {{email_brand_kit.footer_layout}}
- signature_block: `{{email_brand_kit.signature_block}}`
- tone_for_email: {{email_brand_kit.tone_for_email}}
- preferred_subject_line_pattern: `{{email_brand_kit.preferred_subject_line_pattern}}`

### H19 — cs_tone (客服)
- voice_descriptors: {{cs_tone.voice_descriptors | join ", "}}
- escalation_threshold: {{cs_tone.escalation_threshold}}
- default_signoff: "{{cs_tone.default_signoff}}"

### H20 — welcome_offer
- enabled: {{welcome_offer.enabled}}
- type: {{welcome_offer.type}}
- value: {{welcome_offer.value}} {{welcome_offer.currency}}
- one_time_use: {{welcome_offer.one_time_use}}
- expires_after_days: {{welcome_offer.expires_after_days}}

---

## 交付物
- `output.json` — machine-readable
- `report.md` — 本文档
- `brand-book.md` — 完整品牌手册（{{brand_book_path}}）

## 下一步
- `/eec-04-creative-factory` — 按 palette + tone 产出资产
- `/eec-05-site-build` — 用 visual_system 套站
