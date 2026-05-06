# Module 04 — Brand Book + Email Brand Kit (H8)

## 目标
- 把 Module 1-3 全部汇总成 `brand-book.md`（设计师交付物）
- 填 H8 `email_brand_kit`（Phase 2 邮件直接用）

## 输入
- Module 01-03 全部产物

## 步骤
### A. brand-book.md 结构
```markdown
# <Brand Name>

## 1. Identity
- Tagline: ...
- Mission: ...
- Story: ...

## 2. Voice & Tone
### Marketing
- Voice descriptors / Persona / Do / Dont
### Customer Service (Phase 2 reserved)
- Voice descriptors / Do / Dont / Escalation / Signoff

## 3. Visual System
### Palette (with hex chips)
### Typography (with sample lines)
### Logo Brief (mark concept + wordmark + motif)
### Imagery (mood + lighting + do/dont + 3+ refs)
### Motion (easing / duration / usage)

## 4. Application Examples
- Product card
- Hero banner
- Email header / footer
- Social avatar / cover
- Packaging insert

## 5. Welcome Offer (Phase 2 reserved)
- Type / Value / Expiry / Redemption rules

## 6. Reference Files
- ./eec/03-brand-identity/output.json
```

### B. email_brand_kit (H8)
五件套全部必填（即便 Phase 2 邮件还没建）：
- `header_color`: 邮件 header 背景 hex（通常 = palette.primary 或 neutrals[1]）
- `footer_layout`: 描述 footer 排版（"3 列：Brand / Links / Social"）
- `signature_block`: 邮件签名块文本模板
- `tone_for_email`: 一句话描述（"略比 marketing tone 更短，每段 ≤ 2 句"）
- `preferred_subject_line_pattern`: 模板（"{first_name}, {benefit} →"）

## 输出
```jsonc
{
  "email_brand_kit": {
    "header_color": "#1a3a5c",
    "footer_layout": "3 columns: brand / links / social",
    "signature_block": "Always here,\n— The <Brand> Team",
    "tone_for_email": "Marketing tone, tighter — max 2 sentences per paragraph.",
    "preferred_subject_line_pattern": "{first_name}, {benefit} →"
  },
  "brand_book_path": "./eec/03-brand-identity/brand-book.md"
}
```

## 校验
- email_brand_kit 5 个 required 字段全填
- header_color 是 hex
- brand_book_path 物理存在

## 并行
- email_brand_kit 5 字段决策并行
- brand-book.md 6 个 section 并行起草
