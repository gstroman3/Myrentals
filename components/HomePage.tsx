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

        <article className="about-article">
          <h2>About the Area: Ashburn, Virginia</h2>
          <p>
            Welcome to Ashburn, Virginia—one of Northern Virginia’s most vibrant
            and convenient destinations. Whether you’re here for a relaxing
            weekend getaway, a family adventure, or a quick trip to explore the
            nation’s capital, Ashburn places you at the center of it all.
          </p>
          <h3>A Hub of Fun and Entertainment</h3>
          <p>
            Just minutes from your doorstep, you’ll find Topgolf Ashburn, the
            perfect spot to swing a club, enjoy music, and grab food and drinks
            with friends. It’s not just golf—it’s a full-scale entertainment
            experience that appeals to all ages.
          </p>
          <div className="image-placeholder">📸 Topgolf photo</div>
          <h3>Explore the Wonders of Flight</h3>
          <p>
            If you’re fascinated by history, technology, or space, the Steven F.
            Udvar-Hazy Center (part of the Smithsonian National Air and Space
            Museum) is a must-visit. Located right next to Dulles International
            Airport, the museum houses awe-inspiring aircraft and spacecraft,
            including the Space Shuttle Discovery. It’s an experience that brings
            aviation and space exploration to life.
          </p>
          <div className="image-placeholder">📸 Udvar-Hazy Museum photo</div>
          <h3>A Gateway to the Nation’s Capital</h3>
          <p>
            Ashburn is also perfectly positioned for day trips into Washington,
            D.C. In less than an hour, you can explore iconic landmarks such as
            the U.S. Capitol, the National Mall, and the Smithsonian museums.
            Spend the day sightseeing, then return to Ashburn to unwind in a
            quieter, more relaxed setting.
          </p>
          <div className="image-placeholder">📸 Washington, D.C. photo</div>
          <h3>Nature, Parks, and Local Charm</h3>
          <p>
            If you’re looking to slow down, Ashburn and Loudoun County are home
            to scenic parks, trails, and wineries. Stroll along the Potomac
            River, bike through the Washington &amp; Old Dominion Trail, or enjoy
            a glass of wine at one of the region’s many award-winning vineyards.
            Ashburn offers the perfect balance of adventure and relaxation.
          </p>
          <h3>The Perfect Balance</h3>
          <p>
            Whether your idea of the perfect trip is exploring world-famous
            museums, enjoying vibrant nightlife, or simply taking time to
            recharge, Ashburn, Virginia is an ideal starting point. Here,
            you’ll find a little bit of everything—city access, cultural gems,
            and the beauty of nature—all within reach.
          </p>
        </article>
      </section>
    </>
  );
}