import { notFound } from 'next/navigation';
import PropertyDetailClient from './PropertyDetailClient';
import { getPropertyBySlug, properties } from '@/lib/properties';

interface PropertyDetailProps {
  params: Promise<{ slug: string }>;
 }

export default async function PropertyDetail({ params }: PropertyDetailProps) {
  const { slug } = await params;
  const property = getPropertyBySlug(slug);
  if (!property) return notFound();
  return <PropertyDetailClient property={property} />;
}

export function generateStaticParams() {
  return properties.map(({ slug }) => ({ slug }));
}