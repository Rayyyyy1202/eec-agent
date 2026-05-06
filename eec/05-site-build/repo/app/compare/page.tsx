import type { Metadata } from 'next';
import Link from 'next/link';
import { SKUS, type SpecRow, type Sku } from '@/lib/products';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Compare Roborock models — side-by-side specs',
  description:
    'Suction, battery, mapping, mop, dock — every spec line from S-Series Pro, E-Series Essential, and the Replenish Kit, side-by-side.',
  alternates: { canonical: `${SITE_URL}/compare` }
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE_URL}/compare` }
  ]
};

type CompareRow = {
  compareKey: string;
  label: string;
  values: Record<string, { value: string; unit?: string } | undefined>;
};

type CompareGroup = {
  group: string;
  rows: CompareRow[];
};

function buildMatrix(skus: Sku[]): CompareGroup[] {
  const groupOrder: string[] = [];
  const groupMap = new Map<string, { rowOrder: string[]; rows: Map<string, CompareRow> }>();

  for (const sku of skus) {
    if (!sku.specTable) continue;
    for (const row of sku.specTable) {
      const key = row.compareKey ?? `${row.group}::${row.label}`;
      if (!groupMap.has(row.group)) {
        groupMap.set(row.group, { rowOrder: [], rows: new Map() });
        groupOrder.push(row.group);
      }
      const bucket = groupMap.get(row.group)!;
      let existing = bucket.rows.get(key);
      if (!existing) {
        existing = {
          compareKey: key,
          label: row.label,
          values: {}
        };
        bucket.rows.set(key, existing);
        bucket.rowOrder.push(key);
      }
      existing.values[sku.id] = { value: row.value, unit: row.unit };
    }
  }

  return groupOrder.map((g) => {
    const bucket = groupMap.get(g)!;
    return {
      group: g,
      rows: bucket.rowOrder.map((k) => bucket.rows.get(k)!)
    };
  });
}

function renderCell(cell: { value: string; unit?: string } | undefined): string {
  if (!cell) return '—';
  return cell.unit ? `${cell.value} ${cell.unit}` : cell.value;
}

export default function ComparePage() {
  const matrix = buildMatrix(SKUS);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-10 max-w-3xl">
          <p className="uppercase tracking-widest text-xs text-brand-accent font-semibold mb-3">
            Compare
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-4">
            Side-by-side: every spec, no marketing fluff.
          </h1>
          <p className="text-lg text-brand-neutral-1 leading-relaxed">
            Same row, same number, every time. If a model doesn’t support a feature, the cell is empty —
            we don’t pad it with a checkmark.
          </p>
        </header>

        <div className="grid grid-cols-4 gap-3 mb-6 sticky top-16 bg-brand-secondary z-20 py-4 border-b border-brand-neutral-3">
          <div />
          {SKUS.map((sku) => (
            <div key={sku.id} className="text-center">
              <p className="font-display text-base font-semibold leading-tight">{sku.shortName}</p>
              <p className="text-xs text-brand-neutral-1 mb-2">{sku.tagline}</p>
              <p className="text-lg font-semibold mb-2">${sku.price.amount.toLocaleString()}</p>
              <Link
                href={sku.routePath}
                className="text-xs font-semibold text-brand-accent hover:underline"
              >
                View →
              </Link>
            </div>
          ))}
        </div>

        <div className="space-y-10">
          {matrix.map((g) => (
            <section key={g.group}>
              <h2 className="text-xs uppercase tracking-widest text-brand-accent font-semibold mb-3">
                {g.group}
              </h2>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {g.rows.map((row, idx) => (
                    <tr
                      key={row.compareKey}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-brand-secondary'}
                    >
                      <th
                        scope="row"
                        className="text-left font-medium text-brand-neutral-1 px-3 py-3 align-top w-1/4"
                      >
                        {row.label}
                      </th>
                      {SKUS.map((sku) => {
                        const cell = renderCell(row.values[sku.id]);
                        const missing = cell === '—';
                        return (
                          <td
                            key={sku.id}
                            className={`px-3 py-3 align-top ${missing ? 'text-brand-neutral-2' : 'font-medium'}`}
                          >
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-3 gap-3">
          {SKUS.map((sku) => (
            <Link
              key={sku.id}
              href={sku.routePath}
              className="block border border-brand-neutral-3 rounded-lg p-5 bg-white hover:border-brand-accent transition text-center"
            >
              <p className="font-semibold mb-1">{sku.shortName}</p>
              <p className="text-xs text-brand-neutral-1 mb-3">{sku.tagline}</p>
              <span className="text-sm font-semibold text-brand-accent">View product →</span>
            </Link>
          ))}
        </div>
      </article>
    </>
  );
}
