import type { ReactNode } from 'react';

export default function McpsLayout({ children }: { children: ReactNode }) {
  return <div className="shell">{children}</div>;
}
