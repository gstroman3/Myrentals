'use client';

import { useState, useEffect } from 'react';
import { getBlackouts, saveBlackouts } from '@/lib/ownerBlackouts';
import { coalesce } from './utils/coalesce';
import type { DateRange } from './types';

interface Props {
  propertyId: string;
  onChange?: () => void;
}

export default function OwnerBlackoutsPanel({ propertyId, onChange }: Props) {
  const [ranges, setRanges] = useState<DateRange[]>([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    setRanges(getBlackouts(propertyId));
  }, [propertyId]);

  const add = () => {
    if (!start || !end || start >= end) return;
    const updated = coalesce([...ranges, { start, end }]);
    setRanges(updated);
    saveBlackouts(propertyId, updated);
    setStart('');
    setEnd('');
    onChange?.();
  };

  const remove = (idx: number) => {
    const updated = ranges.filter((_, i) => i !== idx);
    setRanges(updated);
    saveBlackouts(propertyId, updated);
    onChange?.();
  };

  return (
    <div className="owner-blackouts">
      <h3>Owner Blackouts</h3>
      <ul>
        {ranges.map((r, i) => (
          <li key={`${r.start}-${r.end}`}>
            {r.start} → {r.end}
            <button onClick={() => remove(i)}>Delete</button>
          </li>
        ))}
      </ul>
      <div className="form">
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        <button onClick={add}>Add</button>
      </div>
    </div>
  );
}
