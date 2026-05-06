# Module 4: UGC + case studies + press widget

## UGC

```
consent_status:
  - granted: 公开渲染
  - pending: 不渲染，等用户回复
  - expired: 不渲染，标 audit log

asset_path:
  - 真实图片落 /public/ugc/<id>.jpg
  - 占位阶段 asset_path 可省略，05 渲染 placeholder
```

## case_studies

```
小数量 (0-3 个) 即可。重质不重量。
每条至少 1 个 metric_highlight (e.g. label='Tickets resolved without escalation', value='90%')
body_md_path 可选；缺失则 case 仅以 summary 渲染
```

## press_widget

```
display_mode:
  - logos_only: 5-7 个 logo 横排，无 quote (默认)
  - logos_with_quote: 主 logo 配 1 句 pull_quote
  - carousel: 全部进 carousel，含 quote

logos[]:
  - outlet 必须能在 03.press_mentions[].outlet 找到
  - logo_asset_id 引 04.assets[]（若 04 已 run）
  - 缺 logo_asset 时 05 渲染纯文本 outlet 名
```

## 校验

```
press_widget.logos[].outlet ⊆ 03.press_mentions[].outlet
ugc_assets[].consent_status ∈ {granted, pending, expired}
case_studies[].linked_sku_ids[] ⊆ 02.skus[].id
```
