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

type Room = {
  title: string;
  images: RoomImage[];
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

  const rooms: Room[] = [
    {
      title: 'Backyard',
      images: [
        { src: '/images/backyard/IMG_0198.jpg', alt: 'Backyard view' },
        { src: '/images/backyard/IMG_0201.jpg', alt: 'Backyard view 2' },
      ],
    },
    {
      title: 'Deck',
      images: [
        { src: '/images/deck/IMG_1763.jpg', alt: 'Deck 1' },
        { src: '/images/deck/IMG_1765.jpg', alt: 'Deck 2' },
      ],
    },
    {
      title: 'Dining',
      images: [{ src: '/images/dining/IMG_0189.jpg', alt: 'Dining Room' }],
    },
    {
      title: 'First Floor Bath',
      images: [
        { src: '/images/first-floor-bath/IMG_0204.jpg', alt: 'First floor bath 1' },
        { src: '/images/first-floor-bath/IMG_0210.jpg', alt: 'First floor bath 2' },
      ],
    },
    {
      title: 'Guest Bedroom One',
      images: [
        { src: '/images/guest-bedroom-one/IMG_1206.jpg', alt: 'Guest bedroom one 1' },
        { src: '/images/guest-bedroom-one/IMG_1208.jpg', alt: 'Guest bedroom one 2' },
      ],
    },
    {
      title: 'Guest Bedroom Two',
      images: [
        { src: '/images/guest-bedroom-two/IMG_1212.jpg', alt: 'Guest bedroom two 1' },
        { src: '/images/guest-bedroom-two/IMG_1213.jpg', alt: 'Guest bedroom two 2' },
      ],
    },
    {
      title: 'Kitchen',
      images: [
        { src: '/images/kitchen/IMG_0186.jpg', alt: 'Kitchen 1' },
        { src: '/images/kitchen/IMG_0187.jpg', alt: 'Kitchen 2' },
        { src: '/images/kitchen/IMG_0188.jpg', alt: 'Kitchen 3' },
      ],
    },
    {
      title: 'Living Room',
      images: [
        { src: '/images/living-room/IMG_0190.jpg', alt: 'Living room 1' },
        { src: '/images/living-room/IMG_0191.jpg', alt: 'Living room 2' },
      ],
    },
    {
      title: 'Loft',
      images: [
        { src: '/images/loft/IMG_1751.jpg', alt: 'Loft 1' },
        { src: '/images/loft/IMG_1752.jpg', alt: 'Loft 2' },
        { src: '/images/loft/IMG_1754.jpg', alt: 'Loft 3' },
        { src: '/images/loft/IMG_1755.jpg', alt: 'Loft 4' },
        { src: '/images/loft/IMG_1756.jpg', alt: 'Loft 5' },
        { src: '/images/loft/IMG_1757.jpg', alt: 'Loft 6' },
      ],
    },
    {
      title: 'Master Bedroom',
      images: [
        { src: '/images/master-bed/IMG_1746.jpg', alt: 'Master bedroom 1' },
        { src: '/images/master-bed/IMG_1749.jpg', alt: 'Master bedroom 2' },
        { src: '/images/master-bed/IMG_1750.jpg', alt: 'Master bedroom 3' },
        { src: '/images/master-bed/IMG_1759.jpg', alt: 'Master bedroom 4' },
      ],
    },
    {
      title: 'Sauna',
      images: [{ src: '/images/sauna/IMG_0195.jpg', alt: 'Sauna' }],
    },
    {
      title: 'Shared Guest Bath',
      images: [
        { src: '/images/shared-guest-bath/IMG_1217.jpg', alt: 'Shared guest bath' },
      ],
    },
    {
      title: 'Weight Room',
      images: [{ src: '/images/weight-room/IMG_0212.jpg', alt: 'Weight room' }],
    },
  ];

  const heroImage = {
    src: '/images/backyard/IMG_0198.jpg',
    alt: 'Luxury home exterior',
  }

  return (
      <div>
      <section className="hero">
        <div className="text">
          <p className="eyebrow">View the extraordinary</p>
          <h1>Homes in Santa Barbara</h1>
          <p>
            Stroman Properties showcases this premier Santa Barbara estate with
            expansive amenities and stunning views.
          </p>
          <a href="#gallery" className="btn">
            View Our Properties
          </a>
        </div>
        <div className="hero-image">
          <Image
            src={heroImage.src}
            alt={heroImage.alt}
            width={600}
            height={400}
          />
        </div>
      </section>

      <section id="gallery">
        {rooms.map((room) => (
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