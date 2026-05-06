// Mirrors eec/11b-customer-service/output.json. Loaded by /contact, /help index, /help/* sub-routes, and ChatWidget.

export type ContactChannel = 'email' | 'phone' | 'live_chat' | 'web_form' | 'social_dm';

export type ContactMethod = {
  id: string;
  channel: ContactChannel;
  value: string;
  hoursWindow: string;
  slaMinutes: number;
  languages?: string[];
  label?: string;
};

export type LiveChatProvider = {
  mode: 'intercom' | 'zendesk' | 'crisp' | 'drift' | 'tidio' | 'none';
  stubUntil: string;
  consentCategory: 'functional' | 'marketing';
  widgetAppIdEnvVar?: string;
};

export type VideoTutorial = {
  id: string;
  title: string;
  youtubeId: string;
  durationSeconds: number;
  topic: 'setup' | 'troubleshooting' | 'maintenance' | 'feature_walkthrough';
  relatedSkuIds?: string[];
  transcriptSummary?: string;
};

export type Manual = {
  skuId: string;
  pdfUrl: string;
  language: string;
  version?: string;
  fileSizeKb?: number;
  pageCount?: number;
};

export type Part = {
  parentSkuId: string;
  replacementSkuId: string;
  fitmentNote: string;
  replacementIntervalDays?: number;
  partType?: 'filter' | 'brush' | 'mop_pad' | 'battery' | 'wheel' | 'dustbin' | 'kit';
};

export type EscalationRule = { trigger: string; action: string; slaMinutes: number };

export type ContactField = {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
  placeholder?: string;
  maxLength?: number;
};

export const CONTACT_METHODS: ContactMethod[] = [
  {
    id: 'contact_001',
    channel: 'email',
    value: 'support@roborock.us',
    hoursWindow: 'Mon-Fri 7am-7pm PT, Sat 9am-3pm PT',
    slaMinutes: 60,
    languages: ['en'],
    label: 'Email a human'
  },
  {
    id: 'contact_002',
    channel: 'web_form',
    value: '/contact',
    hoursWindow: '24/7 (replies in business hours)',
    slaMinutes: 1440,
    languages: ['en'],
    label: 'Contact form'
  },
  {
    id: 'contact_003',
    channel: 'social_dm',
    value: 'https://www.instagram.com/roborock_us',
    hoursWindow: 'Mon-Fri 9am-6pm PT',
    slaMinutes: 240,
    languages: ['en'],
    label: 'DM us on Instagram'
  }
];

export const LIVE_CHAT_PROVIDER: LiveChatProvider = {
  mode: 'none',
  stubUntil: 'never',
  consentCategory: 'functional'
};

export const VIDEO_TUTORIALS: VideoTutorial[] = [
  {
    id: 'video_001',
    title: 'Roborock first-time setup in 90 seconds',
    youtubeId: 'dQw4w9WgXcQ',
    durationSeconds: 90,
    topic: 'setup',
    relatedSkuIds: ['sku_001', 'sku_002'],
    transcriptSummary:
      'Plug dock against a flat wall with 1m clearance each side. Open Roborock app, scan QR on robot, follow pairing wizard. First map takes 25 minutes — let it finish before starting any clean.'
  },
  {
    id: 'video_002',
    title: 'Why your Roborock keeps getting stuck — top 7 fixes',
    youtubeId: 'dQw4w9WgXcQ',
    durationSeconds: 165,
    topic: 'troubleshooting',
    relatedSkuIds: ['sku_001', 'sku_002'],
    transcriptSummary:
      'Cable spaghetti under desks, dark/high-pile rugs (cliff sensor false-positive), 1.5cm threshold strips, chair legs in the under-3cm zone, sock pickup, dust bin full, mop pad too wet on transitions.'
  },
  {
    id: 'video_003',
    title: 'Replacing your filter, brush, and mop pads',
    youtubeId: 'dQw4w9WgXcQ',
    durationSeconds: 120,
    topic: 'maintenance',
    relatedSkuIds: ['sku_001', 'sku_002', 'sku_003'],
    transcriptSummary:
      'Filter every 60-90 days (30-45 with pets). Main brush every 6-12 months. Side brushes every 3-6 months. Mop pads every ~50 washes or when fraying.'
  },
  {
    id: 'video_004',
    title: 'Setting up no-go zones and virtual walls in the app',
    youtubeId: 'dQw4w9WgXcQ',
    durationSeconds: 75,
    topic: 'feature_walkthrough',
    relatedSkuIds: ['sku_001'],
    transcriptSummary:
      'Open the map, tap Edit Map, drag rectangles for no-go zones (around pet bowls), or draw lines for virtual walls (across doorways).'
  },
  {
    id: 'video_005',
    title: 'When to deep-clean the dock vs. the robot itself',
    youtubeId: 'dQw4w9WgXcQ',
    durationSeconds: 95,
    topic: 'maintenance',
    relatedSkuIds: ['sku_001'],
    transcriptSummary:
      'Dock: empty waste-water tank weekly, refill clean-water tank weekly, scrub the auto-wash basin monthly. Robot: rinse the dustbin filter monthly under cold water, dry 24h.'
  }
];

