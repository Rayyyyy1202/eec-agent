'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@/lib/gtm';

const ALGOLIA_READY = Boolean(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID && process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
);

export default function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState('');

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    void track('search', { search_term: term, provider: ALGOLIA_READY ? 'algolia' : 'fallback' });
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="hidden md:flex items-center"
      role="search"
      aria-label="Site search"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={ALGOLIA_READY ? 'Search…' : 'Search (offline)'}
        className="text-sm border border-brand-neutral-3 rounded-full px-3 py-1 w-44 focus:outline-none focus:border-brand-accent bg-white"
        aria-label="Search Roborock"
      />
    </form>
  );
}
