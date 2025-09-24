"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { ReactElement } from 'react';
import ContactModal from '@/components/ContactModal';

interface HeaderProps {
  overlay?: boolean;
  logo?: 'white' | 'transparent';
  contact?: boolean;
}

export default function Header({
  overlay = false,
  logo = 'white',
  contact = false,
}: HeaderProps): ReactElement {
  const [contactOpen, setContactOpen] = useState(false);
  const logoSrc =
    logo === 'transparent'
      ? '/images/logo_transparent.png'
      : '/images/logo_white.png';
  return (
    <header className={overlay ? 'header-overlay' : undefined}>
      <nav className="main-nav">
        <Link href="/" className="logo">
          <Image
            src={logoSrc}
            alt="Stroman Properties logo"
            width={160}
            height={40}
            priority
          />
        </Link>
        <div className="nav-links">
          <Link href="/#about">About</Link>
          <Link href="/properties">Gallery</Link>
          {contact ? (
            <button type="button" onClick={() => setContactOpen(true)}>
              Contact
            </button>
          ) : (
            <Link href="/properties/ashburn-estate/book">Book</Link>
          )}
        </div>
      </nav>
      {contact && (
        <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      )}
    </header>
  );
}