import { NextResponse, type NextRequest } from 'next/server';

const MAINTENANCE_PATH = '/maintenance';

const BYPASS_PREFIXES = [
  MAINTENANCE_PATH,
  '/api',
  '/_next',
  '/og',
  '/manuals',
  '/spec-sheets'
];

const BYPASS_FILES = new Set([
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
]);

export function middleware(req: NextRequest) {
  if (process.env.MAINTENANCE_MODE !== 'true') {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;

  if (BYPASS_FILES.has(pathname)) return NextResponse.next();
  for (const prefix of BYPASS_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return NextResponse.next();
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = MAINTENANCE_PATH;
  return NextResponse.rewrite(url, { status: 503 });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)']
};
