import type { ICSRawEvent } from '@/components/types';

export async function fetchICS(url: string): Promise<string> {
  const res = await fetch(url);
  return res.text();
}

export function parseICS(ics: string): ICSRawEvent[] {
  const events: ICSRawEvent[] = [];
  const lines = ics.split(/\r?\n/);
  let cur: Partial<ICSRawEvent> | null = null;
  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      cur = {};
    } else if (line.startsWith('END:VEVENT')) {
      if (cur && cur.dtstart && cur.dtend) {
        const allDay =
          /^\d{8}$/.test(cur.dtstart) && /^\d{8}$/.test(cur.dtend) ||
          (cur.dtstart.endsWith('T000000') && cur.dtend.endsWith('T000000'));
        events.push({
          dtstart: cur.dtstart,
          dtend: cur.dtend,
          allDay,
          uid: cur.uid,
          summary: cur.summary,
        });
      }
      cur = null;
    } else if (cur) {
      if (line.startsWith('DTSTART')) {
        cur.dtstart = line.substring(line.indexOf(':') + 1);
      } else if (line.startsWith('DTEND')) {
        cur.dtend = line.substring(line.indexOf(':') + 1);
      } else if (line.startsWith('UID')) {
        cur.uid = line.substring(line.indexOf(':') + 1);
      } else if (line.startsWith('SUMMARY')) {
        cur.summary = line.substring(line.indexOf(':') + 1);
      }
    }
  }
  return events;
}
