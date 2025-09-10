import {
  parse,
  format,
  startOfDay,
  addDays,
  utcToZonedTime,
  zonedTimeToUtc,
} from '../../lib/date';
import type { DateRange, ICSRawEvent } from '../types';

function parseDate(value: string, tz: string): Date {
  if (/^\d{8}$/.test(value)) {
    const naive = parse(value, 'yyyyMMdd', new Date());
    return zonedTimeToUtc(naive, tz);
  }
  // handles Z or offset via X token
  return parse(value, "yyyyMMdd'T'HHmmssX", new Date());
}

export function normalizeICS(e: ICSRawEvent, tz: string): DateRange {
  const startUtc = parseDate(e.dtstart, tz);
  const endUtc = parseDate(e.dtend, tz);
  const startZ = utcToZonedTime(startUtc, tz);
  const endZ = utcToZonedTime(endUtc, tz);

  const start = e.allDay ? startZ : startOfDay(startZ);
  let end = e.allDay ? endZ : startOfDay(endZ);

  if (end <= start) {
    end = addDays(start, 1);
  }

  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  };
}
