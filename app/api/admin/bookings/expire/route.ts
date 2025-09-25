import { NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { sendGuestNotification } from '@/lib/notifications';
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
    const removableIds = blocks
      .filter((block) => block.status === 'internal_pending' || block.status === 'pending')
      .map((block) => block.id);
    await removeCalendarBlocks(removableIds);

    const guest = await fetchGuest(booking.guest_id);
    if (guest?.email) {
      const greeting = guest.full_name ? `Hi ${guest.full_name},` : 'Hello,';
      const messageLines = [
        greeting,
        '',
        'We did not receive payment in time and the temporary hold on your requested dates has expired.',
        `Invoice: ${invoiceNumber}`,
        '',
        'Those dates are now available again. Please reach out if you still need assistance.',
        '',
        'Regards,',
        'Stroman Properties',
      ];
      await sendGuestNotification(guest.email, {
        subject: 'Booking Hold Expired',
        body: messageLines.join('\n'),
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
