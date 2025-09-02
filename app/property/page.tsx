'use client';
import Image from 'next/image';
import { useState, FormEvent } from 'react';

type ContactForm = {
  name: string;
  email: string;
  message: string;
};

type BookingForm = {
  checkIn: string;
  checkOut: string;
};

type RoomImage = {
  src: string;
  alt: string;
};

export default function PropertyPage() {
  const [contact, setContact] = useState<ContactForm>({ name: '', email: '', message: '' });
  const [booking, setBooking] = useState<BookingForm>({ checkIn: '', checkOut: '' });

  const handleContactSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('Contact request submitted');
  };

  const handleBookingSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('Booking request submitted');
  };

  const roomImages: RoomImage[] = [
    { src: '/images/living-room/IMG_0190.jpg', alt: 'Living Room' },
    { src: '/images/kitchen/IMG_0186.jpg', alt: 'Kitchen' }
  ];

  return (
    <div>
      <h1>Cozy Apartment in City Center</h1>
      <div className="gallery">
        {roomImages.map(({ src, alt }) => (
          <Image key={src} src={src} alt={alt} width={600} height={400} />
        ))}
      </div>

      <section>
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
            onChange={(e) =>
              setContact({ ...contact, message: e.target.value })
            }
          />
          <button type="submit">Send</button>
        </form>
      </section>

      <section>
        <h2>Book This Property</h2>
        <form onSubmit={handleBookingSubmit}>
          <label>
            Check-in
            <input
              type="date"
              required
              value={booking.checkIn}
              onChange={(e) =>
                setBooking({ ...booking, checkIn: e.target.value })
              }
            />
          </label>
          <label>
            Check-out
            <input
              type="date"
              required
              value={booking.checkOut}
              onChange={(e) =>
                setBooking({ ...booking, checkOut: e.target.value })
              }
            />
          </label>
          <button type="submit">Request Booking</button>
        </form>
      </section>
    </div>
  );
}