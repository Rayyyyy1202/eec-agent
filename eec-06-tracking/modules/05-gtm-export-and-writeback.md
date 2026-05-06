# Module 05 — GTM Export + Writeback to 05 + Rebuild

## 目标
导出 GTM container .json + 把 GTM ID 写回 05 仓库 + 跑 rebuild_command + 跑 post_rebuild_validation。

## 步骤
### A. GTM Container 设计
- 在 GTM UI 或脚本生成 container：
  - Tags：每个 destination 一组（ga4, meta_pixel, tiktok_pixel, ...）
  - Triggers：13 必有事件各一
  - Variables：dataLayer pull + SHA-256 内置函数
  - Folders：按 destination 分

### B. Export
- 从 GTM UI Admin → Export Container → 落 `./eec/06-tracking/gtm-container.json`
- 或 GTM API 拉取
- 校验 .json 可重新 import

### C. 写回 05 仓库
1. 读 `05.analytics_endpoints.rebuild_protocol.writeback_target_files[]`
2. 对每个 file：
   - `.env.production`：set `NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX`
   - `src/lib/gtm.ts`（若有）：填真值常量
   - 其他配置文件按需
3. 每个改动记到 `site_build_writeback.files_modified[]`：
   - `path` 必须 ∈ writeback_target_files[]（违反 → STOP）
   - `change_type` ∈ {env_var_set, script_inserted, config_updated, file_created}
   - `summary` 一句话

### D. Rebuild
- 执行 `05.rebuild_protocol.rebuild_command`
- 记 `rebuild_executed=true` + `rebuild_command_run`
- 失败 → SKILL.md 交互点 2 暂停（不能伪 true）

### E. Post-rebuild Validation
- 执行 `05.rebuild_protocol.post_rebuild_validation` 命令
- 结果 → `post_rebuild_validation_status` ∈ {pass, fail, not_applicable}
- fail → STOP（GTM 没真加载）

## 输出
```jsonc
{
  "site_build_writeback": {
    "target_repo_path": "./eec/05-site-build/repo/",
    "files_modified": [
      { "path": ".env.production", "change_type": "env_var_set", "summary": "NEXT_PUBLIC_GTM_ID=GTM-ABC1234" },
      { "path": "src/lib/gtm.ts", "change_type": "config_updated", "summary": "Replaced placeholder constant" }
    ],
    "rebuild_required": true,
    "rebuild_executed": true,
    "rebuild_command_run": "vercel --prod",
    "post_rebuild_validation_status": "pass"
  },
  "gtm_container_export_path": "./eec/06-tracking/gtm-container.json"
}
```

## 校验
- 每个 files_modified[].path ∈ 05.writeback_target_files
- target_repo_path == 05.repo_path
- rebuild_executed=true 时 rebuild_command_run 必填
- 若 05 声明 post_rebuild_validation → status 必须是 pass / fail（不能 skipped）
- gtm_container_export_path 物理存在
