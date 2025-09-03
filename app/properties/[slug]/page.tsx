'use client';
import Image from 'next/image';
import { useState, FormEvent } from 'react';
import { useParams, notFound } from 'next/navigation';
import Header from '@/components/Header';
import SectionSlider from '@/components/SectionSlider';
import { getPropertyBySlug } from '@/lib/properties';

export default function PropertyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const property = getPropertyBySlug(slug);

  const [contact, setContact] = useState({ name: '', email: '', message: '' });
  const [booking, setBooking] = useState({ checkIn: '', checkOut: '' });

  if (!property) return notFound();

  const handleContactSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('Contact request submitted');
  };

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
          <LinkButtons />
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

      <section id="contact">
        <h2>Contact the Host</h2>
        <form onSubmit={handleContactSubmit}>
          <input
            type="text"
            placeholder="Name"
            required
            value={contact.name}
            onChange={(e) => setContact({ ...contact, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
          />
          <textarea
            placeholder="Message"
            required
            value={contact.message}
            onChange={(e) => setContact({ ...contact, message: e.target.value })}
          />
          <button type="submit">Send</button>
        </form>
      </section>

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
                { id: 'contact', label: 'Contact' },
                { id: 'book', label: 'Book' },
                ]}
     />
    </>
  );
}

function LinkButtons() {
  return (
    <div className="nav-links">
      <a href="#contact" className="btn">
        Contact
      </a>
      <a href="#book" className="btn">
        Book Now
      </a>
    </div>
  );
}
