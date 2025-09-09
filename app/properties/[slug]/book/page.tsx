import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import availability from '@/lib/availability.json';
import { getPropertyBySlug, properties } from '@/lib/properties';

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = getPropertyBySlug(slug);
  if (!property) return notFound();
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

export function generateStaticParams() {
  return properties.map(({ slug }) => ({ slug }));
}
