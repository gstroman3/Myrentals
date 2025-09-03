import { notFound } from 'next/navigation';
import PropertyDetailClient from './PropertyDetailClient';
import { getPropertyBySlug, properties } from '@/lib/properties';

export default async function PropertyDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = getPropertyBySlug(slug);
  if (!property) return notFound();
  return <PropertyDetailClient property={property} />;
}

export function generateStaticParams() {
  return properties.map(({ slug }) => ({ slug }));
}
