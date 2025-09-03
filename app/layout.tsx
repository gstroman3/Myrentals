import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
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
        <header>
          <nav className="main-nav">
            <Link href="/" className="logo">
              <Image
                src="/images/logo_white.png"
                alt="Stroman Properties logo"
                width={160}
                height={40}
                priority
              />
            </Link>
            <div className="nav-links">
              <Link href="#">Properties</Link>
              <Link href="#">About</Link>
              <Link href="#">Neighborhoods</Link>
              <Link href="/property" className="btn">
                Contact
              </Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}