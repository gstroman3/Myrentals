import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { getPropertyBySlug } from '@/lib/properties';

export default async function BookPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const property = getPropertyBySlug(slug);
  if (!property) return notFound();

  return (
    <>
      <Header logo="transparent" contact />
      <section className="book-page">
        <h1>Book {property.title}</h1>
        <AvailabilityCalendar />
      </section>
    </>
  );
}
