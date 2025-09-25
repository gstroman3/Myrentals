import { NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { sendGuestNotification } from '@/lib/notifications';
import {
  HttpError,
  fetchBookingBlocks,
  fetchBookingByInvoice,
  fetchGuest,
  fetchPayments,
  logAuditEvent,
  parseJsonBody,
  removeCalendarBlocks,
  requireAdmin,
  requireInvoiceNumber,
  updateBooking,
} from '../_shared';

interface CancelRequestBody {
  invoice_number?: string;
  reason?: string;
}

export async function POST(request: Request) {
  try {
    const { actor } = requireAdmin(request);
    const body = await parseJsonBody<CancelRequestBody>(request);
    const invoiceNumber = requireInvoiceNumber(body.invoice_number);
    const reason = (body.reason ?? '').trim();

    const booking = await fetchBookingByInvoice(invoiceNumber);

    if (booking.status === 'paid') {
      throw new HttpError('Cannot cancel a paid booking', 409);
    }
    if (booking.status === 'canceled') {
      return NextResponse.json({ success: true, message: 'Booking already canceled' });
    }

    await updateBooking(booking.id, { status: 'canceled' });

    const blocks = await fetchBookingBlocks(booking.id);
    const removableIds = blocks
      .filter((block) => block.status === 'internal_pending' || block.status === 'internal_confirmed')
      .map((block) => block.id);
    await removeCalendarBlocks(removableIds);

    const guest = await fetchGuest(booking.guest_id);
    if (guest?.email) {
      const greeting = guest.full_name ? `Hi ${guest.full_name},` : 'Hello,';
      const lines = [
        greeting,
        '',
        'Your booking has been canceled per the owner\'s request.',
        `Invoice: ${invoiceNumber}`,
      ];
      if (reason) {
        lines.push('', `Reason: ${reason}`);
      }
      lines.push('', 'Please contact us if you have any questions.', '', 'Regards,', 'Stroman Properties');
      await sendGuestNotification(guest.email, {
        subject: 'Booking Canceled',
        body: lines.join('\n'),
      });
    } else {
      logger.warn('Skipping booking cancellation email because guest email is missing', {
        bookingId: booking.id,
      });
    }

    const payments = await fetchPayments(booking.id);
    if (payments.length) {
      logger.info('Payment records remain after cancellation', {
        bookingId: booking.id,
        paymentCount: payments.length,
      });
    }

    await logAuditEvent(booking.id, 'booking_canceled', actor, {
      invoice_number: invoiceNumber,
      reason: reason || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error('Failed to cancel booking', error);
    return NextResponse.json({ error: 'Unable to cancel booking' }, { status: 500 });
  }
}
