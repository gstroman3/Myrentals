'use client';

import { useEffect, useState } from 'react';
import type { ReactElement, ChangeEvent } from 'react';

type CalendarBlock = {
  id: string;
  source: string;
  status: string;
  start_date: string;
  end_date: string;
};

interface DayState {
  blocked: boolean;
  className: string;
}

function toUtcDateValue(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateValue(value: string): number {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function classifyBlock(block: CalendarBlock | undefined): DayState {
  if (!block) {
    return { blocked: false, className: 'available' };
  }
  if (block.source === 'airbnb_ics') {
    return { blocked: true, className: 'external' };
  }
  if (block.status === 'internal_pending') {
    return { blocked: true, className: 'pending' };
  }
  if (block.status === 'internal_confirmed') {
    return { blocked: true, className: 'confirmed' };
  }
  return { blocked: true, className: 'blocked' };
}

export function AvailabilityCalendar(): ReactElement {
  const [month, setMonth] = useState(new Date());
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/availability', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const payload = (await response.json()) as CalendarBlock[];
        if (isMounted) {
          setBlocks(payload);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load availability', err);
        if (isMounted) {
          setError('Unable to load availability. Please try again later.');
          setBlocks([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const findBlockForDate = (date: Date) => {
    const value = toUtcDateValue(date);
    return blocks.find((block) => {
      const start = parseDateValue(block.start_date);
      const end = parseDateValue(block.end_date);
      return value >= start && value < end;
    });
  };

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
      {isLoading && !error ? (
        <div role="status" className="availability-loading">
          Loading availability…
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="availability-error">
          {error}
        </div>
      ) : null}
      <div className="grid" role="grid" aria-busy={isLoading}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="day-name">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="empty" />
        ))}
        {days.map((date) => {
          const block = findBlockForDate(date);
          const dayState = classifyBlock(block);
          return (
            <div
              key={date.toISOString()}
              role="gridcell"
              aria-disabled={dayState.blocked}
              className={`day ${dayState.className}`}
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