export const MANUALS: Manual[] = [
  { skuId: 'sku_001', pdfUrl: '/manuals/sku_001-en.pdf', language: 'en', version: 'v1.2', fileSizeKb: 4200, pageCount: 32 },
  { skuId: 'sku_002', pdfUrl: '/manuals/sku_002-en.pdf', language: 'en', version: 'v1.1', fileSizeKb: 3100, pageCount: 24 },
  { skuId: 'sku_003', pdfUrl: '/manuals/sku_003-en.pdf', language: 'en', version: 'v1.0', fileSizeKb: 800, pageCount: 8 }
];

export const PARTS_FINDER: Part[] = [
  {
    parentSkuId: 'sku_001',
    replacementSkuId: 'sku_003',
    fitmentNote:
      'Fits all S-Series Pro generations (2024+). Snap-out replacement, no tools. Includes 2 HEPA filters, 1 main brush, 2 side brushes, 4 mop pads.',
    replacementIntervalDays: 180,
    partType: 'kit'
  },
  {
    parentSkuId: 'sku_002',
    replacementSkuId: 'sku_003',
    fitmentNote:
      'Same Replenish Kit fits both S-Series Pro and E-Series Essential. The mop pads in the kit are unused on the E-Series — keep as spares.',
    replacementIntervalDays: 180,
    partType: 'kit'
  }
];

export const ESCALATION_RULES: EscalationRule[] = [
  {
    trigger: 'Refund request > $200 (excluding Replenish Kit)',
    action: 'Escalate to human supervisor; auto-acknowledge within 1h with timeline expectation. Do NOT respond by template.',
    slaMinutes: 60
  },
  {
    trigger: 'Negative sentiment in 2+ consecutive messages',
    action: 'Hand off to senior CS rep; tag thread "recovery"; senior reviews full thread before reply.',
    slaMinutes: 30
  },
  {
    trigger: 'Battery / fire / smoke / personal injury report (any product)',
    action: 'Page on-call lead immediately by SMS + Slack. Stop sale of affected unit pending root-cause review.',
    slaMinutes: 5
  },
  {
    trigger: 'Warranty claim with photo or video evidence (clear defect)',
    action: 'Auto-RMA via warranty@roborock.us; ship prepaid return label same day; replacement on receipt.',
    slaMinutes: 1440
  },
  {
    trigger: 'Order tracking shows no movement > 7 days post-ship',
    action: 'Refund preauth at full order value; file carrier claim; ship replacement immediately at our cost.',
    slaMinutes: 240
  }
];

export const CONTACT_FORM_FIELDS: ContactField[] = [
  { id: 'name', label: 'Your name', type: 'text', required: true, maxLength: 100 },
  { id: 'email', label: 'Email', type: 'email', required: true, maxLength: 200 },
  { id: 'order_number', label: 'Order # (optional)', type: 'text', required: false, placeholder: 'RBR-12345', maxLength: 30 },
  {
    id: 'reason',
    label: "What's this about?",
    type: 'select',
    required: true,
    options: ['Order status', 'Return / refund', 'Warranty claim', 'Product question', 'Setup help', 'Press / wholesale', 'Other']
  },
  {
    id: 'message',
    label: "Tell us what's up",
    type: 'textarea',
    required: true,
    maxLength: 2000,
    placeholder: "Order number, model, and what's happening. We read every message."
  }
];

export function getVideosByTopic(topic: VideoTutorial['topic']): VideoTutorial[] {
  return VIDEO_TUTORIALS.filter((v) => v.topic === topic);
}

export function getManualForSku(skuId: string): Manual | undefined {
  return MANUALS.find((m) => m.skuId === skuId);
}

export function getPartsForSku(skuId: string): Part[] {
  return PARTS_FINDER.filter((p) => p.parentSkuId === skuId);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

export function formatFileSize(kb?: number): string {
  if (!kb) return '';
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
