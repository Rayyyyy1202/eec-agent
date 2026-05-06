# Module 1: review_provider 配置

## 目的

决定评论数据从哪里来，以及切换 provider 时哪些 05 文件允许被写入。

## 决策树

```
provider == self_hosted (MVP 默认)
  → stub_until = "never"
  → provider_env_vars = []
  → writeback_target_files = ["app/reviews/page.tsx", "components/ReviewWidget.tsx"]

provider == stamped
  → stub_until = "STAMPED_PUBLIC_KEY"
  → provider_env_vars = [
      { name: "STAMPED_PUBLIC_KEY", purpose: "Stamped storefront key", secret: false },
      { name: "STAMPED_PRIVATE_KEY", purpose: "Server-side rollup", secret: true }
    ]
  → writeback_target_files += ["lib/reviews-stamped.ts", ".env.local", ".env.production"]

provider == yotpo
  → stub_until = "YOTPO_APP_KEY"
  → provider_env_vars = [
      { name: "YOTPO_APP_KEY", purpose: "Yotpo app key", secret: false },
      { name: "YOTPO_API_SECRET", purpose: "Server-side calls", secret: true }
    ]
  → writeback_target_files += ["lib/reviews-yotpo.ts", ".env.local", ".env.production"]

provider == judge_me / trustpilot / okendo
  → 类似映射，遵守该平台 SDK 命名
```

## 写回保护

- writeback_target_files 是白名单。任何不在表上的 05/repo 文件不允许被本 skill 修改。
- 切 provider 必须先输出 diff 给用户审核。

## 校验

```
1. mode ∈ enum ✓
2. mode == self_hosted ⇒ stub_until == "never" ⇒ provider_env_vars 为空
3. mode != self_hosted ⇒ stub_until ∈ provider_env_vars[].name
```
