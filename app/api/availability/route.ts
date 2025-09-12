import { NextResponse } from 'next/server';
import { getAvailability } from '@/lib/availabilityApi';

// This route reads query parameters at request time, so it must be rendered
// dynamically rather than statically during the build.
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // regenerate every hour

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get('propertyId');
  const start = searchParams.get('start') ?? undefined;
  const end = searchParams.get('end') ?? undefined;

  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
  }

  const feed = await getAvailability({ propertyId, start, end });
  return NextResponse.json(feed);
}