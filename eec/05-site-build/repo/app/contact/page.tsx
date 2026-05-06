import type { Metadata } from 'next';
import HelpNav from '@/components/HelpNav';
import ContactForm from '@/components/ContactForm';
import { CONTACT_METHODS } from '@/lib/customer-service';

export const metadata: Metadata = {
  title: 'Contact us',
  description: "Email, DM, or send us a note. We read every message and reply within a business day."
};

function formatSla(minutes: number): string {
  if (minutes <= 60) return `~${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `~${hours}h`;
  const days = Math.round(hours / 24);
  return `~${days}d`;
}

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-bold mb-3">Contact us</h1>
      <p className="text-brand-neutral-1 mb-2 leading-relaxed">
        Tell us what&apos;s up — we read every message and reply within a business day. The form sends to the same inbox a
        human watches.
      </p>
      <HelpNav active="/contact" />

      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-lg font-bold mb-4">Send us a message</h2>
          <ContactForm />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold mb-4">Other ways to reach us</h2>
          <ul className="space-y-4">
            {CONTACT_METHODS.map((m) => (
              <li key={m.id} className="border border-brand-neutral-3 rounded-lg p-4 bg-white">
                <p className="text-xs uppercase tracking-wider text-brand-neutral-1">{m.label || m.channel}</p>
                <p className="font-semibold mt-1 text-sm break-all">
                  {m.channel === 'email' ? (
                    <a href={`mailto:${m.value}`} className="text-brand-accent hover:underline">{m.value}</a>
                  ) : m.channel === 'phone' ? (
                    <a href={`tel:${m.value}`} className="text-brand-accent hover:underline">{m.value}</a>
                  ) : m.channel === 'social_dm' ? (
                    <a href={m.value} target="_blank" rel="noreferrer noopener" className="text-brand-accent hover:underline">
                      {m.value.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    m.value
                  )}
                </p>
                <p className="text-xs text-brand-neutral-1 mt-2">
                  {m.hoursWindow} · typically responds in <strong>{formatSla(m.slaMinutes)}</strong>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
