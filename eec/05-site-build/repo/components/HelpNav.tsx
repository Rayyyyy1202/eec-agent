import Link from 'next/link';

const ITEMS = [
  { href: '/help', label: 'FAQ' },
  { href: '/help/setup-videos', label: 'Videos' },
  { href: '/help/manuals', label: 'Manuals' },
  { href: '/help/parts', label: 'Parts' },
  { href: '/contact', label: 'Contact' }
];

export default function HelpNav({ active }: { active: string }) {
  return (
    <nav className="border-b border-brand-neutral-3 mb-8 -mx-4 px-4 overflow-x-auto">
      <ul className="flex gap-6 text-sm font-medium whitespace-nowrap">
        {ITEMS.map((item) => {
          const isActive = item.href === active;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  'inline-block py-3 border-b-2 transition ' +
                  (isActive
                    ? 'border-brand-accent text-brand-primary'
                    : 'border-transparent text-brand-neutral-1 hover:text-brand-primary')
                }
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
