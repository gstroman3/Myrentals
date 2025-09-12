import { notFound } from 'next/navigation';
import PropertyDetailClient from './PropertyDetailClient';
import { getPropertyBySlug, properties } from '@/lib/properties';

export default function PropertyDetail({
  params,
}: {
  params: { slug: string };
}) {
  const property = getPropertyBySlug(params.slug);
  if (!property) return notFound();
  return <PropertyDetailClient property={property} />;
}

export function generateStaticParams() {
  return properties.map(({ slug }) => ({ slug }));
}
