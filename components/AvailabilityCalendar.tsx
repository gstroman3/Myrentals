'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactElement, ChangeEvent } from 'react';

export type CalendarBlock = {
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

export interface SelectedDateRange {
  checkIn: Date | null;
  checkOut: Date | null;
}

interface AvailabilityCalendarProps {
  selectedRange?: SelectedDateRange;
  onChange?: (range: SelectedDateRange) => void;
  onBlocksChange?: (blocks: CalendarBlock[]) => void;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_CALENDAR_DATE = new Date(2025, 0, 1);

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isRangeBlocked(
  start: Date,
  end: Date,
  blocks: CalendarBlock[],
): boolean {
  const startValue = toUtcDateValue(start);
  const endValueExclusive = toUtcDateValue(end) + MS_PER_DAY;
  if (endValueExclusive <= startValue) {
    return true;
  }
  return blocks.some((block) => {
    const blockStart = parseDateValue(block.start_date);
    const blockEnd = parseDateValue(block.end_date);
    return startValue < blockEnd && endValueExclusive > blockStart;
  });
}

export function AvailabilityCalendar({
  selectedRange,
  onChange,
  onBlocksChange,
}: AvailabilityCalendarProps = {}): ReactElement {
  const minSelectableDate = useMemo(() => {
    const today = startOfDay(new Date());
    const earliest = startOfDay(MIN_CALENDAR_DATE);
    return toUtcDateValue(today) > toUtcDateValue(earliest) ? today : earliest;
  }, []);
  const minCalendarMonth = useMemo(
    () => new Date(minSelectableDate.getFullYear(), minSelectableDate.getMonth(), 1),
    [minSelectableDate],
  );
  const initialMonth = useMemo(() => {
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return toUtcDateValue(currentMonthStart) < toUtcDateValue(minCalendarMonth)
      ? new Date(minCalendarMonth)
      : currentMonthStart;
  }, [minCalendarMonth]);
  const [month, setMonth] = useState(initialMonth);
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const range = selectedRange ?? { checkIn: null, checkOut: null };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/availability', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const payload = (await response.json()) as { calendar_blocks?: CalendarBlock[] };
        if (isMounted) {
          setBlocks(payload.calendar_blocks ?? []);
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

  useEffect(() => {
    if (onBlocksChange) {
      onBlocksChange(blocks);
    }
  }, [blocks, onBlocksChange]);

  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'long' })
  );
  const years = useMemo(() => {
    const startYear = minCalendarMonth.getFullYear();
    const currentYear = month.getFullYear();
    const endYear = Math.max(startYear + 10, currentYear);
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  }, [minCalendarMonth, month]);
  const minSelectableValue = useMemo(
    () => toUtcDateValue(minSelectableDate),
    [minSelectableDate],
  );
  const minCalendarMonthValue = useMemo(
    () => toUtcDateValue(minCalendarMonth),
    [minCalendarMonth],
  );

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

  const prevMonth = () => {
    const candidate = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    if (toUtcDateValue(candidate) < minCalendarMonthValue) {
      setMonth(new Date(minCalendarMonth));
      return;
    }
    setMonth(candidate);
  };
  const nextMonth = () =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  const changeMonth = (e: ChangeEvent<HTMLSelectElement>) => {
    const candidate = new Date(month.getFullYear(), Number(e.target.value), 1);
    if (toUtcDateValue(candidate) < minCalendarMonthValue) {
      setMonth(new Date(minCalendarMonth));
      return;
    }
    setMonth(candidate);
  };
  const changeYear = (e: ChangeEvent<HTMLSelectElement>) => {
    const year = Number(e.target.value);
    const candidate = new Date(year, month.getMonth(), 1);
    if (toUtcDateValue(candidate) < minCalendarMonthValue) {
      setMonth(new Date(year, minCalendarMonth.getMonth(), 1));
      return;
    }
    setMonth(candidate);
  };

  const monthStartValue = toUtcDateValue(new Date(month.getFullYear(), month.getMonth(), 1));
  const isPrevDisabled = monthStartValue <= minCalendarMonthValue;
  const selectedYear = month.getFullYear();

  const isUnavailableRangeSelected = useMemo(() => {
    if (!range.checkIn || !range.checkOut) {
      return false;
    }
    return isRangeBlocked(range.checkIn, range.checkOut, blocks);
  }, [blocks, range.checkIn, range.checkOut]);

  const handleDayClick = (date: Date) => {
    const block = findBlockForDate(date);
    const dayState = classifyBlock(block);
    const clickedValue = toUtcDateValue(date);
    if (dayState.blocked || clickedValue < minSelectableValue) {
      return;
    }

    const nextRange: SelectedDateRange = { ...range };
    const currentStartValue = range.checkIn ? toUtcDateValue(range.checkIn) : null;

    if (!range.checkIn || range.checkOut) {
      nextRange.checkIn = date;
      nextRange.checkOut = null;
      setSelectionError(null);
      onChange?.(nextRange);
      return;
    }

    if (currentStartValue !== null && clickedValue <= currentStartValue) {
      nextRange.checkIn = date;
      nextRange.checkOut = null;
      setSelectionError(null);
      onChange?.(nextRange);
      return;
    }

    if (isRangeBlocked(range.checkIn, date, blocks)) {
      setSelectionError('Those dates include unavailable nights. Please choose another range.');
      return;
    }

    nextRange.checkIn = range.checkIn;
    nextRange.checkOut = date;
    setSelectionError(null);
    onChange?.(nextRange);
  };

  const checkOutDisplay = useMemo(() => range.checkOut, [range.checkOut]);

  return (
    <div className="availability-calendar">
      <div className="header">
        <button onClick={prevMonth} aria-label="Previous Month" disabled={isPrevDisabled}>
          &lt;
        </button>
        <div className="selectors">
          <select
            aria-label="Select Month"
            value={month.getMonth()}
            onChange={changeMonth}
          >
            {monthNames.map((m, i) => (
              <option
                key={m}
                value={i}
                disabled={
                  selectedYear === minCalendarMonth.getFullYear() &&
                  i < minCalendarMonth.getMonth()
                }
              >
                {m}
              </option>
            ))}
          </select>
          <select
            aria-label="Select Year"
            value={selectedYear}
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
          const dateValue = toUtcDateValue(date);
          const isBeforeMinDate = dateValue < minSelectableValue;
          const isSelectable = !dayState.blocked && !isBeforeMinDate;
          const classes = ['day', dayState.className];
          const isSelectedStart = range.checkIn && isSameDay(date, range.checkIn);
          const isSelectedEnd = checkOutDisplay && isSameDay(date, checkOutDisplay);
          const isWithinRange =
            range.checkIn && checkOutDisplay
              ? toUtcDateValue(date) > toUtcDateValue(range.checkIn) &&
                toUtcDateValue(date) < toUtcDateValue(checkOutDisplay)
              : false;

          if (isBeforeMinDate) {
            classes.push('blocked');
          }
          if (isSelectable) {
            classes.push('interactive');
          }
          if (isSelectedStart) {
            classes.push('selected', 'selected-start');
          }
          if (isSelectedEnd) {
            classes.push('selected', 'selected-end');
          }
          if (isWithinRange) {
            classes.push('in-range');
          }
          if (isUnavailableRangeSelected && (isSelectedStart || isSelectedEnd || isWithinRange)) {
            classes.push('range-conflict');
          }

          return (
            <div
              key={date.toISOString()}
              role="gridcell"
              aria-disabled={!isSelectable}
              tabIndex={isSelectable ? 0 : -1}
              onClick={() => handleDayClick(date)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleDayClick(date);
                }
              }}
              className={classes.join(' ')}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
      {selectionError ? (
        <div role="alert" className="availability-selection-error">
          {selectionError}
        </div>
      ) : null}
    </div>
  );
}

export default AvailabilityCalendar;
