# Module 3: AggregateRating 计算

## 目的

按 reviews[] 自动 rollup 到 aggregate_ratings[]，作为 PDP AggregateRating JSON-LD 的数据源。

## 算法

```
对每个 sku_id:
  rating_distribution = {
    1: count(rating == 1),
    2: count(rating == 2),
    3: count(rating == 3),
    4: count(rating == 4),
    5: count(rating == 5)
  }
  review_count = Σ rating_distribution.values()
  rating_average = Σ(k * rating_distribution[k]) / review_count
  保留 1 位小数: round(rating_average * 10) / 10
```

## Google 5-评论门槛

```
如果 review_count < 5:
  - aggregate_ratings 节点仍写入（用于站内显示）
  - 但 05 在 emit AggregateRating JSON-LD 时 必须跳过 该 SKU
  - 否则 Google 标记为 spammy review snippet
```

## 校验

```
Σ rating_distribution[1..5] == review_count
|computed_avg - rating_average| ≤ 0.05
```
