import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import { getAvailability } from '@/lib/availabilityApi';

interface BookPageProps {
  params: Promise<{ slug: string }>;
  /**
   * @deprecated searchParams are unused for booking pages.
   */
  searchParams?: Promise<Record<string, string | string[]>>;
}

export default async function Page({ params }: BookPageProps) {
  const { slug: propertyId } = await params; // keep simple for now
  return (
    <>
      <h1>Availability for {propertyId}</h1>
      <AvailabilityCalendar
        propertyId={propertyId}
        timezone="America/New_York"
        fetchAvailability={getAvailability}
        showOwnerPanel={false} // set true temporarily to test blackouts
      />
    </>
  );
}
