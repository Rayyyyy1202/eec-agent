// Affirm/Klarna messaging slot. Real bindings drop in once provider env vars are set;
// until then, render a structured placeholder so the price area still tells the financing story.
const AFFIRM_READY = Boolean(process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_API_KEY);
const KLARNA_READY = Boolean(process.env.NEXT_PUBLIC_KLARNA_CLIENT_ID);

function fmt(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `$${amount.toLocaleString()}`;
  }
}

export default function PaymentMessaging({
  amount,
  currency = 'USD'
}: {
  amount: number;
  currency?: string;
}) {
  if (amount < 50) return null;
  const monthly = Math.ceil(amount / 12);
  return (
    <p
      className="text-xs text-brand-neutral-1 mt-2"
      data-affirm-ready={AFFIRM_READY ? 'true' : 'false'}
      data-klarna-ready={KLARNA_READY ? 'true' : 'false'}
    >
      or <span className="font-semibold text-brand-primary">{fmt(monthly, currency)}/mo</span> with
      Affirm or Klarna ·{' '}
      <a href="/pages/financing" className="underline hover:text-brand-accent">
        See full terms
      </a>
    </p>
  );
}
