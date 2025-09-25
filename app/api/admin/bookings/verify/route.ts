import { NextResponse } from 'next/server';
import { buildBookingConfirmedEmail } from '@/emails/booking-confirmed';
import { logger } from '@/lib/logging';
import { sendGuestNotification } from '@/lib/notifications';
import { createStayDetailsFromBlocks } from '@/lib/stays';
import {
  HttpError,
  fetchBookingBlocks,
  fetchBookingByInvoice,
  fetchGuest,
  fetchPayments,
  isHoldExpired,
  logAuditEvent,
  parseJsonBody,
  requireAdmin,
  requireInvoiceNumber,
  updateBooking,
  updateCalendarBlockStatus,
  updatePayments,
} from '../_shared';

interface VerifyRequestBody {
  invoice_number?: string;
}

export async function POST(request: Request) {
  try {
    const { actor } = requireAdmin(request);
    const body = await parseJsonBody<VerifyRequestBody>(request);
    const invoiceNumber = requireInvoiceNumber(body.invoice_number);

    const booking = await fetchBookingByInvoice(invoiceNumber);

    if (booking.status === 'paid') {
      throw new HttpError('Booking already verified', 409);
    }
    if (booking.status === 'canceled') {
      throw new HttpError('Booking has been canceled', 409);
    }
    if (booking.status === 'expired') {
      throw new HttpError('Hold has already expired', 409);
    }
    if (isHoldExpired(booking.hold_expires_at)) {
      throw new HttpError('Hold has already expired', 409);
    }

    const payments = await fetchPayments(booking.id);
    if (!payments.length) {
      throw new HttpError('No payment records found for this booking', 400);
    }

    const now = new Date().toISOString();
    await updatePayments(booking.id, { status: 'verified', verified_at: now });
    await updateBooking(booking.id, { status: 'paid', paid_at: now });

    const blocks = await fetchBookingBlocks(booking.id);
    const stayDetails = createStayDetailsFromBlocks(blocks);
    const internalPendingIds = blocks
      .filter((block) => block.status === 'internal_pending')
      .map((block) => block.id);
    const pendingIds = blocks
      .filter((block) => block.status === 'pending')
      .map((block) => block.id);

    await Promise.all([
      updateCalendarBlockStatus(internalPendingIds, 'internal_confirmed'),
      updateCalendarBlockStatus(pendingIds, 'confirmed'),
    ]);

    const guest = await fetchGuest(booking.guest_id);
    if (guest?.email) {
      const siteUrl = process.env.BOOKINGS_SITE_URL ?? 'https://stromanproperties.com';
      const arrivalGuideUrl = `${siteUrl}/properties/ashburn-estate`;
      const emailContent = await buildBookingConfirmedEmail({
        guestName: guest.full_name,
        invoiceNumber,
        stay: stayDetails,
        paidAt: now,
        arrivalGuideUrl,
      });
      await sendGuestNotification(guest.email, {
        subject: emailContent.subject,
        body: emailContent.text,
        html: emailContent.html,
        bccOwner: true,
      });
    } else {
      logger.warn('Skipping booking confirmation email because guest email is missing', {
        bookingId: booking.id,
      });
    }

    await logAuditEvent(booking.id, 'booking_verified', actor, { invoice_number: invoiceNumber });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error('Failed to verify booking hold', error);
    return NextResponse.json({ error: 'Unable to verify booking' }, { status: 500 });
  }
}
