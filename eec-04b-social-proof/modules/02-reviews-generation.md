# Module 2: 评论生成

## 目的

为每个 SKU 生成符合品牌 tone 的评论数据，覆盖 verified / unverified、photo / text、merchant_response 几种形态。

## 数量分布

```
默认 review_count = 12
分布:
  - 主推 SKU (02.primary_sku_id): 60%
  - 其余 SKU 平均分剩余 40%

每 SKU 内部 rating 分布 (近似真实电商):
  5★: 60%
  4★: 22%
  3★: 12%
  2★:  4%
  1★:  2%
```

## tone

读 `03.tone.descriptors` 与 `03.tone.do_phrases`：
- 评论体现使用场景，不当广告语
- 1-2 处具体数字（"3 周后"，"800 sq ft 公寓"）
- 30% 评论包含 1-2 个无伤大雅的小抱怨（"app 第一次连接花了 5 分钟"），可信度↑

## verified_purchase

- 70% true（self-hosted 阶段全部假装 verified 是不诚实的）
- 30% false 标 unverified

## merchant_response

- 1★/2★ 评论 100% 必须有 merchant_response（CS 礼仪 + SEO 信号）
- 3★ 评论 30% 有
- 4★/5★ 不必

## PII 红线

```
author_name:
  ✓ "Kim L."
  ✓ "Marcus T."
  ✗ "Kim Lee"
  ✗ "kim.lee@gmail.com"
  ✗ "Kim L. (415-555-0xxx)"

author_location:
  ✓ "Brooklyn, NY"
  ✓ "Austin, TX"
  ✗ "742 Evergreen Terrace, Springfield"
```

## synthetic 必须 true

MVP 阶段所有手写评论 `synthetic: true`。切 provider 后由 provider SDK 改为 false。
