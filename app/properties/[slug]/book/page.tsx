import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import { properties } from '@/lib/properties';

interface BookPageProps {
  params: { slug: string };
}

export default function Page({ params }: BookPageProps) {
  const { slug: propertyId } = params;
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
