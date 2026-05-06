# 商家端挂载交付 — {{brand.brand_name}}

**生成**: {{meta.generated_at}}　|　Skill v{{meta.skill_version}}
**Host repo**: `{{host_repo_path}}`　|　**Admin base**: `{{admin_base_path}}`

---

## TL;DR
- **Mounted into**: `{{host_repo_path}}` （来自 05.repo_path，未新建仓库）
- **Admin 路由**: {{admin_routes | length}} 条（real {{admin_routes_real_count}} / phase2 占位 {{admin_routes_phase2_count}}）
- **认证**: {{auth_strategy.type}} + {{auth_strategy.provider}}（MFA: {{auth_strategy.mfa_required}}）
- **Bindings**: {{data_bindings | length}}（real {{data_bindings_real_count}} / stub {{data_bindings_stub_count}}）
- **noindex 自审**: robots ✓ / meta ✓ → {{noindex_audit_status}}

---

## 1. 路由清单

| ID | Path | Component | Auth | Bindings | Phase2 owner |
|---|---|---|---|---|---|
{{#each admin_routes}}
| {{id}} | `{{path}}` | `{{component}}` | {{auth_required ? "🔒" : "—"}} | {{data_binding_ids | join ","}} | {{phase2_owner ?? "—"}} |
{{/each}}

> 所有非 login 路由 auth_required = true；所有路由 noindex = true（schema 锁定）。

## 2. 数据绑定

| ID | Source | Path | Refresh | Writes back | Stub until |
|---|---|---|---|---|---|
{{#each data_bindings}}
| {{id}} | {{source_skill}} | `{{source_path}}` | {{refresh_strategy}}{{#if revalidate_seconds}} ({{revalidate_seconds}}s){{/if}} | {{writes_back ? "✓" : "—"}} | {{stub_until ?? "never"}} |
{{/each}}

> Stub bindings 列表（今天还没接真 API 的）:
{{#each data_bindings_stub}}
- `{{id}}` ({{source_skill}}) — 需要 {{stub_until}} 设置后才返回真值
{{/each}}

## 3. 认证策略

```yaml
type:           {{auth_strategy.type}}
provider:       {{auth_strategy.provider}}
scope:          {{auth_strategy.scope}}
mfa_required:   {{auth_strategy.mfa_required}}
password_env:   {{auth_strategy.password_env_var}}
session_secret: {{auth_strategy.session_secret_env_var}}
```

中间件 matcher: `/admin/(?!login)` （middleware.ts）

## 4. Writeback 白名单

> 本 skill 仅允许写以下文件（schema 正则锁定 `^(app/admin/.*|middleware\.ts|\.env\.example|lib/admin/.*)$`）

{{#each writeback_target_files}}
- `{{this}}`
{{/each}}

## 5. Phase 2 占位

| Hook | Owner skill | Admin route | Empty state copy |
|---|---|---|---|
{{#each phase2_hooks}}
| {{hook_id}} | {{owner_skill}} | {{admin_route_id}} | {{empty_state_copy}} |
{{/each}}

> 当 `/eec-10-email-crm` 或 `/eec-11-fulfillment` 跑完产出 output.json 后，对应 admin 路由会自动从 empty-state 切换到真实数据。

## 6. 环境变量

{{#each env_vars_required}}
- `{{name}}` ({{scope}}) — {{purpose}}{{#if secret}} 🔐 secret{{/if}}
{{/each}}

> 注意：本 skill 新增的 env vars 全部以 `ADMIN_*` 前缀，避免与 05 的 storefront env 冲突。

## 7. noindex 自审

| 检查项 | 结果 |
|---|---|
| `Disallow: /admin` in `public/robots.txt` | {{noindex_audit.robots_disallow_present ? "✓" : "✗"}} |
| 每个 admin route 渲染 `<meta name="robots" content="noindex,nofollow">` | {{noindex_audit.meta_robots_present_on_all_routes ? "✓" : "✗"}} |
| 部署后泄漏检查 URL | {{noindex_audit.leak_check_url ?? "—"}} |

---

## 校验状态

- host_repo_path == 05.repo_path: {{host_repo_match_check}}
- 所有 writeback 文件命中白名单: {{writeback_whitelist_check}}
- 每条 binding 的上游 output.json 存在 (或显式 stub): {{binding_source_check}}
- 每个 admin route 的 component 物理存在: {{component_file_check}}
- middleware.ts 拦截 /admin/(?!login): {{middleware_matcher_check}}
- robots.txt + meta 双重 noindex: {{noindex_double_check}}

## 下一步

1. 设置 env vars（至少 `{{auth_strategy.password_env_var}}` 和 `{{auth_strategy.session_secret_env_var}}`）
2. 启动 dev: `pnpm dev` → 访问 `{{admin_base_path}}/login`
3. 跑 05 的 rebuild_command 重新部署
4. （可选）`/eec-10-email-crm` → 填充 phase2 邮件 admin 路由
5. （可选）`/eec-11-fulfillment` → 填充 phase2 履约 admin 路由
