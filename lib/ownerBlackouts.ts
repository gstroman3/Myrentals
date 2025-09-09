import type { DateRange } from '@/components/types';

const KEY = (propertyId: string) => `blackouts:${propertyId}`;

export function getBlackouts(propertyId: string): DateRange[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY(propertyId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (r): r is DateRange => typeof r?.start === 'string' && typeof r?.end === 'string'
      );
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveBlackouts(propertyId: string, ranges: DateRange[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY(propertyId), JSON.stringify(ranges));
}

// TODO: Replace with Supabase table "blackouts" later.
