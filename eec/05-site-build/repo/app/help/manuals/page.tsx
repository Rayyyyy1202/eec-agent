import type { Metadata } from 'next';
import Link from 'next/link';
import HelpNav from '@/components/HelpNav';
import { MANUALS, formatFileSize } from '@/lib/customer-service';
import { getSkuById } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Product manuals',
  description: 'Downloadable PDF manuals for every Roborock product, in English.'
};

export default function ManualsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-bold mb-3">Product manuals</h1>
      <p className="text-brand-neutral-1 mb-2 leading-relaxed">
        Every model, every revision, every language we ship in. Need large-print or audio? Email{' '}
        <a href="mailto:accessibility@roborock.us" className="text-brand-accent hover:underline">
          accessibility@roborock.us
        </a>
        .
      </p>
      <HelpNav active="/help/manuals" />

      <ul className="space-y-3">
        {MANUALS.map((m) => {
          const sku = getSkuById(m.skuId);
          return (
            <li
              key={`${m.skuId}-${m.language}`}
              className="border border-brand-neutral-3 rounded-lg p-4 bg-white flex items-center justify-between gap-4"
            >
              <div>
                <h2 className="font-semibold text-base">{sku ? sku.name : m.skuId}</h2>
                <p className="text-xs text-brand-neutral-1 mt-1">
                  Manual {m.version || ''} · {m.language.toUpperCase()}
                  {m.pageCount ? ` · ${m.pageCount} pages` : ''}
                  {m.fileSizeKb ? ` · ${formatFileSize(m.fileSizeKb)} PDF` : ''}
                </p>
              </div>
              <a
                href={m.pdfUrl}
                download
                className="btn-outline text-sm shrink-0"
                aria-label={`Download manual for ${sku ? sku.name : m.skuId}`}
              >
                Download
              </a>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-brand-neutral-1 mt-8 italic">
        PDFs are placeholders in this build. Drop real files at <code>public/manuals/&lt;sku_id&gt;-&lt;lang&gt;.pdf</code> to
        replace; the URL paths above are stable.
      </p>

      <div className="mt-8 p-5 bg-brand-secondary rounded-lg border-l-4 border-brand-accent">
        <p className="text-sm font-semibold mb-1">Looking for setup help?</p>
        <p className="text-sm text-brand-neutral-1">
          The <Link href="/help/setup-videos" className="text-brand-accent hover:underline">videos page</Link> covers the
          first 90 seconds of unboxing and the seven most common &ldquo;stuck&rdquo; fixes — usually faster than the manual.
        </p>
      </div>
    </div>
  );
}
