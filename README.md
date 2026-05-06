# EEC — Autonomous E-Commerce Agent

DTC 独立站从 0 到 1 到优化的全流程 AI agent。9 个 skill 串成一条流水线（调研 → 选品 → 品牌 → 素材 → 建站 → 追踪 → SEO → 内容 → 投流 → 优化），每一步都有 JSON Schema 自校验，下游自动消费上游产物。

提供两种用法：
- **Web Agent**（本仓库 `agent/`）—— Hono + Next.js，浏览器里点点鼠标就能跑全流程，带对话/审批/三层记忆
- **Claude Code Skills**（本仓库 `eec-*/`）—— 装到 `~/.claude/skills/`，命令行 `/eec-01-research portable blender` 触发

> **License**: MIT — see [LICENSE](./LICENSE)

---

## ⭐ Quickstart（Web Agent，推荐先跑这个）

### 1. 前置

| 工具 | 版本 | 安装 |
|---|---|---|
| Node.js | ≥ 20 | https://nodejs.org/ |
| pnpm | ≥ 9 | `brew install pnpm` 或 `npm i -g pnpm` |
| OpenAI API key | — | https://platform.openai.com/api-keys |

### 2. 克隆

```bash
git clone https://github.com/Rayyyyy1202/eec-agent.git
cd eec-agent
```

### 3. 配 OpenAI key

```bash
cp agent/server/.env.example agent/server/.env.local
# 然后编辑 agent/server/.env.local，把 sk-... 换成你真实的 key
```

`.env.local` 只在本地，已被 `.gitignore` 排除，不会被 push。

### 4. 一键启动（server + web）

```bash
cd agent
./bin/start.sh
```

脚本会：
- `pnpm install` 装 server 和 web 的依赖
- 起 Hono server（`http://localhost:3001`）
- 起 Next.js web（`http://localhost:4000`）
- 日志写到 `/tmp/eec-agent-{server,web}.log`

启动需要 ~30 秒（首次装依赖会更久）。Ctrl-C 同时停掉两个进程。

### 5. 打开浏览器

```
http://localhost:4000
```

第一次进会让你创建一个 brand：

1. 点 **+ New Brand**
2. 填名字（如 `My First Brand`）和 brand brief（一两句话描述你做啥的）
3. **Workspace path** 填一个空目录，agent 会把所有产物 (`output.json`、网站代码、素材等) 写到这里。例如 `~/eec-workspaces/my-brand`
4. 点进 brand → 点 **+ New Conversation** → 直接和 agent 说 "帮我跑 01 调研" 就行

Agent 会自己调用 skill、写 `output.json`、跑下一步前问你审批。

### 6. （可选）只装 Claude Code Skills

不想跑 web，只想在 Claude Code 命令行用 9 个 skill：

```bash
./install.sh             # 复制到 ~/.claude/skills/
# 然后在任意目录
/eec-01-research portable blender
```

