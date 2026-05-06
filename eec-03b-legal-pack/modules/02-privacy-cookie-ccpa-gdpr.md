# Module 2: 隐私 / Cookie / CCPA / GDPR 写作

## 目标

并行产出 4 篇隐私系文档 body_md，共享同一 controller + tone。

## Cookie Policy

### 5 类标准 cookie 类别

| id | 默认状态 | 例 |
|---|---|---|
| strictly_necessary | granted | session, csrf, cart |
| functional | granted | language pref, currency |
| analytics | denied | GA4, GTM |
| marketing | denied | Meta pixel, TikTok pixel |
| personalization | denied | reco engine, A/B variant |

最少出 3 类 (strictly_necessary + analytics + marketing)。`default_state` 必须与 06.consent_mode 默认值一致 — 不一致 → 报错。

### body_md 要点（≥200 字）

1. effective_date 显式
2. controller 身份 + 地址 + 联系邮箱
3. 5 类 cookie 描述 + 用户控制方式（"通过页脚 cookie 设置" or "浏览器 setting"）
4. 数据保留期（每类 retention_days）
5. 第三方处理者（GA / Meta / Klaviyo 等）— 必须能在 06.providers 找到对应

## Privacy / CCPA Disclosure

### CCPA 必含

- categories_collected[] (CCPA 11 类: identifiers, financial, commercial, biometric, internet activity, geolocation, sensory, professional, education, inferences, sensitive personal info)
- third_parties_shared[] (name + purpose; 必须能在 06.providers 找到)
- do_not_sell_link.route_path = `/pages/ccpa-do-not-sell`
- request_form_email
- 用户权利（know / delete / opt-out / non-discrimination）

### do_not_sell_link 三处必出

```
1. footer_link_group.links[] (footer 列)
2. 页面 header (CCPA 要求每页可达 — 05 据此渲染顶部 banner 或 nav 链接)
3. ccpa_disclosure.do_not_sell_link 显式 route_path
```

`header_label` 推荐 "Do Not Sell My Info" (CCPA 标准措辞)；`footer_label` 同上。

## GDPR

### 必含

- email + response_sla_days (≤30, GDPR 法定上限)
- dpo_name (若 03 有 DPO; 否则 "Not designated - controller acts as DPO")
- supervisory_authority (具体 DPA name)

### body_md 要点

GDPR 文档常并入 privacy 主页面或独立 `/pages/gdpr-data-request` —— 推荐独立路由，便于 EU 用户直达。

## 并行写作

4 篇并行 — 共享：
- effective_date (统一今日)
- controller 身份
- 03.tone
- 联系邮箱

## 输出

```jsonc
"cookie_policy": { ... },
"ccpa_disclosure": { ... }   // 含 do_not_sell_link
// gdpr_data_request_contact 由 Module 1 写
```
