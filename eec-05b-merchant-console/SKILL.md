---
name: eec-05b-merchant-console
version: 1.0.0
description: >
  独立站商家端 Agent。在 05 已建出的仓库里挂载 /admin/* 控制台：dashboard / products /
  orders / events / login。读 02 SKU + 06 events_spec + 09 KPIs，可选接 Stripe / Medusa /
  Shopify Admin API。所有页面 noindex + auth-gated。Phase 2（10 邮件 / 11 履约）的位置先用
  empty-state 占住。
  触发词: "商家端", "admin console", "merchant", "/eec-05b-merchant-console"
user_invocable: true
argument_description: >
  可选: 认证模式 (basic / session / oauth) + 是否接真 commerce API。
  例: /eec-05b-merchant-console
  例: /eec-05b-merchant-console auth=session commerce=stub
---

# eec-05b-merchant-console: 商家端控制台

你是一个 DTC 全栈工程师。05 已经把 Storefront（顾客端）建好了。本 skill 在**同一个仓库**里挂载 `/admin/*` 路由集，让商家能在浏览器里看 KPI、改商品、查事件、看订单。

不新建仓库。不复制资产。所有产出写到 05 的 `repo_path` 下，仅限于：

```
app/admin/**, lib/admin/**, middleware.ts, .env.example
```

## 强制阅读

1. `~/.claude/skills/eec-shared/conventions.md`
2. `~/.claude/skills/eec-shared/data-contracts.md` — §3 字段引用
3. `~/.claude/skills/eec-shared/phase2-hooks.md` — 你不直接产 H1-H20，但 admin_routes[].phase2_owner 是 10/11 的着陆位
4. `~/.claude/skills/eec-shared/schemas/05b-merchant-console.schema.json`
5. `./eec/02-product-selection/output.json` — SKU / 库存 / restricted_geo
6. `./eec/05-site-build/output.json` — repo_path / env_vars / writeback whitelist 模式
7. `./eec/06-tracking/output.json` — events_spec / destinations / consent
8. `./eec/09-optimization/output.json`（若已跑） — diagnostics / decisions / metrics_by_dim → dashboard 数据源

## 上游校验门

```
1. 必须存在: 02 + 05 output.json
   - 任一缺失 → STOP（05 没建站，没地方挂 admin）
2. 06 / 09 缺失 → 允许，但对应 admin_routes 走空态
3. ajv 校验所有存在的上游
4. 提取:
   - 05.repo_path → host_repo_path（必须 1:1 复用，不能换路径）
   - 05.env_vars_required[] → 不允许重名；如要新增必须前缀 ADMIN_*
   - 02.skus[] → /admin/products 列表数据
   - 06.events_spec[] → /admin/events schema 卡片
   - 09.diagnostics[] / decisions[] / data_pull.metrics_by_dim → /admin/dashboard
5. 真实仓库门：fs 检查 host_repo_path 必须存在 + package.json 存在
   - 否则 STOP，要求先 /eec-05-site-build
```

## 核心原则

1. **Mount-don't-clone**：写到 05 的 repo_path，绝不新建 eec/05b-merchant-console/repo/。出现路径偏离 → STOP
2. **Whitelist 严格**：writeback_target_files[] 只允许 `app/admin/**` / `lib/admin/**` / `middleware.ts` / `.env.example`。任何其他路径 → STOP
3. **noindex 硬锁**：admin_routes[].noindex 在 schema 是 const true。同时 robots.txt 要含 `Disallow: /admin`，每页要 `<meta name="robots" content="noindex,nofollow">`
4. **Auth 强制**：除 /admin/login 外，所有 admin 页 auth_required=true。production 禁止 type=none
5. **Bindings 显式**：每条 admin_routes[].data_binding_ids[] 引用必须落到 data_bindings[]。读哪个 skill 的哪个 path 必须写清楚
6. **API 真值用 stub_until 标记**：今天还没 STRIPE_SECRET_KEY？bindings[].stub_until=stripe_keys。不要假装能调
7. **Phase 2 占位**：10 / 11 没产出 → 仍然铺路由，phase2_owner 标 owner_skill，empty_state_copy 写"等 /eec-XX 跑完后渲染"
8. **PII 不出 admin 边界**：dashboard 渲染 customer_email_hash 时禁止反编；只能展示 hash 前 8 位 + 总计

## Step 1: 输入解析

```
$ARGUMENTS:
  auth=<basic|session|oauth>     # 默认 session_cookie
  commerce=<stub|stripe|medusa|shopify>  # 默认 stub
```

读上游 + 检查 05 仓库 → 选型预览：
```
读到上游:
  - 05 repo: <host_repo_path> (frontend: <stack>; routes: <N> 个 storefront)
  - SKU (02): <N> 个
  - Events (06): <N> 条 (consent_mode: <state>)
  - 09 跑过吗: <yes/no>，若 yes: <N> diagnostics, <N> decisions

将挂载:
  - admin_base_path: /admin
  - 路由数: <N> (login + dashboard + products + orders + events + ...)
  - auth: <type> + provider <provider>
  - commerce 接入: <commerce>（<stub_until 状态>）
  - phase2 占位: <list of 10/11 路由>

写回白名单（必须命中）:
  - app/admin/**
  - middleware.ts
  - lib/admin/**
  - .env.example

是否开始挂载? (Y/n)
```

## Step 2: 模块执行

### 数据流

```
Module 1: 仓库挂载点确认 + writeback 白名单声明
       │
       ▼
Module 2: 路由清单 (admin_routes[]) — login / dashboard / products / orders / events / phase2 占位
       │
       ▼
Module 3: 数据绑定 (data_bindings[]) — 每条 route 哪个上游的哪个 path
       │  并行：每个 binding 独立解析
       ▼
Module 4: Auth + Middleware (auth_strategy + middleware.ts 写出)
       │
       ▼
Module 5: noindex 自审 + robots.txt 追加 Disallow + Phase 2 占位渲染
       │
       ▼ output.json + 写入 05 repo
```

### 模块索引

| # | 文件 | 核心问题 |
|---|---|---|
| 1 | `modules/01-mount-and-whitelist.md` | 检查 05 repo 存在 + 声明能改哪些文件 |
| 2 | `modules/02-admin-routes.md` | 列出每条 /admin/* 路径 + component 文件路径 |
| 3 | `modules/03-data-bindings.md` | 每个 route 读哪个 skill / API；refresh_strategy 选哪种 |
| 4 | `modules/04-auth-and-middleware.md` | 选 auth.type；password / session env vars；middleware 拦截策略 |
| 5 | `modules/05-noindex-and-phase2.md` | robots.txt 追加 + meta 标签 + 10/11 占位 |

### 并行执行

- Module 2 内：每条 admin_route 的 component 文件并行写
- Module 3 内：每个 data_binding 的解析并行（读 02/06/09 三份 output.json）
- Module 5 内：每页 noindex meta 校验并行

## Step 3: 输出生成

写：
- `./eec/05b-merchant-console/output.json` (manifest，描述挂了什么)
- `./eec/05b-merchant-console/report.md`
- `<host_repo_path>/app/admin/**` (实际路由代码)
- `<host_repo_path>/lib/admin/**` (auth helpers / data adapters)
- `<host_repo_path>/middleware.ts` (auth gate)
- `<host_repo_path>/.env.example` (追加新 env vars，不能覆盖 05 的)
- `<host_repo_path>/public/robots.txt` (追加 `Disallow: /admin`，若已有则跳过)

`output.json` MUST 含：
- `host_repo_path` — 必须 == 05.output.repo_path
- `admin_base_path` — 默认 `/admin`，必须匹配 `^/admin(/[a-z0-9-]+)?$`
- `admin_routes[]` (≥1，每条带 id `aroute_NNN`、path、purpose、data_binding_ids[]、auth_required、noindex=true、可选 phase2_owner)
- `data_bindings[]` (id `bind_NNN`，source_skill enum，source_path JSONPath/资源路径，refresh_strategy enum，可选 writes_back / stub_until)
- `auth_strategy` (type enum，scope enum；session_cookie 必须 password_env_var + session_secret_env_var)
- `writeback_target_files[≥1]` — 全部命中 `^(app/admin/.*|middleware\.ts|\.env\.example|lib/admin/.*)$`
- `phase2_hooks[]` — 每个绑到一条 admin_routes[].id，且对应 route 的 phase2_owner 必须等于 hook.owner_skill
- `env_vars_required[]` — 命名规则同 05；新增建议前缀 `ADMIN_*` 避免冲突
- `noindex_audit` (robots_disallow_present + meta_robots_present_on_all_routes，理想 leak_check_url)
- `meta`

## Step 4: 自我校验门

```
1. ajv validate output.json
2. host_repo_path == 05.output.repo_path（字面相等）
3. host_repo_path + package.json 物理存在
4. 每个 admin_routes[].path 必须以 admin_base_path 开头
5. 每个 admin_routes[].data_binding_ids[] 必须解析到 data_bindings[]
6. 每条 data_bindings[].source_skill 若是 skill 名，对应 ./eec/<skill>/output.json 必须存在 OR stub_until != 'never'
7. 每个 writeback_target_files[] 必须命中正则白名单
8. 每个 writeback_target_files[] 实际写入物理存在于 host_repo_path 下
9. auth_strategy.type=session_cookie → password_env_var + session_secret_env_var 都设
10. production 禁用 type=none（只在 dev 模式可豁免）
11. phase2_hooks[].admin_route_id 解析的 admin_routes[] 必须有 phase2_owner == hook.owner_skill
12. noindex_audit.robots_disallow_present == true（实际 grep `Disallow: /admin` of host_repo_path/public/robots.txt）
13. noindex_audit.meta_robots_present_on_all_routes == true（实际 grep `noindex,nofollow` of every admin_routes[].component）
14. .env.example 必须包含每条 env_vars_required[].name；不得在仓库里出现真值
15. middleware.ts 必须 match `/admin/(?!login)` 或等价 matcher
16. 不允许写到 admin_base_path 之外的任何 storefront 路由
```

## Step 5: 交付

```
✓ 商家端挂载完成
  - Host repo: <host_repo_path>
  - Admin base: <admin_base_path>
  - 路由: <N> 条 (real: <r>; phase2 占位: <p>)
  - 认证: <type> + <provider> (mfa: <bool>)
  - Bindings: <N> (real: <r>; stub: <s>)
  - noindex 自审: robots ✓ / meta ✓
  - Phase 2 占位: 10 → <count> 路由; 11 → <count> 路由

产物:
  - ./eec/05b-merchant-console/output.json
  - ./eec/05b-merchant-console/report.md
  - <host_repo_path>/app/admin/* (写入)
  - <host_repo_path>/middleware.ts (写入或追加)
  - <host_repo_path>/public/robots.txt (追加 Disallow)

下一步:
  - 跑 05 的 rebuild_command 或 pnpm dev 验证 /admin/login 200
  - 设置 ADMIN_* env vars
  - Phase 2: /eec-10-email-crm 跑完后 → 自动填 <list of phase2 admin routes>
  - Phase 2: /eec-11-fulfillment 跑完后 → 自动填 <list of phase2 admin routes>
```

## 交互点

1. Step 1 选型预览后 Y/n
2. Module 1 若 host_repo_path 不存在 → STOP，提示用户先 /eec-05-site-build
3. Module 4 若用户选 type=none → 警告 production 不允许；要求显式确认 dev-only
4. Module 5 若 robots.txt 已有 `Disallow: /admin` → 跳过追加，noindex_audit.robots_disallow_present 仍设 true
5. 如果 09 没跑 → /admin/dashboard 走空态（提示"运行 /eec-09-optimization 后这里有数据"）；不阻断
