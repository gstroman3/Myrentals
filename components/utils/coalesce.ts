import type { DateRange } from '../types';

export function coalesce(ranges: DateRange[]): DateRange[] {
  if (!ranges.length) return [];
  const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start));
  const merged: DateRange[] = [];
  let cur = { ...sorted[0] };
  for (const r of sorted.slice(1)) {
    if (r.start <= cur.end) {
      if (r.end > cur.end) cur.end = r.end;
    } else {
      merged.push(cur);
      cur = { ...r };
    }
  }
  merged.push(cur);
  return merged;
}
