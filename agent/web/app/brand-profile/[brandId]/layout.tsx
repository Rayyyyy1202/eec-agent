import type { ReactNode } from 'react';

export default function BrandProfileLayout({ children }: { children: ReactNode }) {
  return <div className="shell">{children}</div>;
}
