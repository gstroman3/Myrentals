'use client';

import { useState } from 'react';
import type { ReactElement } from 'react';

export interface DateRange {
  start: string;
  end: string;
  reason?: string;
}

export interface AvailabilityData {
  property_id: string;
  booked: DateRange[];
  blackouts: DateRange[];
  min_nights: number;
}

export interface AvailabilityCalendarProps {
  data: AvailabilityData;
}

function inRange(date: Date, range: DateRange): boolean {
  const start = new Date(range.start);
  const end = new Date(range.end);
  return date >= start && date <= end;
}

export function AvailabilityCalendar({ data }: AvailabilityCalendarProps): ReactElement {
  const [month, setMonth] = useState(new Date());

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days: Date[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(month.getFullYear(), month.getMonth(), i));
  }

  const isBooked = (date: Date) => data.booked.some((r) => inRange(date, r));
  const isOwner = (date: Date) => data.blackouts.some((r) => inRange(date, r));

  const prevMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const nextMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));

  return (
    <div className="availability-calendar">
      <div className="header">
        <button onClick={prevMonth} aria-label="Previous Month">&lt;</button>
        <h2>{month.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={nextMonth} aria-label="Next Month">&gt;</button>
      </div>
      <div className="grid" role="grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="day-name">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="empty" />
        ))}
        {days.map((date) => {
          const booked = isBooked(date);
          const owner = isOwner(date);
          const cls = owner ? 'owner' : booked ? 'booked' : 'available';
          return (
            <div
              key={date.toISOString()}
              role="gridcell"
              aria-disabled={booked || owner}
              className={`day ${cls}`}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AvailabilityCalendar;
