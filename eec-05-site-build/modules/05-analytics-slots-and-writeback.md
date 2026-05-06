# Module 05 — Analytics Slots + Writeback Protocol（GTM 闭环关键）

## 目标
为 06 追踪留 3 件套：GTM 占位 + consent 槽 + rebuild_protocol（writeback 白名单 + 重建命令 + 验证命令）。

## 步骤
### A. gtm_container_placeholder
- 在 `repo/app/layout.tsx`（或同等入口）加 `<Script src={`https://www.googletagmanager.com/gtm.js?id=${process.env.NEXT_PUBLIC_GTM_ID}`} />`（条件渲染：consent granted 后）
- placeholder 字符串：`${NEXT_PUBLIC_GTM_ID}` —— 06 写回真值
- 在 `repo/.env.example` 写 `NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX`（占位）

### B. consent_layer_slot
- 在 layout 顶部加 `<ConsentBanner />` 组件
- 默认 denied：
  ```js
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied'
  });
  ```
- consent 后 update granted

### C. data_layer_global
- 默认 `dataLayer`（GA4/GTM 标配）

### D. rebuild_protocol（与 06 闭环关键）
- `rebuild_command`：根据 hosting 决定
  - Vercel：`vercel --prod` 或 `git push`（CI 触发）
  - Netlify：`netlify deploy --prod`
  - 静态：`npm run build && npm run deploy`
- `writeback_target_files`：明确白名单（06 只能改这些）
  - 至少包含：`.env.production`（GTM ID）
  - 推荐：`src/lib/gtm.ts` 或同等模块
- `post_rebuild_validation`：
  - `curl -s $SITE_URL | grep -q 'GTM-'` —— 抓首页 HTML 验证 GTM script 加载
  - 或 `curl -s $SITE_URL/api/health | jq .gtm_loaded`

## 输出（写到 analytics_endpoints）
```jsonc
{
  "analytics_endpoints": {
    "gtm_container_placeholder": "${NEXT_PUBLIC_GTM_ID}",
    "consent_layer_slot": "<ConsentBanner /> in app/layout.tsx",
    "data_layer_global": "dataLayer",
    "rebuild_protocol": {
      "rebuild_command": "vercel --prod",
      "writeback_target_files": [
        ".env.production",
        "src/lib/gtm.ts"
      ],
      "post_rebuild_validation": "curl -s $SITE_URL | grep -q 'GTM-'"
    }
  }
}
```

## 校验
- writeback_target_files[] 至少 1 项
- 每个 writeback file 在 repo_path 下实际存在（即便是空文件 / 占位）
- rebuild_command 非空
- post_rebuild_validation 是单条 shell 命令（06 能执行）
