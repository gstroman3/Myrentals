'use client';

import { useMemo, useState } from 'react';
import AvailabilityCalendar, {
  type CalendarBlock,
  type SelectedDateRange,
} from '@/components/AvailabilityCalendar';
import BookingSidebar from '@/components/BookingSidebar';
import type { Property } from '@/lib/properties';

interface BookingClientProps {
  property: Property;
  propertyTimezone: string;
  holdWindowHours: number;
}

function parseDateValue(value: string): number {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function toUtcDateValue(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function rangeOverlapsBlock(
  range: SelectedDateRange,
  blocks: CalendarBlock[],
): boolean {
  if (!range.checkIn || !range.checkOut) {
    return false;
  }
  const startValue = toUtcDateValue(range.checkIn);
  const endValueExclusive = toUtcDateValue(range.checkOut) + 24 * 60 * 60 * 1000;
  return blocks.some((block) => {
    const blockStart = parseDateValue(block.start_date);
    const blockEnd = parseDateValue(block.end_date);
    return startValue < blockEnd && endValueExclusive > blockStart;
  });
}

export default function BookingClient({
  property,
  propertyTimezone,
  holdWindowHours,
}: BookingClientProps) {
  const [selectedRange, setSelectedRange] = useState<SelectedDateRange>({
    checkIn: null,
    checkOut: null,
  });
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);

  const hasBlockedOverlap = useMemo(
    () => rangeOverlapsBlock(selectedRange, blocks),
    [blocks, selectedRange],
  );

  return (
    <div className="booking-layout">
      <AvailabilityCalendar
        selectedRange={selectedRange}
        onChange={setSelectedRange}
        onBlocksChange={setBlocks}
      />
      <BookingSidebar
        property={property}
        checkIn={selectedRange.checkIn}
        checkOut={selectedRange.checkOut}
        hasBlockedOverlap={hasBlockedOverlap}
        propertyTimezone={propertyTimezone}
        holdWindowHours={holdWindowHours}
      />
    </div>
  );
}
