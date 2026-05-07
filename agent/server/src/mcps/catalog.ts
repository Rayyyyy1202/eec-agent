// 静态 MCP 目录。"connected" 通过读取本机 Claude Code / Claude Desktop /
// Cursor / 工程根目录的 mcpServers 配置推断 — 仅看 server 名是否出现在配置里，
// 不读取任何 token / argument。

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

export type McpPriority = 'required' | 'recommended' | 'optional';

export interface McpDef {
  id: string;
  name: string;
  category: string;
  description: string;
  /** Skill ids that benefit most from this MCP（仅作展示，不强制依赖） */
  used_by_skills: string[];
  /** 用户配置里可能出现的 server key 列表；配合 norm() 做模糊匹配 */
  aliases?: string[];
  docs_url?: string;
  priority: McpPriority;
}

export interface McpStatus extends McpDef {
  connected: boolean;
}

export const MCP_CATALOG: McpDef[] = [
  // ─── 研究 ─────────────────────────────────────────────────────
  {
    id: 'context7',
    name: 'Context7',
    category: '研究 · 文档',
    priority: 'recommended',
    description: '为 LLM 拉取库 / 框架最新官方文档；05 建站、07a 技术 SEO 写代码时减少幻觉。',
    used_by_skills: ['05', '07a'],
    aliases: ['context7', 'plugin:context7:context7'],
    docs_url: 'https://github.com/upstash/context7',
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    category: '研究 · 搜索',
    priority: 'optional',
    description: '01 调研使用：网页搜索 + 新闻搜索，独立于 GA / GSC。',
    used_by_skills: ['01'],
    aliases: ['brave-search'],
    docs_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
  },
  {
    id: 'tavily',
    name: 'Tavily',
    category: '研究 · 搜索',
    priority: 'optional',
    description: '01 调研使用：AI 友好的搜索 API，支持 deep research。',
    used_by_skills: ['01'],
    aliases: ['tavily-mcp', 'tavily'],
    docs_url: 'https://github.com/tavily-ai/tavily-mcp',
  },

  // ─── 浏览器自动化 ─────────────────────────────────────────────
  {
    id: 'claude-in-chrome',
    name: 'Claude in Chrome',
    category: '浏览器自动化',
    priority: 'recommended',
    description: '直接驱动 Chrome 标签页：05 建站后实机预览 / 截图、07a 跑 Lighthouse、04 素材参考。',
    used_by_skills: ['04', '05', '07a'],
    aliases: ['claude-in-chrome'],
    docs_url: 'https://github.com/anthropics/claude-in-chrome',
  },
  {
    id: 'chrome-devtools',
    name: 'Chrome DevTools',
    category: '浏览器自动化',
    priority: 'optional',
    description: '通过 CDP 控制 Chrome：05 / 07a 自动化测试与性能采集的另一个选择。',
    used_by_skills: ['05', '07a'],
    aliases: ['chrome-devtools', 'cdp', 'puppeteer'],
    docs_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
  },

  // ─── 设计 / 演示 ──────────────────────────────────────────────
  {
    id: 'figma',
    name: 'Figma',
    category: '设计',
    priority: 'optional',
    description: '03 品牌识别 / 04 素材工厂可读取 Figma 文件中的 frame / component / token。',
    used_by_skills: ['03', '04'],
    aliases: ['figma', 'figma-developer-mcp', 'figma-context-mcp'],
    docs_url: 'https://github.com/GLips/Figma-Context-MCP',
  },
  {
    id: 'gamma',
    name: 'Gamma',
    category: '设计 · 演示',
    priority: 'optional',
    description: '04 / 05 输出可演示的 deck / 网页占位；不替代正式建站。',
    used_by_skills: ['04', '05'],
    aliases: ['claude.ai Gamma', 'claude_ai_Gamma', 'gamma'],
    docs_url: 'https://gamma.app/api',
  },
  {
    id: 'stitch',
    name: 'Stitch',
    category: '设计 · UI',
    priority: 'optional',
    description: 'Google Stitch：从描述生成 UI screen / variant / 设计系统，可作为 03 / 05 的草图来源。',
    used_by_skills: ['03', '05'],
    aliases: ['stitch-mcp', 'stitch'],
    docs_url: 'https://stitch.withgoogle.com/',
  },

  // ─── 开发 ──────────────────────────────────────────────────────
  {
    id: 'github',
    name: 'GitHub',
    category: '开发协作',
    priority: 'recommended',
    description: '05 建站推送代码 / 开 PR；其他 skill 可读 issue 上下文。',
    used_by_skills: ['05'],
    aliases: ['github', 'github-mcp'],
    docs_url: 'https://github.com/github/github-mcp-server',
  },

  // ─── 协作 ──────────────────────────────────────────────────────
  {
    id: 'linear',
    name: 'Linear',
    category: '协作 · 任务',
    priority: 'optional',
    description: '把 conversation 里产出的 task 同步到 Linear。',
    used_by_skills: [],
    aliases: ['linear', 'linear-mcp'],
    docs_url: 'https://linear.app/docs/mcp',
  },
  {
    id: 'notion',
    name: 'Notion',
    category: '协作 · 知识库',
    priority: 'optional',
    description: '07b 内容营销草稿 / 03 品牌资料库可同步到 Notion。',
    used_by_skills: ['03', '07b'],
    aliases: ['notion', 'notion-mcp'],
    docs_url: 'https://github.com/makenotion/notion-mcp-server',
  },
  {
    id: 'slack',
    name: 'Slack',
    category: '协作 · 通知',
    priority: 'optional',
    description: '把 awaiting_approval / done 通知推到 Slack 频道。',
    used_by_skills: [],
    aliases: ['slack', 'slack-mcp'],
    docs_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
  },

  // ─── Phase 2 ───────────────────────────────────────────────────
  {
    id: 'google-drive',
    name: 'Google Drive',
    category: 'Phase 2 · 资料',
    priority: 'optional',
    description: '04 素材工厂可读写 Drive 上的设计源文件 / 拍摄成片。',
    used_by_skills: ['04'],
    aliases: ['claude.ai Google Drive', 'claude_ai_Google_Drive', 'google-drive', 'gdrive'],
    docs_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive',
  },
];

interface ConfigShape {
  mcpServers?: Record<string, unknown>;
}

function readJsonOrNull(p: string): ConfigShape | null {
  try {
    if (!existsSync(p)) return null;
    const j = JSON.parse(readFileSync(p, 'utf-8')) as unknown;
    if (j && typeof j === 'object') return j as ConfigShape;
    return null;
  } catch {
    return null;
  }
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function detectInstalledMcps(repoRoot: string): Set<string> {
  const home = process.env.HOME ?? '';
  const candidates = [
    join(home, '.claude.json'),
    join(home, 'Library/Application Support/Claude/claude_desktop_config.json'),
    join(home, '.cursor/mcp.json'),
    resolve(repoRoot, '.mcp.json'),
  ];
  const found = new Set<string>();
  for (const p of candidates) {
    const j = readJsonOrNull(p);
    if (!j?.mcpServers || typeof j.mcpServers !== 'object') continue;
    for (const k of Object.keys(j.mcpServers)) found.add(norm(k));
  }
  return found;
}

export function getMcpStatuses(repoRoot: string): McpStatus[] {
  const installed = detectInstalledMcps(repoRoot);
  return MCP_CATALOG.map((def) => {
    const candidates = [def.id, ...(def.aliases ?? [])].map(norm);
    const connected = candidates.some((c) => installed.has(c));
    return { ...def, connected };
  });
}
