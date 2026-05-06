# Module 02 — Audiences

## 目标
设计 lookalike / interest / retargeting / custom_list 受众，每条 ref 真实 source（01 audience 或 06 event）。

## 类型 × 来源
| Type | source | 适用 |
|---|---|---|
| lookalike | source_audience_id ∈ 01 (然后上传种子 list 到平台) | prospecting |
| interest | 平台原生 interest 关键词 | broad TOFU |
| broad | 不设 interest，Smart+ / Advantage+ 自动 | 算法时代默认 |
| retargeting | source_event_name ∈ 06.events_spec ('view_item', 'add_to_cart', 'begin_checkout') | BOFU |
| custom_list | 上传 SHA-256 hashed email | crm-based |
| engaged_users | platform 自有 engagement signal | 中度 |

## 步骤
### A. Lookalike
1. 选 01.audience_profiles 中 LTV 预期最高的 1-2 个
2. 给 size_band: narrow (1%) / medium (3-5%) / broad (10%+)
3. definition：自然语言描述种子 + lookalike %

### B. Interest
1. 取 01.audience_profiles[].psychographics 关键词
2. 翻译为平台 interest（Meta 有 detailed targeting 库）
3. size_band 估

### C. Retargeting
1. source_event_name 选 06.events_spec 中已 fire 的事件
2. 推荐 retargeting funnel：
   - view_item (last 30d) → BOFU prospecting
   - add_to_cart (last 14d) → mid retargeting
   - begin_checkout (last 7d) → 紧贴弃单
3. 排除已 purchase 的（exclude `purchase` last 60d）

### D. Custom list
- 上传必须 SHA-256 hash（与 06.pii_hash_algorithm 对齐）

## 并行
- 每平台的受众设计并行

## 输出
```jsonc
{
  "audiences": [
    {
      "id": "paud_001",
      "platform": "meta",
      "type": "lookalike",
      "definition": "Lookalike 1% from purchasers (last 90d)",
      "size_band": "narrow",
      "source_audience_id": "audience_001"
    },
    {
      "id": "paud_002",
      "platform": "meta",
      "type": "retargeting",
      "definition": "Users who view_item last 30d, exclude purchasers last 60d",
      "size_band": "medium",
      "source_event_name": "view_item"
    }
  ]
}
```

## 校验
- ≥ 1 audience
- 每 id `^paud_[0-9]{3}$`
- source_audience_id (若有) ∈ 01.audience_profiles
- source_event_name (若有) ∈ 06.events_spec[].name
