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

  useEffect(() => {
    if (window.location.hash === '#about') {
      document.getElementById('about')?.scrollIntoView();
    }
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
      <section id="about" className="alt-section">
        <h1>Luxe Townhome Retreat</h1>
        <h3>Hot Tub • Sauna • Loft Fireplace • Near Bles Park and One Loudoun</h3>
        <p>
          Welcome to your perfect getaway! This spacious <strong>3-bedroom, 3.5-bath
          townhouse</strong> offers a mix of luxury and comfort just minutes from
          everything you need. The master suite features a king-size bed, while
          two additional bedrooms include cozy queens—plenty of space for
          family, friends, or colleagues.
        </p>
        <h3>Resort-Style Amenities</h3>
        <ul>
          <li>Private hot tub for relaxing soaks</li>
          <li>Sauna to unwind and rejuvenate</li>
          <li>Weight room to keep up with your fitness routine</li>
          <li>Top-floor loft with indoor/outdoor fireplace</li>
        </ul>
        <h3>Location Highlights</h3>
        <p>
          Step outside and you’ll find Bles Park just around the corner,
          offering open green space, scenic trails, and the perfect spot for
          outdoor fun. For dining, shopping, and entertainment, head over to One
          Loudoun, where you’ll discover endless options for food, drinks, and
          activities. With easy access to hiking trails and local attractions,
          you’ll have something new to enjoy every day.
        </p>
        <p>
          Whether you’re seeking adventure, relaxation, or a little of both,
          this townhouse is designed to make your stay unforgettable.
        </p>
      </section>
    </>
  );
}