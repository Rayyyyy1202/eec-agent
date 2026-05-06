# Module 01 — Naming

## 目标
3-5 候选 → 域名 / 商标快查不冲突 → 选 1。

## 命名风格（用户 $ARGUMENTS 指定 or 自动推荐）
- **abstract**: 造词 (Glossier, Allbirds)。可注册率高，认知成本高
- **evocative**: 唤起情感 (Casper, Warby Parker)。平衡
- **descriptive**: 直说品类 (BlueApron, MeUndies)。SEO 友好，差异化弱

## 候选生成
1. 从 02.skus[].usp + 03.brand mood 抽 5-10 个语根
2. 每根扩 3-5 个组合（前缀 / 后缀 / 拼合 / 别语）
3. 筛掉：
   - 跟 01.competitors[].brand 同义 / 同根
   - 含触发负面联想（俚语含义）
   - 不能纯英文打字读出来（除非目标市场不用英文）

## 域名 + 商标快查（每候选并行）
- **Domain**: WHOIS / Namecheap API / 直接 fetch `<name>.com` (200 / 抢注页判断)
- **USPTO TESS**: `https://tmsearch.uspto.gov/`
- **EUIPO**: `https://www.tmdn.org/tmview/`
- 全冲突 → 标该候选 BLOCKED

## 选定规则
1. 顺位选第一个所有快查 PASS 的
2. 若 top 5 全 BLOCKED → SKILL.md 交互点：暂停问换风格 / 用户给词
3. 选定后：
   - `brand_handle` = 小写 + 去元音可选的简称（用作 IG/TikTok handle）
   - `tagline` ≤ 8 词
   - `mission` 一句话
   - `story_short` ≤ 120 字

## 并行
- 每候选的 (domain + USPTO + EUIPO) 三路并行

## 输出（写到 output.json）
```jsonc
{
  "brand_name": "...",
  "brand_handle": "...",
  "tagline": "...",
  "mission": "...",
  "story_short": "...",
  "naming": {
    "style": "abstract|evocative|descriptive",
    "candidates_evaluated": [
      { "name": "...", "domain_status": "available|taken|premium", "tm_status": "clear|conflict|pending" }
    ]
  }
}
```

## 校验
- 选定 brand_name 的 domain_status ∈ {available, premium}
- tm_status == "clear"（pending 也不行）
