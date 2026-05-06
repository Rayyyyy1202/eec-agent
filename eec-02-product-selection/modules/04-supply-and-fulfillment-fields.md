# Module 04 — Supply & Fulfillment Fields (Phase 2 Hooks)

## 目标
把 H1, H2, H3, H4, H5, H6, H7, H12, H13, H14 共 10 个钩子全部填到每个 SKU。

## Phase 2 钩子清单
| Hook | 字段 | 默认 / 推断 |
|---|---|---|
| H3 | `cost` | 来自 Module 03 (Money) |
| H4 | `moq` | Alibaba 抓的最小数；不知 → 100 + confidence:low |
| H5 | `lead_time_days` | 抓供应商的 production + 估海运 / 空运；不知 → 21 + confidence:low |
| H6 | `supplier_id` | 拿到 → 真 ID；未定 → "TBD" |
| H7 | `supplier_country` | 大概率 "CN"；不知 → "TBD" |
| H1 | `email_friendly_name` | ≤30 字符的人话名（去 SEO 关键词堆叠） |
| H2 | `subscription_eligible` | 消耗品 → true；耐用品 → false |
| H12 | `return_policy_days` | 默认 30；定制品可 0 + 注明不可退 |
| H13 | `restricted_geo[]` | 默认 []；含锂电 / 含液体 / 含尖锐物 → 对应限运国家 |
| H14 | `low_stock_threshold` | 默认 10；快销品 50；高客单耐用品 5 |

## 步骤
1. 对每个 SKU 逐字段填，未知用 placeholder（"TBD" / 0）+ confidence:low
2. `restricted_geo` 推断规则：
   - 含锂电池 → 排除 ['BR', 'IN', 'RU', 'AE'] 中的航空管制国
   - 含液体 → 排除 ['SA', 'AE', 'KW']
   - 食品级 → 排除海关严管国（视品类）
   - 不确定 → 默认 [] + 注明 "phase2_pending"
3. `email_friendly_name` 规则：去掉品牌前缀、规格、修饰词；保留品类核心词

## 输出（嵌入每个 SKU）
```jsonc
{
  "cost": { "amount": 5.50, "currency": "USD" },
  "moq": 200,
  "lead_time_days": 14,
  "supplier_id": "supp_TBD",
  "supplier_country": "CN",
  "email_friendly_name": "Steel Travel Mug",
  "subscription_eligible": false,
  "return_policy_days": 30,
  "restricted_geo": [],
  "low_stock_threshold": 10
}
```

## 校验
- 10 个字段全部存在（即便 TBD / 0）
- restricted_geo[] 是数组（空 = 全球可发，不是 null）
- low_stock_threshold ≥ 0
- email_friendly_name.length ≤ 30
