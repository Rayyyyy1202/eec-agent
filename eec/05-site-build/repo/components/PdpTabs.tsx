'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

type Tab = { id: string; label: string; content: ReactNode };

export default function PdpTabs({ tabs, defaultId }: { tabs: Tab[]; defaultId?: string }) {
  const [active, setActive] = useState(defaultId ?? tabs[0]?.id);

  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b border-brand-neutral-3 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setActive(t.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              active === t.id
                ? 'border-brand-accent text-brand-primary'
                : 'border-transparent text-brand-neutral-1 hover:text-brand-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          hidden={active !== t.id}
          className={active === t.id ? 'block' : 'hidden'}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
