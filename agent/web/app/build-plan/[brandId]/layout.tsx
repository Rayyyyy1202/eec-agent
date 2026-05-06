import type { ReactNode } from 'react';

export default function BuildPlanLayout({ children }: { children: ReactNode }) {
  return <div className="shell shell-buildplan">{children}</div>;
}
