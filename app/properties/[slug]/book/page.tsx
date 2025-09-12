import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import { properties } from '@/lib/properties';

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: BookPageProps) {
  const { slug: propertyId } = await params;
  return (
    <>
      <h1>Availability for {propertyId}</h1>
      <AvailabilityCalendar
        propertyId={propertyId}
        timezone="America/New_York"
        showOwnerPanel={false} // set true temporarily to test blackouts
      />
    </>
  );
}

export function generateStaticParams() {
  return properties.map(({ slug }) => ({ slug }));
}
