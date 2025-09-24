import { NextResponse } from 'next/server';
import { syncAirbnbCalendar } from '@/lib/airbnbCalendar';
import { logger } from '@/lib/logging';
import { sendFailureNotification } from '@/lib/notifications';

const CACHE_HEADERS = { 'Cache-Control': 'no-store' } as const;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.warn('CRON_SECRET is not configured');
    return false;
  }
  const provided = request.headers.get('x-cron-secret');
  return provided === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CACHE_HEADERS });
  }

  try {
    const result = await syncAirbnbCalendar({ deleteMissing: true });
    logger.info('Airbnb calendar sync completed', result);
    return NextResponse.json(result, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Airbnb calendar sync failed', error);
    await sendFailureNotification({
      subject: 'Airbnb calendar sync failed',
      body: `Airbnb sync failed with error: ${error instanceof Error ? error.message : String(error)}`,
    });
    return NextResponse.json(
      { error: 'Airbnb calendar sync failed' },
      { status: 500, headers: CACHE_HEADERS },
    );
  }
}

