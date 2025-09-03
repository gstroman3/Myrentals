import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Stroman Properties',
  description: 'Luxury vacation rentals',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}