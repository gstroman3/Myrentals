'use client';

import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import type { AvailabilityFeed, DateRange } from './types';
import OwnerBlackoutsPanel from './OwnerBlackoutsPanel';
import {
  formatInTimeZone,
  utcToZonedTime,
  startOfMonth,
  addMonths,
  getDaysInMonth,
  addDays,
} from '../lib/date';

export type Props = {
  propertyId: string;
  timezone: string;
  fetchAvailability: (args: { propertyId: string; start?: string; end?: string }) => Promise<AvailabilityFeed>;
  showOwnerPanel?: boolean; // default false
};

function inRanges(iso: string, ranges: DateRange[]): boolean {
  return ranges.some((r) => r.start <= iso && iso < r.end);
}

export default function AvailabilityCalendar({ propertyId, timezone, fetchAvailability, showOwnerPanel = false }: Props) {
  const [month, setMonth] = useState(() => utcToZonedTime(new Date(), timezone));
  const [feed, setFeed] = useState<AvailabilityFeed>({ property_id: propertyId, booked: [], blackouts: [], min_nights: 1 });

  const monthStart = startOfMonth(month);
  const monthEnd = addMonths(monthStart, 1);
  const monthStartISO = formatInTimeZone(monthStart, timezone, 'yyyy-MM-dd');
  const monthEndISO = formatInTimeZone(monthEnd, timezone, 'yyyy-MM-dd');

  const refetch = useCallback(() => {
    fetchAvailability({ propertyId, start: monthStartISO, end: monthEndISO }).then(setFeed);
  }, [propertyId, monthStartISO, monthEndISO, fetchAvailability]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const daysIn = getDaysInMonth(monthStart);
  const firstDay = monthStart.getDay();
  const days: Date[] = [];
  for (let i = 0; i < daysIn; i++) {
    days.push(addDays(monthStart, i));
  }

  const changeMonth = (e: ChangeEvent<HTMLSelectElement>) => {
    setMonth(new Date(month.getFullYear(), Number(e.target.value), 1));
  };
  const changeYear = (e: ChangeEvent<HTMLSelectElement>) => {
    setMonth(new Date(Number(e.target.value), month.getMonth(), 1));
  };
  const prevMonth = () => setMonth(addMonths(month, -1));
  const nextMonth = () => setMonth(addMonths(month, 1));

  const monthNames = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'long' }));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="availability-calendar">
      <div className="header">
        <button onClick={prevMonth} aria-label="Previous Month">&lt;</button>
        <div className="selectors">
          <select aria-label="Select Month" value={month.getMonth()} onChange={changeMonth}>
            {monthNames.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select aria-label="Select Year" value={month.getFullYear()} onChange={changeYear}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button onClick={nextMonth} aria-label="Next Month">&gt;</button>
      </div>
      <div className="grid" role="grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="day-name">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="empty" />
        ))}
        {days.map((date) => {
          const iso = formatInTimeZone(date, timezone, 'yyyy-MM-dd');
          const booked = inRanges(iso, feed.booked);
          const blackout = inRanges(iso, feed.blackouts);
          const cls = blackout ? 'blackout' : booked ? 'booked' : 'available';
          return (
            <div key={iso} role="gridcell" aria-disabled={booked || blackout} className={`day ${cls}`}>
              {date.getDate()}
            </div>
          );
        })}
      </div>
      {showOwnerPanel && <OwnerBlackoutsPanel propertyId={propertyId} onChange={refetch} />}
    </div>
  );
}
