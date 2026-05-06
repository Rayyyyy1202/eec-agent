# EEC Agent

Programmatic runner + web UI on top of the 14 EEC SKILL.md pipeline skills.
The Agent lets a user **click any node in the pipeline** and run that single
skill against a workspace via the GPT API, even when upstream skills haven't
been executed yet (auto-stub fills the gaps).

The Agent is **additive** — the existing Claude Code slash-command flow
(`/eec-04-creative-factory`, etc.) keeps working against the same workspace.

```
┌──────────────────────────────────────────────────────────────────────┐
│  agent/                                                              │
│  ├── server/   Hono + openai SDK + ajv on :3001                      │
│  ├── web/      Next.js 15 + reactflow on :4000 (pipeline DAG)        │
│  └── bin/start.sh                                                    │
└──────────────────────────────────────────────────────────────────────┘
                          │
                          ▼ reads + writes
                  <WORKSPACE_PATH>/eec/<NN>-<slug>/output.json
```

## Quick start

```bash
cd agent
export OPENAI_API_KEY=sk-...
export WORKSPACE_PATH=/Users/yckj/Desktop/eec_skills/petropolitian   # default
export OPENAI_MODEL=gpt-4o                                            # default
./bin/start.sh
```

Then open http://localhost:4000/pipeline and click any node.

## Environment

| var               | default                                              | meaning |
|-------------------|------------------------------------------------------|---------|
| `OPENAI_API_KEY`  | (required)                                           | OpenAI credential |
| `OPENAI_MODEL`    | `gpt-4o`                                             | chat completions model |
| `OPENAI_BASE_URL` | (OpenAI default)                                     | override for compatible providers |
| `REPO_ROOT`       | `/Users/yckj/Desktop/eec_skills`                     | location of `eec-*` skill dirs + `shared/` |
| `WORKSPACE_PATH`  | `${REPO_ROOT}/petropolitian`                         | brand workspace where `eec/<NN>-…/output.json` live |
| `PORT`            | `3001`                                               | server port |
| `AGENT_SERVER_URL`| `http://localhost:3001`                              | consumed by web for proxy |

## API

```
GET  /health
GET  /skills                      → 15-skill inventory (id, slug, tier, upstreams, schema_path)
GET  /skills/:id                  → single skill detail
GET  /skills/:id/preflight        → upstream readiness gate result
GET  /skills/:id/output           → returns last output.json
GET  /workspace/state             → per-skill {exists, valid, synthetic, mtime}
POST /skills/:id/run              → SSE stream of run events
                                    body: { brand_brief?, auto_stub_upstream?:bool,
                                            allow_missing_upstream?:bool, turn_cap?:int }
                                    events: start | preflight | stub | turn | tool_call |
                                            tool_result | validate | done | result | error
```

The Web UI calls these via `/api/proxy/*` (Next.js route in `web/app/api/proxy`).

## Single-skill run loop

1. **preflight** — check declared upstream `output.json` files exist + ajv-valid.
2. **stub** *(if `auto_stub_upstream:true`)* — for every missing/invalid required
   upstream, ask the LLM to emit a minimal valid stub against the schema, marked
   `synthetic:true`. Pre-existing valid outputs are preserved (idempotent).
3. **prompt** — system = full SKILL.md body + every module + the JSON schema +
   conventions + cross-skill data contracts. user = brand brief + workspace path.
4. **LLM loop** — OpenAI chat.completions with function-calling. Up to 30 turns.
   Tools: `read_file`, `write_file`, `list_dir`, `validate_schema`, `run_shell`,
   `finish`.
5. **postflight** — ajv-validate emitted `output.json`. On failure, append
   errors to history and give the LLM one more turn to fix.

## Shell whitelist

`tools/shell.ts` uses `child_process.execFile` (no shell). Only these commands
pass:

| binary | first-arg pattern | example |
|--------|-------------------|---------|
| `npx`  | `ajv-cli@5` / `ajv` | schema validation |
| `npx`  | `prisma`            | data-model migrations (skill 13) |
| `pnpm` | `--dir <ws-path> {build|dev|test|typecheck|lint|install}` | site build |
| `node` | `<ws-script>.{js,mjs,ts}` | seed scripts |
| `tsx`  | `<ws-script>.{ts,tsx}` | seed scripts |

Anything else returns `{error:"command not whitelisted"}` to GPT — loop continues.
cwd is forced to `WORKSPACE_PATH`; `..` traversal in args is rejected; absolute
paths outside the workspace are rejected.

## DAG node colors (web)

- 🟢 green — `output.json` exists, schema-valid, no synthetic marker
- 🟡 yellow — exists but `synthetic:true` (stub-generated)
- 🔴 red — exists but ajv-invalid (must re-run)
- ⚫ gray — missing

## Dev

```bash
# server only (auto-restart)
cd server && pnpm install && pnpm dev

# web only
cd web && pnpm install && pnpm dev

# typechecks
(cd server && pnpm typecheck) && (cd web && pnpm typecheck)
```

## Out of scope (MVP)

- Multi-tenant / multi-workspace concurrency
- Auth / rate-limit
- Database persistence (filesystem-only)
- Cost tracking / token budgeting
- Side-skill stubs (only main chain 01–09 has stub hints — 03b/04b/05b/11b/13
  must be run with their upstream already present)
- Replacing or rewriting any SKILL.md (the Agent runs them as-is)
