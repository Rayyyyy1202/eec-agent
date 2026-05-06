// PII params auto-hashed with SHA-256 before push (per eec-06-tracking).
// Keep this in sync with eec/06-tracking/output.json#/events_spec.

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

const PII_PARAMS = new Set([
  'email',
  'email_hash',
  'customer_email_hash',
  'shipping_address_hash',
  'phone',
  'address'
]);

async function sha256(input: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) return input;
  const buf = new TextEncoder().encode(input.trim().toLowerCase());
  const hash = await window.crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function normalizeParams(params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (PII_PARAMS.has(k) && typeof v === 'string') {
      out[k] = await sha256(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  const normalized = await normalizeParams(params);
  window.dataLayer.push({ event, ...normalized });
}

export function updateConsent(grants: {
  ad_storage?: 'granted' | 'denied';
  analytics_storage?: 'granted' | 'denied';
  ad_user_data?: 'granted' | 'denied';
  ad_personalization?: 'granted' | 'denied';
}) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'consent_update', ...grants });
}
