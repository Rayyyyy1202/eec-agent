# EEC Skills — DTC 独立站全流程 Skill 套件

9 个 MVP skill 覆盖独立站从 0 到 1 到优化的完整生命周期，每个 skill 可独立调用、可链式协作；契约与 schema 留有 Phase 2（邮件/CRM、履约/客服）的接入口。

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
  10 邮件/CRM        ← 消费 02 (email_friendly_name / subscription_eligible)
                      + 03 (email_brand_kit / welcome_offer)
                      + 06 (email_signup / email_consent / cart_abandoned /
                            email_unsubscribed / is_first_purchase)
  11 履约/客服       ← 消费 02 (cost / moq / lead_time / supplier / restricted_geo /
                              return_policy_days / low_stock_threshold)
                      + 03 (cs_tone)
                      + 06 (purchase 全字段 + return_initiated / refund /
                            order_shipped / order_delivered / order_canceled)
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

## 安装

```bash
git clone <this-repo> ~/eec_skills
cd ~/eec_skills
./install.sh
```

`install.sh` 会把：
- `shared/` 复制到 `~/.claude/skills/eec-shared/`（schema + 约定 + Phase 2 钩子表）
- 9 个 `eec-*/` 目录复制到 `~/.claude/skills/`

之后 `/eec-01-research portable blender` 即可触发。

### 其他用法

```bash
./install.sh --dry-run           # 看会做什么
./install.sh --skill 05          # 只装一个 skill
./install.sh --uninstall         # 全部卸载
```

## 链式调用示例

```bash
mkdir my-store && cd my-store
/eec-01-research portable blender                    # → ./eec/01-research/output.json
/eec-02-product-selection                            # 自动读 01
/eec-03-brand-identity                               # 自动读 01+02
/eec-04-creative-factory                             # 自动读 02+03
/eec-05-site-build                                   # 自动读 02+03+04
/eec-06-tracking                                     # 自动读 05; 写回 GTM ID 到 05 仓库
/eec-07a-tech-seo                                    # 自动读 05+06
/eec-07b-content-marketing                           # 自动读 01+02+03 (+ 07a opp 可选)
/eec-08-paid-ads                                     # 自动读 02+03+04+06
/eec-09-optimization                                 # 自动读 06+08; 拉外部 API
```

每个 skill 写产物到 `./eec/<NN>-<slug>/output.json` + `report.md`。下游 skill 自动读取上游 JSON 并校验 schema，缺/坏即停。

## 数据契约 & schema

强制阅读：
- [`shared/data-contracts.md`](./shared/data-contracts.md) — 数据流图、字段引用表、Q1–Q9 决策
- [`shared/conventions.md`](./shared/conventions.md) — 路径/命名/语言/校验规约
- [`shared/phase2-hooks.md`](./shared/phase2-hooks.md) — H1–H20 Phase 2 钩子归属
- [`shared/schemas/*.schema.json`](./shared/schemas/) — JSON Schema Draft 2020-12

修改 schema 时，遵循 `conventions.md §10` 的版本规则。

## 设计原则（共 9 个 skill 共享）

1. **数据驱动**：所有 external claim 必须带 `sources[]` + `confidence`
2. **契约优先**：每个 skill 都用 JSON Schema 自我校验输出，校验失败不放行
3. **链路完整性**：下游 skill 读上游产物前先校验上游 schema；缺则停，绝不编造
4. **Phase 2 钩子全填**：所有 H1–H20 字段在 MVP 必有，未知值用 `"TBD"` 或 `0` 占位，不省略 key
5. **语言跟随**：中文用户中文回复；英文用户英文回复；外部搜索查询统一用英文
6. **并行优先**：模块内独立数据源用 Agent tool 并行采集
7. **置信度可追溯**：每个 claim 标 `high|medium|low`；低置信附 `verification_path`
8. **PII 哈希锁 SHA-256**：发送到广告平台的 email 等 PII 必须 SHA-256（lowercase hex，trim+lowercase 后）
9. **GTM 闭环**：05 留 placeholder + writeback 白名单；06 写 GTM ID + 跑 rebuild_command；写完闭环

## 仓库结构

```
eec_skills/
├── README.md                      # ← 你正在读这个
├── install.sh                     # 一键安装到 ~/.claude/skills/
├── shared/                        # 跨 skill 共享层
│   ├── data-contracts.md
│   ├── conventions.md
│   ├── phase2-hooks.md
│   └── schemas/
│       ├── _common.schema.json
│       ├── 01-research.schema.json
│       └── ... (NN-*.schema.json × 10)
├── eec-01-research/
│   ├── SKILL.md                   # 主入口
│   ├── modules/                   # 子模块文件
│   │   ├── 01-*.md
│   │   └── ...
│   ├── templates/                 # 输出模板
│   │   └── output.md
│   └── schemas/                   # 软链 / 副本：本 skill 的 output.schema.json
└── ... (eec-NN-*/) × 9
```

## Phase 2 路线图（不在 MVP）

`eec-10-email-crm` 与 `eec-11-fulfillment` 在 MVP 不构建，但 MVP 已通过 H1–H20 把字段全部预留。Phase 2 启动时只需新增 2 个 skill 目录，不必回头改任何 MVP skill。

## License

Internal use.
