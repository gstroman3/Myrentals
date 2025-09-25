'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PaymentMethod } from '@/lib/paymentOptions';

interface PaymentInstructionsProps {
  method: PaymentMethod;
  methodLabel: string;
  invoiceNumber: number | string;
  memoText: string;
  holdExpiresAt: string;
  timeZone: string;
}

type CountdownState = {
  msRemaining: number;
  isExpired: boolean;
  isValid: boolean;
};

const ZELLE_NAME = process.env.PAYMENT_ZELLE_NAME?.trim() || 'Stroman Properties';
const ZELLE_EMAIL = process.env.PAYMENT_ZELLE_EMAIL?.trim() || 'payments@stromanproperties.com';
const ZELLE_PHONE = process.env.PAYMENT_ZELLE_PHONE?.trim() || '(512) 555-0165';
const VENMO_HANDLE = process.env.PAYMENT_VENMO_HANDLE?.trim() || '@StromanProperties';

function calculateCountdown(expiresAt: string): CountdownState {
  const timestamp = Date.parse(expiresAt);
  if (Number.isNaN(timestamp)) {
    return { msRemaining: 0, isExpired: true, isValid: false };
  }
  const diff = timestamp - Date.now();
  return {
    msRemaining: Math.max(0, diff),
    isExpired: diff <= 0,
    isValid: true,
  };
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const padded = [hours, minutes, seconds].map((segment) => String(segment).padStart(2, '0'));
  return `${padded[0]}:${padded[1]}:${padded[2]}`;
}

function formatDateTimeInZone(value: string, timeZone: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(date);
}

export default function PaymentInstructions({
  method,
  methodLabel,
  invoiceNumber,
  memoText,
  holdExpiresAt,
  timeZone,
}: PaymentInstructionsProps) {
  const [countdown, setCountdown] = useState<CountdownState>(() => calculateCountdown(holdExpiresAt));

  useEffect(() => {
    setCountdown(calculateCountdown(holdExpiresAt));
    const timestamp = Date.parse(holdExpiresAt);
    if (Number.isNaN(timestamp)) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      setCountdown(calculateCountdown(holdExpiresAt));
    }, 1000);
    return () => {
      window.clearInterval(interval);
    };
  }, [holdExpiresAt]);

  const countdownLabel = useMemo(() => {
    if (!countdown.isValid) {
      return 'Countdown unavailable';
    }
    if (countdown.isExpired) {
      return 'Hold expired';
    }
    return `Time remaining: ${formatCountdown(countdown.msRemaining)}`;
  }, [countdown]);

  const expiresDisplay = useMemo(
    () => formatDateTimeInZone(holdExpiresAt, timeZone),
    [holdExpiresAt, timeZone],
  );

  const countdownClassName = useMemo(
    () => `hold-countdown${countdown.isValid && countdown.isExpired ? ' expired' : ''}`,
    [countdown.isExpired, countdown.isValid],
  );

  let methodDetails: ReactNode;
  if (method === 'zelle') {
    methodDetails = (
      <>
        <p>Use your bank&apos;s Zelle transfer feature to send to the contact below.</p>
        <ul className="payment-contact">
          <li>
            <span>Name</span>
            <strong>{ZELLE_NAME}</strong>
          </li>
          <li>
            <span>Email</span>
            <strong>{ZELLE_EMAIL}</strong>
          </li>
          <li>
            <span>Phone</span>
            <strong>{ZELLE_PHONE}</strong>
          </li>
        </ul>
        <p className="method-note">
          Include the memo exactly so we can match your transfer quickly.
        </p>
      </>
    );
  } else {
    methodDetails = (
      <>
        <p>Open Venmo and send to our business handle below.</p>
        <ul className="payment-contact">
          <li>
            <span>Venmo handle</span>
            <strong>{VENMO_HANDLE}</strong>
          </li>
        </ul>
        <p className="method-note">Add your stay dates in the Venmo notes.</p>
      </>
    );
  }

  return (
    <div className="payment-instructions">
      <p>
        Invoice <strong>{invoiceNumber}</strong> is reserved until <strong>{expiresDisplay}</strong>.
      </p>
      <p className={countdownClassName} role="status">
        {countdownLabel}
      </p>
      <p>
        Send the total via <strong>{methodLabel}</strong>.
      </p>
      {methodDetails}
      <p className="payment-memo">
        Memo: <strong>{memoText}</strong>
      </p>
    </div>
  );
}
