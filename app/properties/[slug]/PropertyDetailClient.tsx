'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import Header from '@/components/Header';
import SectionSlider from '@/components/SectionSlider';
import ContactModal from '@/components/ContactModal';
import type { Property } from '@/lib/properties';

interface PropertyDetailClientProps {
  property: Property;
}

export default function PropertyDetailClient({ property }: PropertyDetailClientProps) {
  const [contactOpen, setContactOpen] = useState(false);
  const [booking, setBooking] = useState({ checkIn: '', checkOut: '' });

  const handleBookingSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('Booking request submitted');
  };

  return (
    <>
      <Header />
      <section id="hero" className="hero">
        <div className="text">
          <p className="eyebrow">{property.location}</p>
          <h1>{property.title}</h1>
          <LinkButtons onContact={() => setContactOpen(true)} slug={property.slug} />
        </div>
        <div className="hero-image">
          <Image
            src={property.hero.src}
            alt={property.hero.alt}
            width={600}
            height={400}
          />
        </div>
      </section>

      <section id="gallery">
        {property.rooms.map((room) => (
          <div key={room.title}>
            <h2>{room.title}</h2>
            <div className="gallery">
              {room.images.map((img) => (
                <Image
                  key={img.src}
                  src={img.src}
                  alt={img.alt}
                  width={600}
                  height={400}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

      <section id="book">
        <h2>Book This Property</h2>
        <form onSubmit={handleBookingSubmit}>
          <label>
            Check-in
            <input
              type="date"
              required
              value={booking.checkIn}
              onChange={(e) => setBooking({ ...booking, checkIn: e.target.value })}
            />
          </label>
          <label>
            Check-out
            <input
              type="date"
              required
              value={booking.checkOut}
              onChange={(e) => setBooking({ ...booking, checkOut: e.target.value })}
            />
          </label>
          <button type="submit">Request Booking</button>
        </form>
      </section>
      <SectionSlider
        sections={[
          { id: 'hero', label: 'Overview' },
          { id: 'gallery', label: 'Gallery' },
          { id: 'book', label: 'Book' }
        ]}
      />
    </>
  );
}

function LinkButtons({ onContact, slug }: { onContact: () => void; slug: string }) {
  return (
    <div className="nav-links">
      <button className="btn" onClick={onContact}>
        Contact
      </button>
      <Link href={`/properties/${slug}/book`} className="btn">
        Book Now
      </Link>
    </div>
  );
}
