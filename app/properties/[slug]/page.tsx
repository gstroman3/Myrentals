import { notFound } from 'next/navigation';
import PropertyDetailClient from './PropertyDetailClient';
import { getPropertyBySlug } from '@/lib/properties';

export default function PropertyDetail({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const property = getPropertyBySlug(slug);
  if (!property) return notFound();
  return <PropertyDetailClient property={property} />;
}
