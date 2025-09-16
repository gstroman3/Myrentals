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
    const summaryMatch = /SUMMARY(?:;[^:]+)*:(.*)/i.exec(body);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';
    const normalizedSummary = summary.toLowerCase();
    const collapsedSummary = normalizedSummary.replace(/[\s_-]+/g, '');
    const containsNotAvailable =
      /not[\s_-]*available/.test(normalizedSummary) || normalizedSummary.includes('unavailable');
    const containsOwnerIndicator =
      collapsedSummary.includes('owner') && !collapsedSummary.includes('ownerless');
    const containsBlockedIndicator =
      normalizedSummary.includes('blocked') && !normalizedSummary.includes('unblocked');
    const startsWithBlock =
      /^block(\b|[^a-z])/.test(normalizedSummary) ||
      collapsedSummary.startsWith('blockout') ||
      collapsedSummary.startsWith('blockoff');
    const containsCalendarBlock =
      collapsedSummary.includes('calendarblock') ||
      collapsedSummary.includes('blockcalendar') ||
      collapsedSummary.includes('calendarhold');
    const isOwnerBlock =
      summary.length > 0 &&
      (containsNotAvailable ||
        containsOwnerIndicator ||
        containsBlockedIndicator ||
        startsWithBlock ||
        containsCalendarBlock);
    if (start && end && !isOwnerBlock) {
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
