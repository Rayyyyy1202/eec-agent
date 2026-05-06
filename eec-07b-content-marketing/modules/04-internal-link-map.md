# Module 04 — Internal Link Map + Distribution Plan

## A. Internal Link Map

### 目标
建有向图：每条 content 至少 2 条内链；产品页有反向内链（trust signal）。

### 步骤
1. 遍历 drafts[].internal_links[]
2. 对每条边记 source / target / anchor
3. 检测 orphans：没有任何 inbound link 的 content
4. 检测过深：从 / 到任意 content 的最短路径 > 3 → 警告

### 例
```jsonc
{
  "internal_link_map": [
    { "source": "content_001", "target": "/products/steel-travel-mug", "anchor": "shop our 16oz mug" },
    { "source": "content_001", "target": "content_004", "anchor": "see how we test insulation" },
    { "source": "content_004", "target": "/products/glass-bottle", "anchor": "the glass alternative" }
  ]
}
```

## B. Distribution Plan

### 渠道
- `email`：纳入 newsletter (Phase 2 邮件 anchor)
- `social_organic`：发 IG / TikTok / Pinterest
- `newsletter`：合作站 newsletter swap
- `syndication`：Medium/LinkedIn re-publish (canonical 指回主站)
- `outreach`：联系 niche 博主交换链接
- `paid_amplification`：08 投流推广

### 步骤
1. 对每条 content：选 1-3 个 channel
2. scheduled_date = content.scheduled_date 或之后
3. 高价值长 form (guide / comparison) 必须 ≥ 2 channels

### 输出
```jsonc
{
  "distribution_plan": [
    { "content_id": "content_001", "channel": "email", "scheduled_date": "2026-04-29" },
    { "content_id": "content_001", "channel": "social_organic", "scheduled_date": "2026-04-30" }
  ]
}
```

## 校验
- 每个 distribution_plan.content_id ∈ content_calendar[]
- 0 orphan content（每条至少 1 条 inbound）
- 至少 1 条 distribution 是 email channel（Phase 2 邮件准备）
