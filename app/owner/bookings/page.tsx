import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import OwnerBookingRow, { type OwnerBookingDetails, type OwnerBookingGuest, type OwnerBookingPayment } from '@/components/OwnerBookingRow';
import { createStayDetails } from '@/lib/stays';
import { supabaseJson } from '@/lib/supabase/rest';

interface PendingBookingRecord {
  id: string;
  invoice_number: string;
  status: string;
  hold_expires_at: string | null;
  guest_id: string | null;
  check_in: string | null;
  check_out: string | null;
  rate_subtotal: number | null;
  cleaning_fee: number | null;
  taxes: number | null;
  total_amount: number | null;
  payment_method: string | null;
}

interface GuestRecord {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface PaymentRecord {
  id: string;
  booking_id: string;
  status: string | null;
  processor: string | null;
  payer_name: string | null;
  reference: string | null;
  note: string | null;
  proof_file_url: string | null;
  received_at: string | null;
  verified_at: string | null;
  amount: number | null;
}

const ADMIN_COOKIE_NAME = 'admin_secret';

function getAdminSecret(): string | null {
  const secret = process.env.ADMIN_API_SECRET;
  if (!secret) {
    return null;
  }
  return secret.trim();
}

async function isAuthorized(): Promise<boolean> {
  const secret = getAdminSecret();
  if (!secret) {
    return false;
  }
  const headerSecret = (await headers()).get('x-admin-secret')?.trim();
  if (headerSecret && headerSecret === secret) {
    return true;
  }
  const cookieStore = await cookies();
  const cookieSecret = cookieStore.get(ADMIN_COOKIE_NAME)?.value?.trim();
  return Boolean(cookieSecret && cookieSecret === secret);
}

function isHoldExpired(holdExpiresAt: string | null): boolean {
  if (!holdExpiresAt) {
    return false;
  }
  const expires = new Date(holdExpiresAt);
  if (Number.isNaN(expires.getTime())) {
    return true;
  }
  return expires.getTime() <= Date.now();
}

function encodeList(values: string[]): string {
  return values.map((value) => encodeURIComponent(value)).join(',');
}

async function fetchPendingBookings(): Promise<PendingBookingRecord[]> {
  return (
    await supabaseJson<PendingBookingRecord[]>(
      '/bookings?status=eq.pending_hold&select=id,invoice_number,status,hold_expires_at,guest_id,check_in,check_out,rate_subtotal,cleaning_fee,taxes,total_amount,payment_method&order=hold_expires_at.asc',
    )
  ) ?? [];
}

async function fetchGuests(guestIds: string[]): Promise<Map<string, OwnerBookingGuest>> {
  if (!guestIds.length) {
    return new Map();
  }
  const records =
    (await supabaseJson<GuestRecord[]>(
      `/guests?id=in.(${encodeList(guestIds)})&select=id,full_name,email,phone`,
    )) ?? [];
  return new Map(
    records.map((guest) => [
      guest.id,
      {
        id: guest.id,
        fullName: guest.full_name,
        email: guest.email,
        phone: guest.phone,
      },
    ]),
  );
}

async function fetchPayments(bookingIds: string[]): Promise<Map<string, OwnerBookingPayment>> {
  if (!bookingIds.length) {
    return new Map();
  }
  const records =
    (await supabaseJson<PaymentRecord[]>(
      `/payments?booking_id=in.(${encodeList(bookingIds)})&select=id,booking_id,status,processor,payer_name,reference,note,proof_file_url,received_at,verified_at,amount&order=created_at.desc`,
    )) ?? [];

  const map = new Map<string, OwnerBookingPayment>();
  for (const record of records) {
    if (map.has(record.booking_id)) {
      continue;
    }
    map.set(record.booking_id, {
      id: record.id,
      status: record.status,
      processor: record.processor,
      payerName: record.payer_name,
      reference: record.reference,
      note: record.note,
      proofFileUrl: record.proof_file_url,
      receivedAt: record.received_at,
      verifiedAt: record.verified_at,
      amount: record.amount,
    });
  }
  return map;
}

async function loadOwnerBookings(): Promise<OwnerBookingDetails[]> {
  const bookings = await fetchPendingBookings();
  if (!bookings.length) {
    return [];
  }
  const guestIds = Array.from(new Set(bookings.map((booking) => booking.guest_id).filter(Boolean))) as string[];
  const bookingIds = bookings.map((booking) => booking.id);

  const [guestMap, paymentMap] = await Promise.all([
    fetchGuests(guestIds),
    fetchPayments(bookingIds),
  ]);

  return bookings.map<OwnerBookingDetails>((booking) => {
    const stayDetails =
      booking.check_in && booking.check_out
        ? createStayDetails(booking.check_in, booking.check_out)
        : null;
    return {
      id: booking.id,
      invoiceNumber: booking.invoice_number,
      status: booking.status,
      holdExpiresAt: booking.hold_expires_at,
      isHoldExpired: isHoldExpired(booking.hold_expires_at),
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      nights: stayDetails?.nights ?? null,
      rateSubtotal: booking.rate_subtotal,
      cleaningFee: booking.cleaning_fee,
      taxes: booking.taxes,
      totalAmount: booking.total_amount,
      paymentMethod: booking.payment_method,
      guest: booking.guest_id ? guestMap.get(booking.guest_id) ?? null : null,
      payment: paymentMap.get(booking.id) ?? null,
    };
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OwnerBookingsPage() {
  if (!(await isAuthorized())) {
    notFound();
  }

  let bookings: OwnerBookingDetails[] = [];
  let error: string | null = null;
  try {
    bookings = await loadOwnerBookings();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load pending bookings.';
  }

  return (
    <div className="owner-dashboard">
      <h1>Pending Booking Holds</h1>
      <p className="owner-dashboard__subtitle">
        Review payment proof submissions and confirm or expire holds.
      </p>
      {error ? (
        <p className="owner-dashboard__error">{error}</p>
      ) : bookings.length === 0 ? (
        <p className="owner-dashboard__empty">No pending holds awaiting review.</p>
      ) : (
        <div className="owner-bookings__list">
          {bookings.map((booking) => (
            <OwnerBookingRow key={booking.id} booking={booking} adminCookieName={ADMIN_COOKIE_NAME} />
          ))}
        </div>
      )}
    </div>
  );
}
