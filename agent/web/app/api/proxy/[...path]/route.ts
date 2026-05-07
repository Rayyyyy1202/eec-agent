import { NextRequest } from 'next/server';

const AGENT = process.env.AGENT_SERVER_URL ?? 'http://localhost:3001';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
{
  const u = new URL(AGENT);
  if (!LOOPBACK_HOSTS.has(u.hostname)) {
    throw new Error(
      `AGENT_SERVER_URL must point to a loopback address; got ${u.hostname}`,
    );
  }
}

const ALLOW_RESPONSE_HEADERS = new Set([
  'content-type',
  'content-length',
  'cache-control',
  'transfer-encoding',
  'content-disposition',
]);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function proxy(req: NextRequest, params: { path: string[] }) {
  const target = `${AGENT}/${params.path.join('/')}${req.nextUrl.search}`;
  const ct = req.headers.get('content-type') ?? 'application/json';
  const init: RequestInit = {
    method: req.method,
    headers: { 'content-type': ct },
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (ct.startsWith('application/json') || ct.startsWith('text/')) {
      init.body = await req.text();
    } else {
      init.body = await req.arrayBuffer();
    }
  }
  const res = await fetch(target, init);
  const headers = new Headers();
  res.headers.forEach((v, k) => {
    if (ALLOW_RESPONSE_HEADERS.has(k.toLowerCase())) headers.set(k, v);
  });
  return new Response(res.body, { status: res.status, headers });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const params = await ctx.params;
  return proxy(req, params);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const params = await ctx.params;
  return proxy(req, params);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const params = await ctx.params;
  return proxy(req, params);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const params = await ctx.params;
  return proxy(req, params);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const params = await ctx.params;
  return proxy(req, params);
}
