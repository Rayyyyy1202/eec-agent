import type { ReactNode } from 'react';
import './globals.css';
import MagicMouse from '../components/MagicMouse';

export const metadata = {
  title: 'EEC Agent',
  description: 'Brand pipeline workbench',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <MagicMouse />
      </body>
    </html>
  );
}
