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
        <header>
          <div className="top-bar">
            <span>(1.805) 565-4000</span>
            <span>info@homesinsantabarbara.com</span>
          </div>
          <nav className="main-nav">
            <Link href="/" className="logo">
              Stroman Properties
            </Link>
            <div className="nav-links">
              <Link href="#">Offerings</Link>
              <Link href="#">About</Link>
              <Link href="#">Neighborhoods</Link>
              <Link href="#">Blog</Link>
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