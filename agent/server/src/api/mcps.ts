import type { Hono } from 'hono';
import { getMcpStatuses } from '../mcps/catalog.ts';

export function mountMcpsRoutes(app: Hono, deps: { repoRoot: string }): void {
  app.get('/mcps', (c) => {
    const items = getMcpStatuses(deps.repoRoot);
    const summary = {
      total: items.length,
      connected: items.filter((i) => i.connected).length,
    };
    return c.json({ summary, mcps: items });
  });
}
