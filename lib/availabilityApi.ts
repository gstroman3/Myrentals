import { fetchICS, parseICS } from './icsImporter';
import { normalizeICS } from '@/components/utils/tzNormalize';
import { coalesce } from '@/components/utils/coalesce';
import { getBlackouts } from './ownerBlackouts';
import type { AvailabilityFeed, DateRange, ISODate } from '@/components/types';

const PROPERTY_CONFIG: Record<string, { timezone: string; icsUrls: string[]; minNights?: number }> = {
  // Hardcode for now; TODO: load from Supabase later
  'beach-cottage-1': {
    timezone: 'America/New_York',
    icsUrls: ['<PASTE_CLIENT_ICS_URL_HERE>'],
    minNights: 2,
  },
};

export async function getAvailability(args: { propertyId: string; start?: ISODate; end?: ISODate }): Promise<AvailabilityFeed> {
  const cfg = PROPERTY_CONFIG[args.propertyId] ?? { timezone: 'America/New_York', icsUrls: [] };
  const allImported: DateRange[] = [];

  for (const url of cfg.icsUrls) {
    try {
      const ics = await fetchICS(url);
      const raw = parseICS(ics);
      for (const ev of raw) {
        const r = normalizeICS(ev, cfg.timezone);
        allImported.push(r);
      }
    } catch {
      // swallow per-source errors; log if desired
    }
  }

  const booked = coalesce(allImported);
  const blackouts = coalesce(getBlackouts(args.propertyId));

  // Optional: filter to window [start,end) if provided
  const within = (r: DateRange) => {
    if (!args.start && !args.end) return true;
    const s = args.start ?? '0000-01-01';
    const e = args.end ?? '9999-12-31';
    return r.start < e && r.end > s;
  };

  return {
    property_id: args.propertyId,
    booked: booked.filter(within),
    blackouts: blackouts.filter(within),
    min_nights: cfg.minNights ?? 2,
  };
}

// TODO: Replace PROPERTY_CONFIG + blackouts with Supabase queries later.
// TODO: Persist parsed/coalesced imports in DB + cron to avoid reparsing on each request.
