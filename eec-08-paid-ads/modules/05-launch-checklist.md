# Module 05 — Launch Checklist

## 目标
pre-flight 校验：pixel firing / consent default denied / landing 200 / GTM 真值 / restricted_geo 已 exclude / quality controls。

## 必有 checklist 项
| Item | 验证方式 | status pass 标准 |
|---|---|---|
| Pixel firing (per platform) | Meta Pixel Helper / TikTok Pixel Helper / GA4 DebugView | events 在 dev 模式实测可见 |
| Consent default denied | 加载首页未点同意时 ad_storage = denied | gtag consent 状态读出 denied |
| Landing route HTTP 200 | curl -I 每条 campaign.landing_route | 全 200 |
| GTM container live | curl 首页 grep GTM-XXXX | 出现 |
| restricted_geo excluded (per SKU) | 检查每条 campaign placement settings | 无 SKU.restricted_geo[] 国家 |
| destinations_required all configured | 06.destinations[] 中目标 type container_id 非 TBD | 全 configured |
| optimization_event firing | DebugView 可见 | 出现 ≥1 次 |
| Creative quality (per pairing) | 平台广告 preview | 通过 |
| Budget cap set | each campaign daily_budget > 0 | true |
| UTM 命中格式 | 例 link 解析 | 命中 06 pattern |

## 步骤
1. 跑每项 → 记 evidence (URL / screenshot path / API response 摘要)
2. critical 项 (pixel, landing, consent) fail → SKILL.md 交互点 2 STOP
3. 非 critical fail → 标 fail 但允许放行（输出会显示）

## 输出
```jsonc
{
  "destinations_required": ["dest_001", "dest_002", "dest_003"],
  "pixels_required": ["dest_002", "dest_003"],
  "launch_checklist": [
    { "item": "Meta Pixel firing on view_item", "status": "pass", "evidence": "DebugView screenshot ./eec/08-paid-ads/evidence/meta_pixel.png" },
    { "item": "Consent default denied verified", "status": "pass", "evidence": "gtag get consent → analytics_storage:denied" },
    { "item": "Landing /products/steel-mug returns 200", "status": "pass", "evidence": "HTTP/2 200" },
    { "item": "GTM-ABC1234 loaded on /", "status": "pass", "evidence": "curl grep matched" },
    { "item": "No SKU restricted_geo countries in any campaign placement", "status": "pass", "evidence": "see report appendix" }
  ]
}
```

## 校验
- launch_checklist 至少 1 项
- critical 三项 (pixel firing, consent default denied, landing 200) status=pass 才允许 SKILL.md ✓
- destinations_required 全部 ∈ 06.destinations[].id
