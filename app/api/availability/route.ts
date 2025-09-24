import { NextResponse } from 'next/server';
import { fetchAllCalendarBlocks } from '@/lib/calendarBlocks';
import { logger } from '@/lib/logging';

const CACHE_HEADERS = { 'Cache-Control': 'no-store' } as const;

export async function GET() {
  try {
    const blocks = await fetchAllCalendarBlocks();
    return NextResponse.json(blocks, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Failed to load availability', error);
    return NextResponse.json(
      { error: 'Failed to load availability' },
      { status: 500, headers: CACHE_HEADERS },
    );
  }
}

