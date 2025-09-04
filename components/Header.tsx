"use client";

import Link from 'next/link';
import Image from 'next/image';
import type { ReactElement } from 'react';

interface HeaderProps {
  overlay?: boolean;
}

export default function Header({ overlay = false }: HeaderProps): ReactElement {
  return (
    <header className={overlay ? 'header-overlay' : undefined}>
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
          <Link href="/#about">About</Link>
          <Link href="/properties">Gallery</Link>
          <Link href="#">Book</Link>
        </div>
      </nav>
    </header>
  );
}