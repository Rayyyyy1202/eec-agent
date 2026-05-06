# Module 6: Build Plan (建站计划书)

## 角色

在 Module 1-5 落任何代码之前，**先产一份 `report.md`**。这是与用户对齐的产物，告诉用户：

- 上游 02/03/04 的哪些字段被消费了，哪些被丢弃了（=> 信息浪费 audit）
- 路由清单 + 每条路由的内容来源
- 模块缺口（"03 没产 founder → /team 路由空白"）
- 下次重跑 05 之前需要补什么

没有这份文档，Module 5 写完站，用户就发现"founder/about/blog 全没了"——已经晚了。

## 必产章节

```markdown
# 建站计划书 — {brand_name}

## 1. 上游消费 audit

| Skill | 字段 | 消费? | 落到哪里 |
|---|---|---|---|
| 02 | skus[].name | ✓ | /products/[slug] hero |
| 02 | skus[].subscriptionEligible | ✗ 未消费 | 应在 PDP 加 Subscribe & save UI |
| 03 | tagline | ✓ | / hero h1 |
| 03 | mission | ✗ 未消费 | 应在 /about 渲染 |
| 03 | story_short | ✗ 未消费 | 应在 /about 渲染 |
| 03 | tone.do_phrases / dont_phrases | ✓ 间接 | 指导文案撰写 |
| 03 | email_brand_kit | ✗ 不消费 | Phase 2 邮件用 |
| 04 | assets[] | ✓ | 路由的 asset_ids[] 池 |
| 04 | copy_blocks[] | ✓ | 路由的 copy_block_ids[] 池 |
| 07b | content_calendar[] | ✗/✓ | 若 07b 已跑 → /blog；否则记 phase2_pending |

## 2. 路由清单 + 数据流

| Path | 内容来源（skill.field） | 缺数据时降级 |
|---|---|---|

## 3. 缺口报告

> 用户必须看到这份缺口表。修了再下一步。

- [ ] 03 schema 缺 `founders[]` → /team 走空态或不上路由
- [ ] 03 schema 缺 `values[]` → /sustainability 走空态
- [ ] 02 schema 缺 `certifications[]` → 信任徽章带不出
- [ ] ...

## 4. 路由覆盖率自检

- 必备 (10): / + /about + /products/[slug] × N + /collections/* + /cart + /checkout + /help + /pages/privacy + /pages/terms + /pages/shipping-returns
- 内容丰富版 (+/团队 + /可持续 + /press + /blog + /blog/[slug] + /compare + /reviews + /contact)
- 当前覆盖: <X / Y>

## 5. 下次跑 05 前的 prerequisites

- [ ] 03 重跑（补 founders/values/sustainability/...）
- [ ] 07b 跑过（提供 blog 内容）
- [ ] 04b 跑过（提供 reviews）
- [ ] 03b 跑过（legal pack）
```

## 执行流

```
读上游 → 比对 SKILL.md 的"必备路由清单" → 输出 audit 表 → 落 report.md →
向用户展示前 3 条最大缺口 → Y/n 继续 → 进入 Module 1
```

## 自检门

- `report.md` 必须包含 §3 缺口报告，**长度 ≥ 1**（如果上游全消费了，最起码列"今天没缺"）
- §1 audit 表必须把 02/03/04 的所有顶层字段列全（缺一报错）
- §4 覆盖率自检数字 = 实际 routes[].length（不能虚标）
