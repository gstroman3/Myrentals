import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import { getAvailability } from '@/lib/availabilityApi';

export default function Page({ params }: { params: { slug: string } }) {
  const propertyId = params.slug; // keep simple for now
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
