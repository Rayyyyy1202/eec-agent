'use client';

import { useState } from 'react';
import { CONTACT_FORM_FIELDS, type ContactField } from '@/lib/customer-service';
import { track } from '@/lib/gtm';

type Status = 'idle' | 'submitting' | 'sent' | 'error';

function FieldInput({
  field,
  value,
  onChange
}: {
  field: ContactField;
  value: string;
  onChange: (v: string) => void;
}) {
  const baseClass =
    'w-full px-3 py-2 rounded text-sm bg-white border border-brand-neutral-3 text-brand-primary placeholder:text-brand-neutral-2 focus:outline-none focus:border-brand-accent';

  if (field.type === 'textarea') {
    return (
      <textarea
        id={field.id}
        name={field.id}
        required={field.required}
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className={baseClass}
      />
    );
  }
  if (field.type === 'select') {
    return (
      <select
        id={field.id}
        name={field.id}
        required={field.required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
      >
        <option value="" disabled>Choose one…</option>
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }
  return (
    <input
      id={field.id}
      name={field.id}
      type={field.type}
      required={field.required}
      maxLength={field.maxLength}
      placeholder={field.placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={baseClass}
    />
  );
}

export default function ContactForm() {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(CONTACT_FORM_FIELDS.map((f) => [f.id, '']))
  );
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(json.reason || 'Something went wrong. Please email support@roborock.us instead.');
        return;
      }
      await track('contact_form_submit', {
        reason: values.reason || 'unspecified',
        has_order_number: Boolean(values.order_number)
      });
      setStatus('sent');
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please email support@roborock.us instead.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="border border-brand-accent rounded-lg p-5 bg-brand-secondary">
        <p className="font-semibold mb-2">Thanks — we got your message.</p>
        <p className="text-sm text-brand-neutral-1">
          A human reads every contact form. You&apos;ll hear back within one business day at the email address you gave us.
          If it&apos;s urgent, email <a href="mailto:support@roborock.us" className="text-brand-accent hover:underline">support@roborock.us</a> directly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {CONTACT_FORM_FIELDS.map((field) => (
        <div key={field.id}>
          <label htmlFor={field.id} className="block text-sm font-medium mb-1">
            {field.label}
            {field.required && <span aria-hidden="true" className="text-brand-accent ml-1">*</span>}
          </label>
          <FieldInput
            field={field}
            value={values[field.id] || ''}
            onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
          />
        </div>
      ))}
      {status === 'error' && errorMsg && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          {errorMsg}
        </p>
      )}
      <button type="submit" disabled={status === 'submitting'} className="btn-accent text-sm">
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
