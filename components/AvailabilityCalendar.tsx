'use client';

import { useState } from 'react';
import type { ReactElement, ChangeEvent } from 'react';
import type { AvailabilityData, DateRange } from '@/lib/availability';

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

  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'long' })
  );
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days: Date[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(month.getFullYear(), month.getMonth(), i));
  }

  const isBooked = (date: Date) => data.booked.some((r) => inRange(date, r));
  const isOwner = (date: Date) => data.blackouts.some((r) => inRange(date, r));

  const prevMonth = () =>
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const nextMonth = () =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  const changeMonth = (e: ChangeEvent<HTMLSelectElement>) =>
    setMonth(new Date(month.getFullYear(), Number(e.target.value), 1));
  const changeYear = (e: ChangeEvent<HTMLSelectElement>) =>
    setMonth(new Date(Number(e.target.value), month.getMonth(), 1));

  return (
    <div className="availability-calendar">
      <div className="header">
        <button onClick={prevMonth} aria-label="Previous Month">&lt;</button>
        <div className="selectors">
          <select
            aria-label="Select Month"
            value={month.getMonth()}
            onChange={changeMonth}
          >
            {monthNames.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <select
            aria-label="Select Year"
            value={month.getFullYear()}
            onChange={changeYear}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
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
