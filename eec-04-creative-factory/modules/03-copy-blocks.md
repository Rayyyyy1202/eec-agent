# Module 03 — Copy Blocks

## 目标
覆盖 11 个 purpose × N 渠道 × M 语言，每条满足平台字符约束 + 03.tone do/dont。

## 11 个 purpose
- product_card / hero_banner / ad_primary / ad_headline / email_subject / email_body / blog_intro / cta / feature_block / faq / review_response

## 平台约束（硬校验）
| Channel × Purpose | 字符上限 |
|---|---|
| meta × ad_primary | 125 (推荐) |
| meta × ad_headline | 40 |
| google × ad_headline | 30 (单条；可多条 30) |
| google × ad_primary | 90 |
| tiktok × ad_primary | 2200 (caption) |
| email × email_subject | 50 (移动端不截断) |
| pinterest × ad_headline | 100 |
| any × cta | 25 |

## 步骤
1. 对每个目标 (purpose × channel × lang)：
   - 取 02.skus[].usp 作核心承诺
   - 套 03.tone（do_phrases 拉风格，dont_phrases 拉护栏）
   - 生 headline (主) / subhead (可选) / body (可选) / cta (有动作必填)
2. 字符计数 → 比对上限 → 设 `platform_constraints_met`
3. 多语言：先出主语言，再出 en；其他用 LLM 翻译 + 平台约束二次校验

## 落盘
- `./eec/04-creative-factory/assets/copy/<copy_id>.md` 一条一文件
- 内含 frontmatter (id / purpose / channel / lang / sku_id) + 正文

## 并行
- 同 purpose 的多语言版本并行
- 不同 purpose 独立可并行

## 输出（写到 copy_blocks[]）
```jsonc
{
  "id": "copy_001",
  "purpose": "ad_primary",
  "channel": "meta",
  "headline": "...",
  "body": "...",
  "cta": "Shop now",
  "language": "en",
  "sku_id": "sku_001",
  "audience_ids": ["audience_001"],
  "char_count": 118,
  "platform_constraints_met": true
}
```

## 校验
- 每条 char_count 准确
- platform_constraints_met 真校验过
- 全部至少 1 条 cta purpose 的 copy_block