详见 [Claude Code Skills 用法](#claude-code-skills) 一节。

---

## 环境变量

`agent/server/.env.local` 里能配的：

| var | 默认 | 说明 |
|---|---|---|
| `OPENAI_API_KEY` | **必填** | OpenAI 凭据 |
| `OPENAI_MODEL` | `gpt-4o` | chat completions 模型，可换 `gpt-5.4` 等 |
| `OPENAI_BASE_URL` | OpenAI 官方 | 兼容 endpoint（Azure/自托管 OpenAI-compatible API）|
| `REPO_ROOT` | 自动从启动脚本推导 | `eec-*` skill 目录 + `shared/` 的位置 |
| `WORKSPACE_PATH` | `${REPO_ROOT}/workspace` | 默认 brand workspace；UI 里可以为每个 brand 单独覆盖 |
| `PORT` | `3001` | server 端口 |
| `AGENT_DB_PATH` | `${REPO_ROOT}/agent/server/data/eec.sqlite` | SQLite 路径（会自动建） |

---

## 流程总图

```
01 调研 ──┬──► 02 选品 ──┬──► 04 素材工厂 ──► 05 建站 ──► 06 追踪 ──┬──► 07a 技术 SEO
         │              │                                            ├──► 07b 内容营销
         └──► 03 品牌 ──┘                                            └──► 08 投流 ──► 09 优化
                                                                             ▲
                                                          ┌──────────────────┘
                                              09 拉取的外部数据源:
                                              Meta / Google Ads / GA4 / TikTok / Shopify Admin / Stripe ...

Phase 2 预留接口:
  10 邮件/CRM        ← 消费 02 + 03 + 06
  11 履约/客服       ← 消费 02 + 03 + 06
```

## 9 个 MVP Skill

| # | Skill | 作用 | 输入 (required) | 输出 |
|---|---|---|---|---|
| 01 | [eec-01-research](./eec-01-research/) | 品类调研 | 品类关键词 | 趋势/痛点/竞品/受众/广告情报/供应信号 |
| 02 | [eec-02-product-selection](./eec-02-product-selection/) | 选品+定价 | 01 | SKU 列表（含成本/供应商/欢迎名/订阅/退货/限运） |
| 03 | [eec-03-brand-identity](./eec-03-brand-identity/) | 品牌识别 | 01, 02 | 品牌名/调性/视觉/邮件品牌包/客服 tone/欢迎券 |
| 04 | [eec-04-creative-factory](./eec-04-creative-factory/) | 素材工厂 | 02, 03 | 图/文/视频按 purpose×channel×lang 索引 |
| 05 | [eec-05-site-build](./eec-05-site-build/) | 全栈建站 | 02, 03, 04 | 仓库 + 路由 + checkout + SEO meta + GTM/consent 槽位 |
| 06 | [eec-06-tracking](./eec-06-tracking/) | 追踪 | 05 | 13 个必有事件 + GTM container + consent + writeback 闭环 |
| 07a | [eec-07a-tech-seo](./eec-07a-tech-seo/) | 技术 SEO | 05, 06 | 审计/CWV/Schema/keyword opportunities |
| 07b | [eec-07b-content-marketing](./eec-07b-content-marketing/) | 内容营销 | 01, 02, 03 (07a 可选) | 关键词簇/内容日历/草稿/内链图 |
| 08 | [eec-08-paid-ads](./eec-08-paid-ads/) | 投流 | 02, 03, 04, 06 | 账户结构/受众/创意配对/预算/UTM/启动清单 |
| 09 | [eec-09-optimization](./eec-09-optimization/) | 优化 | 06, 08 (拉外部 API) | 数据源/诊断/实验/决策/已应用变更 |

---

## Web Agent 架构

```
┌──────────────────────────────────────────────────────────────────────┐
│  agent/                                                              │
│  ├── server/   Hono + openai SDK + ajv + better-sqlite3 on :3001     │
│  ├── web/      Next.js 15 + reactflow on :4000                       │
│  └── bin/start.sh                                                    │
└──────────────────────────────────────────────────────────────────────┘
                          │
                          ▼ reads + writes
                  <WORKSPACE_PATH>/eec/<NN>-<slug>/output.json
```

三层记忆：
- **L1** — context window：`microcompact` 保留末 3 轮 + stub 老 tool result
- **L2** — disk：SQLite (brands/conversations/messages/memories/approvals) + workspace `output.json`
- **L3** — long-term：`brand_profile.md` 由 distillation job 周期性提炼，自动注入 system prompt

详见 [agent/ARCHITECTURE.md](./agent/ARCHITECTURE.md)。

---

## Claude Code Skills

不想跑 web，只用 Claude Code 命令行：

```bash
./install.sh                     # 安装到 ~/.claude/skills/
./install.sh --dry-run           # 看会做什么
./install.sh --skill 05          # 只装一个 skill
./install.sh --uninstall         # 全部卸载
```

链式调用：

```bash
mkdir my-store && cd my-store
/eec-01-research portable blender                    # → ./eec/01-research/output.json
/eec-02-product-selection                            # 自动读 01
/eec-03-brand-identity                               # 自动读 01+02
/eec-04-creative-factory                             # 自动读 02+03
/eec-05-site-build                                   # 自动读 02+03+04
/eec-06-tracking                                     # 自动读 05; 写回 GTM ID
/eec-07a-tech-seo                                    # 自动读 05+06
/eec-07b-content-marketing                           # 自动读 01+02+03 (+07a 可选)
/eec-08-paid-ads                                     # 自动读 02+03+04+06
/eec-09-optimization                                 # 自动读 06+08; 拉外部 API
```

每个 skill 写到 `./eec/<NN>-<slug>/output.json` + `report.md`。下游自动校验 schema，缺/坏即停。

---

## 数据契约 & schema

强制阅读：
- [`shared/data-contracts.md`](./shared/data-contracts.md) — 数据流图、字段引用表、Q1–Q9 决策
- [`shared/conventions.md`](./shared/conventions.md) — 路径/命名/语言/校验规约
- [`shared/phase2-hooks.md`](./shared/phase2-hooks.md) — H1–H20 Phase 2 钩子归属
- [`shared/schemas/*.schema.json`](./shared/schemas/) — JSON Schema Draft 2020-12

修改 schema 时遵循 `conventions.md §10` 的版本规则。

## 设计原则（共 9 个 skill 共享）

1. **数据驱动**：所有 external claim 必须带 `sources[]` + `confidence`
2. **契约优先**：每个 skill 都用 JSON Schema 自我校验输出，校验失败不放行
3. **链路完整性**：下游 skill 读上游产物前先校验上游 schema；缺则停，绝不编造
4. **Phase 2 钩子全填**：所有 H1–H20 字段在 MVP 必有，未知值用 `"TBD"` 或 `0` 占位
5. **语言跟随**：中文用户中文回复；英文用户英文回复；外部搜索查询统一用英文
6. **并行优先**：模块内独立数据源用 Agent tool 并行采集
7. **置信度可追溯**：每个 claim 标 `high|medium|low`；低置信附 `verification_path`
8. **PII 哈希锁 SHA-256**：发送到广告平台的 email 等 PII 必须 SHA-256（lowercase hex）
9. **GTM 闭环**：05 留 placeholder + writeback 白名单；06 写 GTM ID + 跑 rebuild

---

## 仓库结构

```
eec-agent/
├── README.md                     # ← 你正在读这个
├── LICENSE                       # MIT
├── install.sh                    # 把 skills 装到 ~/.claude/skills/
├── agent/                        # ⭐ Web Agent (Hono + Next.js)
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── server/                   # :3001
│   ├── web/                      # :4000
│   └── bin/start.sh              # 一键启动
├── shared/                       # 跨 skill 共享层
│   ├── data-contracts.md
│   ├── conventions.md
│   ├── phase2-hooks.md
│   └── schemas/                  # JSON Schema Draft 2020-12
│       └── *.schema.json
├── eec-01-research/              # Skill 包（每个目录是一个独立 skill）
│   ├── SKILL.md
│   ├── modules/
│   ├── templates/
│   └── schemas/
└── ... eec-NN-*/  × 9
```

## 故障排查

| 症状 | 处理 |
|---|---|
| `pnpm: command not found` | `brew install pnpm` 或 `npm i -g pnpm` |
| `503` from `POST /skills/:id/run` | `OPENAI_API_KEY` 没设 — 检查 `agent/server/.env.local` |
| Web 显示「对话不存在或已归档」 | server 没起来或 `:3001` 被占 — 看 `tail -f /tmp/eec-agent-server.log` |
| Skill 校验失败 | 看 `<workspace>/eec/<NN>-<slug>/output.json` 与 `shared/schemas/<NN>-*.schema.json` 的 diff |
| 端口冲突 | `PORT=3002 ./bin/start.sh`（仅改 server；web 改 `agent/web/package.json` 的 dev script）|

## Phase 2 路线图

`eec-10-email-crm` 与 `eec-11-fulfillment` 不在 MVP，但 MVP 已通过 H1–H20 把字段全部预留。Phase 2 启动时只需新增 2 个 skill 目录，不必回头改任何 MVP skill。
