'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import Header from '@/components/Header';

const slides = [
  '/images/kitchen/IMG_0186.jpg',
  '/images/living-room/IMG_0190.jpg',
  '/images/backyard/IMG_0201.jpg',
  '/images/loft/IMG_1751.jpg',
];

export default function HomePage(): ReactElement {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <Header overlay />
      <section className="landing-hero">
        <div className="background">
          {slides.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt=""
              fill
              priority={i === 0}
              className={`slide${i === index ? ' active' : ''}`}
            />
          ))}
        </div>
        <div className="content">
          <h1>Luxe Townhome Retreat</h1>
          <p>Your comfortable stay in Ashburn, VA</p>
          <div className="actions">
            <Link href="/properties/#" className="btn">Book Now</Link>
            <Link href="/properties/#" className="btn secondary">View Availability</Link>
          </div>
        </div>
      </section>
    </>
  );
}