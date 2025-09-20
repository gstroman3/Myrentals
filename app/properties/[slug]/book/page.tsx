import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import defaultAvailability from '@/lib/availability.json';
import { getPropertyBySlug } from '@/lib/properties';
import { fetchAvailabilityFromIcal } from '@/lib/airbnb';
import type { AvailabilityData } from '@/lib/availability';

export default async function BookPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const property = getPropertyBySlug(slug);
  if (!property) return notFound();

  let availability: AvailabilityData = defaultAvailability;
  if (property.icalUrl) {
    try {
      availability = await fetchAvailabilityFromIcal(property.icalUrl, property.slug);
    } catch (err) {
      console.error('Failed to fetch iCal availability', err);
    }
  }

  return (
    <>
      <Header logo="transparent" contact />
      <section className="book-page">
        <h1>Book {property.title}</h1>
        <AvailabilityCalendar data={availability} />
      </section>
    </>
  );
}
