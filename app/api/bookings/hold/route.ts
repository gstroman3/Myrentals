import { NextResponse } from 'next/server';
import { buildBookingHoldEmail } from '@/emails/booking-hold';
import { logger } from '@/lib/logging';
import { sendGuestNotification } from '@/lib/notifications';
import { getPaymentOption } from '@/lib/paymentOptions';
import { createStayDetails } from '@/lib/stays';
import { supabaseJson, supabaseRequest } from '@/lib/supabase/rest';

interface HoldRequestBody {
  full_name?: string;
  email?: string;
  phone?: string;
  check_in?: string;
  check_out?: string;
  payment_method?: string;
}

interface GuestRecord {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
}

interface HoldTotals {
  rate_subtotal: number;
  cleaning_fee: number;
  taxes: number;
  total_amount: number;
}

interface HoldCreationResponse {
  booking_id: string;
  invoice_number: string;
  total_amount: number;
  hold_expires_at: string;
  payment_method: string;
}

function requireString(value: unknown, field: keyof HoldRequestBody): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing or invalid field: ${field}`);
  }
  return value.trim();
}

function parseIsoDate(value: string, field: keyof HoldRequestBody): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date for field: ${field}`);
  }
  return date;
}

function diffInNights(start: Date, end: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / MS_PER_DAY);
}

function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function getInvoicePrefix(): string {
  const prefix = process.env.BOOKING_INVOICE_PREFIX ?? 'ASH';
  return prefix.trim() || 'ASH';
}

function generateInvoiceNumber(): string {
  const prefix = getInvoicePrefix();
  const now = new Date();
  const year = now.getUTCFullYear();
  const random = Math.floor(Math.random() * 10000);
  const sequence = random.toString().padStart(4, '0');
  return `${prefix}-${year}-${sequence}`;
}

function computeTotals(start: Date, end: Date): HoldTotals {
  const nights = diffInNights(start, end);
  if (nights <= 0) {
    throw new Error('Check-out date must be after check-in date');
  }
  const nightlyRate = Number(process.env.HOLD_NIGHTLY_RATE ?? '315');
  const cleaningFeeDefault = Number(process.env.HOLD_CLEANING_FEE ?? '200');
  const singleNightCleaningFeeDefault = Number(
    process.env.HOLD_SINGLE_NIGHT_CLEANING_FEE ?? '100',
  );
  const taxRate = Number(process.env.HOLD_TAX_RATE ?? '0.1');

  const rateSubtotal = roundToCents(nightlyRate * nights);
  const cleaningFeeBase = nights === 1 ? singleNightCleaningFeeDefault : cleaningFeeDefault;
  const cleaningFee = roundToCents(cleaningFeeBase);
  const taxes = roundToCents((rateSubtotal + cleaningFee) * taxRate);
  const totalAmount = roundToCents(rateSubtotal + cleaningFee + taxes);

  return {
    rate_subtotal: rateSubtotal,
    cleaning_fee: cleaningFee,
    taxes,
    total_amount: totalAmount,
  };
}

async function upsertGuest(details: {
  full_name: string;
  email: string;
  phone: string;
}): Promise<GuestRecord> {
  const records = await supabaseJson<GuestRecord[]>(
    '/guests',
    {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      json: {
        full_name: details.full_name,
        email: details.email,
        phone: details.phone,
      },
    },
  );
  const [guest] = records ?? [];
  if (!guest) {
    throw new Error('Failed to upsert guest record');
  }
  return guest;
}

function computeHoldExpiry(): string {
  const holdWindowHours = Number(process.env.HOLD_WINDOW_HOURS ?? '24');
  const expiresAt = new Date(Date.now() + holdWindowHours * 60 * 60 * 1000);
  return expiresAt.toISOString();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HoldRequestBody;
    const fullName = requireString(body.full_name, 'full_name');
    const email = requireString(body.email, 'email');
    const phone = requireString(body.phone, 'phone');
    const checkInRaw = requireString(body.check_in, 'check_in');
    const checkOutRaw = requireString(body.check_out, 'check_out');
    const paymentMethod = requireString(body.payment_method, 'payment_method');

    const checkIn = parseIsoDate(checkInRaw, 'check_in');
    const checkOut = parseIsoDate(checkOutRaw, 'check_out');

    if (checkOut <= checkIn) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 },
      );
    }

    const totals = computeTotals(checkIn, checkOut);
    const invoiceNumber = generateInvoiceNumber();
    const holdExpiresAt = computeHoldExpiry();

    const guest = await upsertGuest({ full_name: fullName, email, phone });

    const rpcPayload = {
      guest_id: guest.id,
      full_name: fullName,
      email,
      phone,
      check_in: checkIn.toISOString(),
      check_out: checkOut.toISOString(),
      invoice_number: invoiceNumber,
      payment_method: paymentMethod,
      hold_expires_at: holdExpiresAt,
      ...totals,
    };

    const response = await supabaseRequest('/rpc/create_booking_hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rpcPayload),
    });

    if (response.status === 409) {
      return NextResponse.json(
        { error: 'Selected dates overlap with an existing booking' },
        { status: 409 },
      );
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to create booking hold (${response.status}): ${text}`);
    }

    const result = response.status === 204
      ? {}
      : ((await response.json().catch(() => ({}))) as Partial<HoldCreationResponse>);

    if (!result.booking_id) {
      throw new Error('Hold creation response missing booking_id');
    }

    const payload: HoldCreationResponse = {
      booking_id: result.booking_id,
      invoice_number: result.invoice_number ?? invoiceNumber,
      total_amount: result.total_amount ?? totals.total_amount,
      hold_expires_at: result.hold_expires_at ?? holdExpiresAt,
      payment_method: result.payment_method ?? paymentMethod,
    };

    const stayDetails = createStayDetails(checkIn.toISOString(), checkOut.toISOString());
    const paymentOption = getPaymentOption(paymentMethod);
    const siteUrl = process.env.BOOKINGS_SITE_URL ?? 'https://stromanproperties.com';
    const proofUrl = `${siteUrl}/bookings/${encodeURIComponent(payload.invoice_number)}/upload-proof`;
    const emailContent = await buildBookingHoldEmail({
      guestName: fullName,
      invoiceNumber: payload.invoice_number,
      stay: stayDetails,
      holdExpiresAt: payload.hold_expires_at,
      totalAmount: payload.total_amount,
      paymentOption,
      proofUrl,
    });

    await sendGuestNotification(email, {
      subject: emailContent.subject,
      body: emailContent.text,
      html: emailContent.html,
      bccOwner: true,
    });

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    logger.error('Failed to create booking hold', error);
    if (
      error instanceof Error &&
      (/Missing or invalid field/.test(error.message) ||
        /Invalid date/.test(error.message) ||
        /Check-out date/.test(error.message))
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Unable to create booking hold' },
      { status: 500 },
    );
  }
}
