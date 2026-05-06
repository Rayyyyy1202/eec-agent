# Module 04 — Video Briefs

## 目标
为关键 SKU × channel 出可执行视频脚本（hook + scene 表 + VO + on-screen text + CTA）。

## 覆盖目标
- 至少 1 条 9:16（TikTok / Reels / Shorts）
- 至少 1 条 1:1（Meta feed）
- 主推 SKU 双语各 1 条

## 步骤
1. **3 秒 hook**（决定 70% 完播率）：从 01.pain_points 主痛点切入 OR 反认知陈述
2. **4-6 个 scene**：
   - second_start：节拍点
   - shot：镜头描述
   - vo：voice-over（可选）
   - on_screen_text：大字屏幕文字（可选）
3. **CTA**：≤8 字
4. **duration_s**：TikTok 7-15s 高效；Meta 15-30s；YouTube Shorts ≤60s

## 模板
```
0s   Hook: pain question / surprise stat
1-3s Problem visualization
3-7s Product reveal + USP
7-12s Demo / before-after
12-15s Social proof (stat / testimonial)
15s  CTA
```

## 落盘
- `./eec/04-creative-factory/assets/video/<video_id>.json`

## 并行
- 不同 video 的 scene 拆解并行

## 输出（写到 video_briefs[]）
```jsonc
{
  "id": "video_001",
  "hook": "Tired of <pain>?",
  "scenes": [
    { "second_start": 0, "shot": "Close-up of <pain scene>", "vo": "..." },
    { "second_start": 3, "shot": "Product reveal", "on_screen_text": "<USP>" },
    ...
  ],
  "cta": "Get yours today",
  "duration_s": 15,
  "channel": "tiktok",
  "language": "en",
  "sku_id": "sku_001"
}
```

## 校验
- duration_s = 最后 scene.second_start + 1（粗校验）
- 每个 video 至少 1 条 scene
- 9:16 channel 至少 1 条
