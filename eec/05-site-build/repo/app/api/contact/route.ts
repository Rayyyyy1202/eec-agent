import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Mirrors eec/11b-customer-service/output.json#/contact_form_config.
// MVP stub: always returns 200 + { ok: true, stub: true }. Wire to Resend / SES when RESEND_API_KEY set.
const RESEND_KEY = process.env.RESEND_API_KEY;

type Payload = {
  name?: string;
  email?: string;
  order_number?: string;
  reason?: string;
  message?: string;
};

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, reason: 'Invalid JSON' }, { status: 400 });
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const reason = (body.reason || '').trim();
  const message = (body.message || '').trim();

  if (!name || !email || !reason || !message) {
    return NextResponse.json({ ok: false, reason: 'Missing required fields' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, reason: 'Invalid email address' }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ ok: false, reason: 'Message too long' }, { status: 400 });
  }

  if (!RESEND_KEY) {
    // MVP path: log to stdout (replaced by real ESP call when key is set).
    return NextResponse.json({ ok: true, stub: true });
  }

  // Real path placeholder — wire Resend or AWS SES here.
  return NextResponse.json({ ok: true, stub: false });
}
