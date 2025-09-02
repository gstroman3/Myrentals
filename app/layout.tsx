import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Stroman Properties',
  description: 'Real estate listings',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/property">Property</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}