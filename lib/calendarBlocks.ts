import { supabaseJson, supabaseRequest } from '@/lib/supabase/rest';

export interface CalendarBlockRecord {
  id: string;
  source: string;
  status: string;
  start_date: string;
  end_date: string;
  external_ref: string | null;
  last_sync_at?: string | null;
}

export type CalendarBlockResponse = Pick<
  CalendarBlockRecord,
  'id' | 'source' | 'status' | 'start_date' | 'end_date'
>;

export interface CalendarBlockInsert {
  source: string;
  status: string;
  start_date: string;
  end_date: string;
  external_ref?: string | null;
  last_sync_at?: string | null;
}

export interface CalendarBlockUpdate {
  start_date?: string;
  end_date?: string;
  status?: string;
  last_sync_at?: string | null;
}

export async function fetchAllCalendarBlocks(): Promise<CalendarBlockResponse[]> {
  return supabaseJson<CalendarBlockResponse[]>(
    '/calendar_blocks?select=id,source,status,start_date,end_date&order=start_date',
  );
}

export async function fetchAirbnbCalendarBlocks(): Promise<CalendarBlockRecord[]> {
  return supabaseJson<CalendarBlockRecord[]>(
    '/calendar_blocks?select=id,source,status,start_date,end_date,external_ref,last_sync_at&source=eq.airbnb_ics',
  );
}

export async function insertCalendarBlocks(blocks: CalendarBlockInsert[]): Promise<void> {
  if (!blocks.length) return;
  await supabaseJson('/calendar_blocks', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    json: blocks,
  });
}

export async function updateCalendarBlock(id: string, patch: CalendarBlockUpdate): Promise<void> {
  await supabaseJson(`/calendar_blocks?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    json: patch,
  });
}

export async function updateCalendarBlocks(ids: string[], patch: CalendarBlockUpdate): Promise<void> {
  if (!ids.length) return;
  await supabaseJson(`/calendar_blocks?id=in.(${ids.map((id) => encodeURIComponent(id)).join(',')})`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    json: patch,
  });
}

export async function deleteCalendarBlocks(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await supabaseRequest(`/calendar_blocks?id=in.(${ids.map((id) => encodeURIComponent(id)).join(',')})`, {
    method: 'DELETE',
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to delete calendar blocks (${response.status})`);
    }
  });
}

