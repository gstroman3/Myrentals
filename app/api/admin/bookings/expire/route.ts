import { NextResponse } from 'next/server';
import { buildHoldExpiredEmail } from '@/emails/hold-expired';
import { logger } from '@/lib/logging';
import { sendGuestNotification } from '@/lib/notifications';
import { createStayDetailsFromBlocks } from '@/lib/stays';
import {
  HttpError,
  fetchBookingBlocks,
  fetchBookingByInvoice,
  fetchGuest,
  isHoldExpired,
  logAuditEvent,
  parseJsonBody,
  removeCalendarBlocks,
  requireAdmin,
  requireInvoiceNumber,
  updateBooking,
} from '../_shared';

interface ExpireRequestBody {
  invoice_number?: string;
  force?: boolean;
}

export async function POST(request: Request) {
  try {
    const { actor } = requireAdmin(request);
    const body = await parseJsonBody<ExpireRequestBody>(request);
    const invoiceNumber = requireInvoiceNumber(body.invoice_number);
    const forceExpire = body.force === true;

    const booking = await fetchBookingByInvoice(invoiceNumber);

    if (booking.status === 'paid') {
      throw new HttpError('Cannot expire a confirmed booking', 409);
    }
    if (booking.status === 'canceled') {
      throw new HttpError('Booking has been canceled', 409);
    }
    if (booking.status === 'expired' && !forceExpire) {
      return NextResponse.json({ success: true, message: 'Booking already expired' });
    }

    if (!forceExpire && !isHoldExpired(booking.hold_expires_at)) {
      throw new HttpError('Hold has not expired yet', 409);
    }

    await updateBooking(booking.id, { status: 'expired' });

    const blocks = await fetchBookingBlocks(booking.id);
    const stayDetails = createStayDetailsFromBlocks(blocks);
    const removableIds = blocks
      .filter((block) => block.status === 'internal_pending' || block.status === 'pending')
      .map((block) => block.id);
    await removeCalendarBlocks(removableIds);

    const guest = await fetchGuest(booking.guest_id);
    if (guest?.email) {
      const expiredAt = new Date().toISOString();
      const emailContent = await buildHoldExpiredEmail({
        guestName: guest.full_name,
        invoiceNumber,
        stay: stayDetails,
        expiredAt,
        holdExpiresAt: booking.hold_expires_at,
      });
      await sendGuestNotification(guest.email, {
        subject: emailContent.subject,
        body: emailContent.text,
        html: emailContent.html,
        bccOwner: true,
      });
    } else {
      logger.warn('Skipping hold expiration email because guest email is missing', {
        bookingId: booking.id,
      });
    }

    await logAuditEvent(booking.id, 'booking_expired', actor, {
      invoice_number: invoiceNumber,
      force: forceExpire,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error('Failed to expire booking hold', error);
    return NextResponse.json({ error: 'Unable to expire booking hold' }, { status: 500 });
  }
}
