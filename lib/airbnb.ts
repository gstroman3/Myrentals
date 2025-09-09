import type { AvailabilityData, DateRange } from './availability';

function formatDate(value: string): string {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

export async function fetchAvailabilityFromIcal(
  url: string,
  propertyId: string,
): Promise<AvailabilityData> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch iCal: ${res.status}`);
  }
  const ics = await res.text();
  const booked: DateRange[] = [];
  const eventRegex = /BEGIN:VEVENT\s+([\s\S]*?)END:VEVENT/g;
  let match: RegExpExecArray | null;
  while ((match = eventRegex.exec(ics)) !== null) {
    const body = match[1];
    const start = /DTSTART(?:;VALUE=DATE)?:(\d{8})/i.exec(body);
    const end = /DTEND(?:;VALUE=DATE)?:(\d{8})/i.exec(body);
    if (start && end) {
      booked.push({ start: formatDate(start[1]), end: formatDate(end[1]) });
    }
  }
  return {
    property_id: propertyId,
    booked,
    blackouts: [],
    min_nights: 1,
  };
}
