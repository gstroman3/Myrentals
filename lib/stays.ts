const DEFAULT_TIME_ZONE = process.env.BOOKINGS_TIME_ZONE ?? 'America/New_York';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: DEFAULT_TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: DEFAULT_TIME_ZONE,
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateOnly(value: string): Date {
  const parts = value.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts.map((part) => Number(part));
    if ([year, month, day].every((part) => Number.isFinite(part))) {
      return new Date(Date.UTC(year, month - 1, day, 12));
    }
  }
  return new Date(value);
}

function parseInputDate(value: string): Date {
  if (!value) {
    return new Date(NaN);
  }
  return value.includes('T') ? new Date(value) : parseDateOnly(value);
}

function toUtcDayValue(value: string): number {
  const date = parseInputDate(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export interface StayDetails {
  checkIn: string;
  checkOut: string;
  checkInDisplay: string;
  checkOutDisplay: string;
  nights: number;
}

export function formatDateDisplay(value: string): string {
  const parsed = parseInputDate(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return dateFormatter.format(parsed);
}

export function formatDateTimeDisplay(value: string): string {
  const parsed = parseInputDate(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return dateTimeFormatter.format(parsed);
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const start = toUtcDayValue(checkIn);
  const end = toUtcDayValue(checkOut);
  const diff = end - start;
  if (!Number.isFinite(diff) || diff <= 0) {
    return 0;
  }
  return Math.round(diff / MS_PER_DAY);
}

export function createStayDetails(checkIn: string, checkOut: string): StayDetails {
  return {
    checkIn,
    checkOut,
    checkInDisplay: formatDateDisplay(checkIn),
    checkOutDisplay: formatDateDisplay(checkOut),
    nights: calculateNights(checkIn, checkOut),
  };
}

interface CalendarBlockLike {
  start_date: string;
  end_date: string;
}

export function createStayDetailsFromBlocks(
  blocks: CalendarBlockLike[],
): StayDetails | null {
  if (!blocks.length) {
    return null;
  }
  const start = blocks.reduce(
    (min, block) => (block.start_date < min ? block.start_date : min),
    blocks[0].start_date,
  );
  const end = blocks.reduce(
    (max, block) => (block.end_date > max ? block.end_date : max),
    blocks[0].end_date,
  );
  return createStayDetails(start, end);
}

export function formatStayRange(details: StayDetails): string {
  const checkInDate = parseInputDate(details.checkIn);
  const checkOutDate = parseInputDate(details.checkOut);
  if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
    return `${details.checkInDisplay} – ${details.checkOutDisplay}`;
  }
  const sameYear = checkInDate.getUTCFullYear() === checkOutDate.getUTCFullYear();
  const sameMonth =
    sameYear && checkInDate.getUTCMonth() === checkOutDate.getUTCMonth();
  const monthDayFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: DEFAULT_TIME_ZONE,
  });
  const endFormatter = sameYear
    ? sameMonth
      ? new Intl.DateTimeFormat('en-US', {
          day: 'numeric',
          timeZone: DEFAULT_TIME_ZONE,
        })
      : monthDayFormatter
    : new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: DEFAULT_TIME_ZONE,
      });

  const startLabel = monthDayFormatter.format(checkInDate);
  const endLabel = endFormatter.format(checkOutDate);
  const yearLabel = sameYear
    ? checkInDate.getUTCFullYear().toString()
    : `${checkInDate.getUTCFullYear()} – ${checkOutDate.getUTCFullYear()}`;

  return `${startLabel} – ${endLabel}, ${yearLabel}`;
}
