import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import { getPropertyBySlug } from '@/lib/properties';
import BookingClient from './BookingClient';

export default async function BookPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const property = getPropertyBySlug(slug);
  if (!property) return notFound();
  const propertyTimezone = process.env.PROPERTY_TIMEZONE ?? 'UTC';
  const holdWindowHours = Number(process.env.HOLD_WINDOW_HOURS ?? '24');

  return (
    <>
      <Header logo="transparent" contact />
      <section className="book-page">
        <div className="booking-heading">
          <h1>Book {property.title}</h1>
          <p>Select your travel dates, review the estimate, and start a 24-hour hold.</p>
        </div>
        <BookingClient
          property={property}
          propertyTimezone={propertyTimezone}
          holdWindowHours={holdWindowHours}
        />
      </section>
    </>
  );
}
