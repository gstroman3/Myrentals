import { fetchAirbnbCalendarBlocks, insertCalendarBlocks, updateCalendarBlock, updateCalendarBlocks, deleteCalendarBlocks, type CalendarBlockRecord } from '@/lib/calendarBlocks';

interface ParsedEvent {
  uid: string;
  startDate: string;
  endDate: string;
}

interface RawEvent {
  lines: string[];
}

const DATE_ONLY_VALUE = 'DATE';

function unfoldLines(ics: string): string[] {
  const rawLines = ics.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const lines: string[] = [];
  for (const line of rawLines) {
    if (!line) continue;
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (lines.length === 0) {
        continue;
      }
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line.trim());
    }
  }
  return lines;
}

function extractEvents(lines: string[]): RawEvent[] {
  const events: RawEvent[] = [];
  let current: string[] | null = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = [];
    } else if (line === 'END:VEVENT') {
      if (current) {
        events.push({ lines: current });
        current = null;
      }
    } else if (current) {
      current.push(line);
    }
  }
  return events;
}

function formatDateOnly(value: string): string {
  if (!/^\d{8}$/.test(value)) {
    throw new Error(`Invalid date value: ${value}`);
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function formatDateInTimeZone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  if (!year || !month || !day) {
    throw new Error('Failed to format date in timezone');
  }
  return `${year}-${month}-${day}`;
}

function normalizeDateTime(value: string, timezone: string): string {
  if (/^\d{8}$/.test(value)) {
    return formatDateOnly(value);
  }
  let working = value;
  if (/^\d{8}T\d{6}$/.test(working)) {
    working = `${working}Z`;
  }
  if (/^\d{8}T\d{6}Z$/.test(working)) {
    const iso = `${working.slice(0, 4)}-${working.slice(4, 6)}-${working.slice(6, 8)}T${working.slice(9, 11)}:${working.slice(11, 13)}:${working.slice(13, 15)}Z`;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid date-time value: ${value}`);
    }
    return formatDateInTimeZone(date, timezone);
  }
  throw new Error(`Unsupported date value: ${value}`);
}

function parsePropertyLine(line: string): { name: string; params: Record<string, string>; value: string } | null {
  const idx = line.indexOf(':');
  if (idx === -1) return null;
  const left = line.slice(0, idx);
  const value = line.slice(idx + 1);
  const parts = left.split(';');
  const name = parts[0];
  const params: Record<string, string> = {};
  for (let i = 1; i < parts.length; i += 1) {
    const [key, val] = parts[i].split('=');
    if (key && val) {
      params[key.toUpperCase()] = val;
    }
  }
  return { name: name.toUpperCase(), params, value };
}

function parseEvent(raw: RawEvent, timezone: string): ParsedEvent | null {
  let uid: string | null = null;
  let start: string | null = null;
  let end: string | null = null;
  for (const line of raw.lines) {
    const property = parsePropertyLine(line);
    if (!property) continue;
    const { name, params, value } = property;
    if (name === 'UID') {
      uid = value.trim();
    } else if (name === 'DTSTART') {
      try {
        if (params.VALUE === DATE_ONLY_VALUE) {
          start = formatDateOnly(value.trim());
        } else {
          start = normalizeDateTime(value.trim(), timezone);
        }
      } catch (error) {
        console.error('Failed to parse DTSTART', error);
        return null;
      }
    } else if (name === 'DTEND') {
      try {
        if (params.VALUE === DATE_ONLY_VALUE) {
          end = formatDateOnly(value.trim());
        } else {
          end = normalizeDateTime(value.trim(), timezone);
        }
      } catch (error) {
        console.error('Failed to parse DTEND', error);
        return null;
      }
    }
  }
  if (!uid || !start || !end) {
    return null;
  }
  return { uid, startDate: start, endDate: end };
}

export async function fetchAirbnbEventsFromIcs(): Promise<ParsedEvent[]> {
  const url = process.env.AIRBNB_ICS_URL;
  if (!url) {
    throw new Error('AIRBNB_ICS_URL is not set');
  }
  const timezone = process.env.PROPERTY_TIMEZONE;
  if (!timezone) {
    throw new Error('PROPERTY_TIMEZONE is not set');
  }
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to download Airbnb calendar (${response.status})`);
  }
  const ics = await response.text();
  const lines = unfoldLines(ics);
  const events = extractEvents(lines)
    .map((event) => parseEvent(event, timezone))
    .filter((event): event is ParsedEvent => event !== null);
  return events;
}

