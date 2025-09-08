"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ReactElement } from 'react';

export default function ScrollButtons(): ReactElement | null {
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const hero = document.querySelector('.landing-hero, .gallery-hero');
    if (!hero) {
      return;
    }
    setEnabled(true);

    const onScroll = () => {
      const rect = (hero as HTMLElement).getBoundingClientRect();
      setVisible(rect.bottom <= 0);
    };

    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    document.body.classList.add('has-scroll-buttons');
    return () => document.body.classList.remove('has-scroll-buttons');
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <div className={`scroll-buttons${visible ? ' visible' : ''}`}>
      <span className="price">$315/night</span>
      <div className="actions">
        <Link href="/properties/#" className="btn">
          Book
        </Link>
        <Link href="/#contact" className="btn outline">
          Contact
        </Link>
      </div>
    </div>
  );
}