import { logger } from '@/lib/logging';
import type { CalendarBlockRecord } from '@/lib/calendarBlocks';
import { deleteCalendarBlocks, updateCalendarBlocks } from '@/lib/calendarBlocks';
import { supabaseJson, supabaseRequest } from '@/lib/supabase/rest';

export class HttpError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

interface BookingRecord {
  id: string;
  invoice_number: string;
  status: string;
  hold_expires_at: string | null;
  paid_at: string | null;
  guest_id: string | null;
}

interface GuestRecord {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface PaymentRecord {
  id: string;
  status: string;
}

interface BookingCalendarBlock extends Pick<
  CalendarBlockRecord,
  'id' | 'status' | 'source' | 'start_date' | 'end_date'
> {
  booking_id?: string | null;
}

interface AuditMetadata {
  [key: string]: unknown;
}

export interface AdminContext {
  actor: string;
}

function getAdminSecret(): string {
  const secret = process.env.ADMIN_API_SECRET;
  if (!secret) {
    throw new Error('ADMIN_API_SECRET is not configured');
  }
  return secret;
}

function extractBearer(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return match[1].trim();
}

export function requireAdmin(request: Request): AdminContext {
  const secret = getAdminSecret();
  const provided =
    extractBearer(request.headers.get('authorization')) ??
    request.headers.get('x-admin-secret')?.trim();

  if (!provided || provided !== secret) {
    throw new HttpError('Unauthorized', 401);
  }

  const actor = request.headers.get('x-admin-actor')?.trim() || 'admin';
  return { actor };
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch (error) {
    logger.warn('Failed to parse JSON body for admin request', error);
    throw new HttpError('Invalid JSON body', 400);
  }
}

export function requireInvoiceNumber(value: unknown): string {
  if (typeof value !== 'string') {
    throw new HttpError('Missing invoice_number', 400);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new HttpError('Missing invoice_number', 400);
  }
  return trimmed;
}

export function isHoldExpired(holdExpiresAt: string | null): boolean {
  if (!holdExpiresAt) return false;
  const expires = new Date(holdExpiresAt);
  if (Number.isNaN(expires.getTime())) {
    return true;
  }
  return expires.getTime() <= Date.now();
}

export async function fetchBookingByInvoice(invoiceNumber: string): Promise<BookingRecord> {
  const encoded = encodeURIComponent(invoiceNumber);
  const records = await supabaseJson<BookingRecord[]>(
    `/bookings?invoice_number=eq.${encoded}&select=id,invoice_number,status,hold_expires_at,paid_at,guest_id&limit=1`,
  );
  const booking = records?.[0];
  if (!booking) {
    throw new HttpError('Booking not found', 404);
  }
  return booking;
}

export async function fetchGuest(guestId: string | null): Promise<GuestRecord | null> {
  if (!guestId) return null;
  const encoded = encodeURIComponent(guestId);
  const records = await supabaseJson<GuestRecord[]>(
    `/guests?id=eq.${encoded}&select=id,full_name,email,phone&limit=1`,
  );
  return records?.[0] ?? null;
}

export async function fetchPayments(bookingId: string): Promise<PaymentRecord[]> {
  const encoded = encodeURIComponent(bookingId);
  return (
    await supabaseJson<PaymentRecord[]>(
      `/payments?booking_id=eq.${encoded}&select=id,status&order=created_at`,
    )
  ) ?? [];
}

async function patchSupabase(path: string, payload: Record<string, unknown>, context: string): Promise<void> {
  const response = await supabaseRequest(path, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    json: payload,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to ${context} (${response.status}): ${text}`);
  }
}

export async function updatePayments(
  bookingId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const encoded = encodeURIComponent(bookingId);
  await patchSupabase(`/payments?booking_id=eq.${encoded}`, payload, 'update payment records');
}

export async function updateBooking(
  bookingId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const encoded = encodeURIComponent(bookingId);
  await patchSupabase(`/bookings?id=eq.${encoded}`, payload, 'update booking');
}

export async function fetchBookingBlocks(bookingId: string): Promise<BookingCalendarBlock[]> {
  const encoded = encodeURIComponent(bookingId);
  return (
    await supabaseJson<BookingCalendarBlock[]>(
      `/calendar_blocks?booking_id=eq.${encoded}&select=id,status,source,start_date,end_date`,
    )
  ) ?? [];
}

export async function updateCalendarBlockStatus(ids: string[], status: string): Promise<void> {
  if (!ids.length) return;
  await updateCalendarBlocks(ids, { status });
}

export async function removeCalendarBlocks(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await deleteCalendarBlocks(ids);
}

export async function logAuditEvent(
  bookingId: string,
  action: string,
  actor: string,
  metadata: AuditMetadata = {},
): Promise<void> {
  const response = await supabaseRequest('/booking_audit_events', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    json: {
      booking_id: bookingId,
      action,
      actor,
      metadata: Object.keys(metadata).length ? metadata : null,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to log audit event (${response.status}): ${text}`);
  }
}