export interface SyncOptions {
  deleteMissing?: boolean;
  now?: string;
}

export interface SyncResult {
  inserted: number;
  updated: number;
  deleted: number;
  unchanged: number;
}

export async function syncAirbnbCalendar(options: SyncOptions = {}): Promise<SyncResult> {
  const events = await fetchAirbnbEventsFromIcs();
  const existing = await fetchAirbnbCalendarBlocks();
  const now = options.now ?? new Date().toISOString();

  const existingByUid = new Map<string, CalendarBlockRecord>();
  for (const record of existing) {
    if (record.external_ref) {
      existingByUid.set(record.external_ref, record);
    }
  }

  const toInsert: {
    source: string;
    status: string;
    start_date: string;
    end_date: string;
    external_ref: string;
    last_sync_at: string;
  }[] = [];
  const toUpdate: { id: string; start_date: string; end_date: string }[] = [];
  const matchedIds = new Set<string>();
  const unchangedIds = new Set<string>();

  for (const event of events) {
    const match = existingByUid.get(event.uid);
    if (!match) {
      toInsert.push({
        source: 'airbnb_ics',
        status: 'confirmed',
        start_date: event.startDate,
        end_date: event.endDate,
        external_ref: event.uid,
        last_sync_at: now,
      });
      continue;
    }

    matchedIds.add(match.id);
    if (match.start_date !== event.startDate || match.end_date !== event.endDate) {
      toUpdate.push({ id: match.id, start_date: event.startDate, end_date: event.endDate });
    } else {
      unchangedIds.add(match.id);
    }
  }

  await insertCalendarBlocks(toInsert);

  for (const update of toUpdate) {
    await updateCalendarBlock(update.id, {
      start_date: update.start_date,
      end_date: update.end_date,
      last_sync_at: now,
    });
  }

  if (unchangedIds.size > 0) {
    await updateCalendarBlocks(Array.from(unchangedIds), { last_sync_at: now });
  }

  let deleted = 0;
  if (options.deleteMissing) {
    const toDelete = existing
      .filter((record) => record.external_ref && !matchedIds.has(record.id))
      .map((record) => record.id);
    if (toDelete.length) {
      await deleteCalendarBlocks(toDelete);
      deleted = toDelete.length;
    }
  }

  return {
    inserted: toInsert.length,
    updated: toUpdate.length,
    deleted,
    unchanged: unchangedIds.size,
  };
}

export async function ingestAirbnbCalendar(): Promise<{ inserted: number; updated: number; skipped: number }> {
  const events = await fetchAirbnbEventsFromIcs();
  const existing = await fetchAirbnbCalendarBlocks();
  const now = new Date().toISOString();
  const existingByUid = new Map<string, CalendarBlockRecord>();
  for (const record of existing) {
    if (record.external_ref) {
      existingByUid.set(record.external_ref, record);
    }
  }

  const insertPayload = [] as {
    source: string;
    status: string;
    start_date: string;
    end_date: string;
    external_ref: string;
    last_sync_at: string;
  }[];
  const updates: { id: string; start_date: string; end_date: string }[] = [];
  let skipped = 0;

  for (const event of events) {
    const match = existingByUid.get(event.uid);
    if (!match) {
      insertPayload.push({
        source: 'airbnb_ics',
        status: 'confirmed',
        start_date: event.startDate,
        end_date: event.endDate,
        external_ref: event.uid,
        last_sync_at: now,
      });
    } else if (match.start_date !== event.startDate || match.end_date !== event.endDate) {
      updates.push({ id: match.id, start_date: event.startDate, end_date: event.endDate });
    } else {
      skipped += 1;
    }
  }

  await insertCalendarBlocks(insertPayload);
  for (const update of updates) {
    await updateCalendarBlock(update.id, {
      start_date: update.start_date,
      end_date: update.end_date,
      last_sync_at: now,
    });
  }

  if (skipped > 0) {
    const skippedIds = existing
      .filter((record) =>
        record.external_ref && events.some((event) => event.uid === record.external_ref && record.start_date === event.startDate && record.end_date === event.endDate),
      )
      .map((record) => record.id);
    const uniqueSkippedIds = Array.from(new Set(skippedIds));
    await updateCalendarBlocks(uniqueSkippedIds, { last_sync_at: now });
  }

  return {
    inserted: insertPayload.length,
    updated: updates.length,
    skipped,
  };
}

