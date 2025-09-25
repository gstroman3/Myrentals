import { NextResponse } from 'next/server';
import { buildHoldExpiredEmail } from '@/emails/hold-expired';
import { createStayDetailsFromBlocks } from '@/lib/stays';
import { logger } from '@/lib/logging';
import { sendGuestNotification, sendFailureNotification } from '@/lib/notifications';
import { supabaseJson } from '@/lib/supabase/rest';
import {
  fetchBookingBlocks,
  fetchGuest,
  logAuditEvent,
  removeCalendarBlocks,
  updateBooking,
} from '@/app/api/admin/bookings/_shared';

const CACHE_HEADERS = { 'Cache-Control': 'no-store' } as const;
const ACTOR = 'cron/expire-holds';

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET ?? '';
  const headers = request.headers;

  const isVercelCron = !!headers.get('x-vercel-cron');
  const headerSecret = headers.get('x-cron-secret');
  const auth = headers.get('authorization');
  const hasSecret = headerSecret === secret || auth === `Bearer ${secret}`;

  return isVercelCron || hasSecret;
}

interface PendingHoldBooking {
  id: string;
  invoice_number: string;
  guest_id: string | null;
  hold_expires_at: string | null;
}

async function fetchExpiredHolds(nowIso: string): Promise<PendingHoldBooking[]> {
  const params = new URLSearchParams();
  params.set('select', 'id,invoice_number,guest_id,hold_expires_at');
  params.set(
    'and',
    `(status.eq.pending_hold,hold_expires_at.not.is.null,hold_expires_at.lte.${nowIso})`,
  );
  params.set('order', 'hold_expires_at.asc');

  const path = `/bookings?${params.toString()}`;
  const records = await supabaseJson<PendingHoldBooking[]>(path);
  return records ?? [];
}

async function processExpiredHold(booking: PendingHoldBooking) {
  const expiredAt = new Date().toISOString();

  await updateBooking(booking.id, { status: 'expired' });

  const blocks = await fetchBookingBlocks(booking.id);
  const removableIds = blocks
    .filter((block) => block.status === 'internal_pending' || block.status === 'pending')
    .map((block) => block.id);

  if (removableIds.length) {
    await removeCalendarBlocks(removableIds);
  }

  const stayDetails = createStayDetailsFromBlocks(blocks);

  const guest = await fetchGuest(booking.guest_id);
  if (guest?.email) {
    const emailContent = await buildHoldExpiredEmail({
      guestName: guest.full_name,
      invoiceNumber: booking.invoice_number,
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

  await logAuditEvent(booking.id, 'booking_expired', ACTOR, {
    invoice_number: booking.invoice_number,
    reason: 'hold_expired',
    hold_expires_at: booking.hold_expires_at,
    expired_at: expiredAt,
  });

  logger.info('Expired booking hold via cron', {
    bookingId: booking.id,
    invoiceNumber: booking.invoice_number,
    removedCalendarBlocks: removableIds.length,
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CACHE_HEADERS });
  }

  try {
    const nowIso = new Date().toISOString();
    const bookings = await fetchExpiredHolds(nowIso);

    if (!bookings.length) {
      return NextResponse.json(
        { success: true, processed: 0, expired: 0 },
        { headers: CACHE_HEADERS },
      );
    }

    let expiredCount = 0;
    const failures: Array<{ bookingId: string; error: string }> = [];

    for (const booking of bookings) {
      try {
        await processExpiredHold(booking);
        expiredCount += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('Failed to expire booking hold via cron', {
          bookingId: booking.id,
          error: message,
        });
        failures.push({ bookingId: booking.id, error: message });
      }
    }

    if (failures.length) {
      await sendFailureNotification({
        subject: 'Hold expiration cron encountered errors',
        body: `Failed to expire ${failures.length} hold(s). Check logs for details.`,
      });
    }

    return NextResponse.json(
      { success: failures.length === 0, processed: bookings.length, expired: expiredCount, failures },
      { status: failures.length ? 207 : 200, headers: CACHE_HEADERS },
    );
  } catch (error) {
    logger.error('Hold expiration cron failed', error);
    await sendFailureNotification({
      subject: 'Hold expiration cron failed',
      body: `Hold expiration cron failed with error: ${error instanceof Error ? error.message : String(error)}`,
    });
    return NextResponse.json(
      { error: 'Hold expiration cron failed' },
      { status: 500, headers: CACHE_HEADERS },
    );
  }
}
