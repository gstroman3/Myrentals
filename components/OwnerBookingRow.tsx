'use client';

import { useState } from 'react';
import { formatDateDisplay, formatDateTimeDisplay } from '@/lib/stays';

const CURRENCY_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatCurrency(value: number | null | undefined): string {
  if (typeof value !== 'number') {
    return '—';
  }
  return CURRENCY_FORMAT.format(Math.round(value * 100) / 100);
}

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const pattern = new RegExp(`(?:^|; )${name.replace(/[.$?*|{}()\[\]\\/\+^]/g, '\\$&')}=([^;]*)`);
  const match = document.cookie.match(pattern);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

async function postAdminAction(
  path: string,
  body: Record<string, unknown>,
  adminSecret: string,
): Promise<Response> {
  return fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret,
    },
    body: JSON.stringify(body),
  });
}

export interface OwnerBookingPayment {
  id: string;
  status: string | null;
  processor: string | null;
  payerName: string | null;
  reference: string | null;
  note: string | null;
  proofFileUrl: string | null;
  receivedAt: string | null;
  verifiedAt: string | null;
  amount: number | null;
}

export interface OwnerBookingGuest {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
}

export interface OwnerBookingDetails {
  id: string;
  invoiceNumber: string;
  status: string;
  holdExpiresAt: string | null;
  isHoldExpired: boolean;
  checkIn: string | null;
  checkOut: string | null;
  nights: number | null;
  rateSubtotal: number | null;
  cleaningFee: number | null;
  taxes: number | null;
  totalAmount: number | null;
  paymentMethod: string | null;
  guest: OwnerBookingGuest | null;
  payment: OwnerBookingPayment | null;
}

interface OwnerBookingRowProps {
  booking: OwnerBookingDetails;
  adminCookieName: string;
}

export default function OwnerBookingRow({ booking, adminCookieName }: OwnerBookingRowProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isExpiring, setIsExpiring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const holdExpiresDisplay = booking.holdExpiresAt
    ? formatDateTimeDisplay(booking.holdExpiresAt)
    : '—';
  const checkInDisplay = booking.checkIn ? formatDateDisplay(booking.checkIn) : '—';
  const checkOutDisplay = booking.checkOut ? formatDateDisplay(booking.checkOut) : '—';

  const handleConfirm = async () => {
    setError(null);
    setMessage(null);

    const adminSecret = getCookieValue(adminCookieName);
    if (!adminSecret) {
      setError('Missing admin secret cookie. Set the admin cookie to manage holds.');
      return;
    }

    setIsConfirming(true);
    try {
      const response = await postAdminAction(
        '/api/admin/bookings/verify',
        { invoice_number: booking.invoiceNumber },
        adminSecret,
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const errorMessage = payload?.error ?? `Unable to confirm hold (status ${response.status})`;
        throw new Error(errorMessage);
      }
      setMessage('Hold confirmed successfully. Refreshing…');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm booking hold.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleExpire = async () => {
    setError(null);
    setMessage(null);

    const adminSecret = getCookieValue(adminCookieName);
    if (!adminSecret) {
      setError('Missing admin secret cookie. Set the admin cookie to manage holds.');
      return;
    }

    setIsExpiring(true);
    try {
      const response = await postAdminAction(
        '/api/admin/bookings/expire',
        { invoice_number: booking.invoiceNumber, force: !booking.isHoldExpired },
        adminSecret,
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const errorMessage = payload?.error ?? `Unable to expire hold (status ${response.status})`;
        throw new Error(errorMessage);
      }
      setMessage('Hold expired. Refreshing…');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to expire booking hold.');
    } finally {
      setIsExpiring(false);
    }
  };

  const payment = booking.payment;
  const disableConfirm = isConfirming || Boolean(payment && payment.status === 'verified');
  const disableExpire = isExpiring;
  const proofLink = payment?.proofFileUrl ?? null;
  const paymentReceivedDisplay = payment?.receivedAt
    ? formatDateTimeDisplay(payment.receivedAt)
    : null;

  return (
    <article className="owner-booking card">
      <header className="owner-booking__header">
        <div>
          <h2>Invoice {booking.invoiceNumber}</h2>
          <p className="owner-booking__status">
            Status: <span>{booking.status}</span>
          </p>
        </div>
        <div className={`owner-booking__badge ${booking.isHoldExpired ? 'expired' : ''}`}>
          Hold expires: {holdExpiresDisplay}
        </div>
      </header>

      <div className="owner-booking__grid">
        <section>
          <h3>Guest</h3>
          <p><strong>Name:</strong> {booking.guest?.fullName ?? '—'}</p>
          <p><strong>Email:</strong> {booking.guest?.email ?? '—'}</p>
          <p><strong>Phone:</strong> {booking.guest?.phone ?? '—'}</p>
        </section>

        <section>
          <h3>Stay</h3>
          <p><strong>Check-in:</strong> {checkInDisplay}</p>
          <p><strong>Check-out:</strong> {checkOutDisplay}</p>
          <p><strong>Nights:</strong> {booking.nights ?? '—'}</p>
          <p><strong>Payment method:</strong> {booking.paymentMethod ?? '—'}</p>
        </section>

        <section>
          <h3>Totals</h3>
          <p><strong>Rate subtotal:</strong> {formatCurrency(booking.rateSubtotal)}</p>
          <p><strong>Cleaning fee:</strong> {formatCurrency(booking.cleaningFee)}</p>
          <p><strong>Taxes:</strong> {formatCurrency(booking.taxes)}</p>
          <p><strong>Total due:</strong> {formatCurrency(booking.totalAmount)}</p>
        </section>

        <section>
          <h3>Payment proof</h3>
          <p><strong>Status:</strong> {payment?.status ?? '—'}</p>
          <p><strong>Payer:</strong> {payment?.payerName ?? '—'}</p>
          <p><strong>Processor:</strong> {payment?.processor ?? '—'}</p>
          <p><strong>Reference:</strong> {payment?.reference ?? '—'}</p>
          <p><strong>Received at:</strong> {paymentReceivedDisplay ?? '—'}</p>
          <p><strong>Amount:</strong> {formatCurrency(payment?.amount ?? booking.totalAmount)}</p>
          {proofLink ? (
            <p>
              <a href={proofLink} target="_blank" rel="noreferrer" className="owner-booking__proof-link">
                View proof
              </a>
            </p>
          ) : (
            <p className="owner-booking__no-proof">No proof uploaded yet.</p>
          )}
        </section>
      </div>

      {(error || message) && (
        <div className="owner-booking__messages">
          {error ? <p className="owner-booking__error">{error}</p> : null}
          {message ? <p className="owner-booking__success">{message}</p> : null}
        </div>
      )}

      <footer className="owner-booking__actions">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={disableConfirm || isExpiring || !proofLink}
        >
          {isConfirming ? 'Confirming…' : payment?.status === 'verified' ? 'Confirmed' : 'Confirm payment'}
        </button>
        <button type="button" onClick={handleExpire} disabled={disableExpire || isConfirming}>
          {isExpiring ? 'Expiring…' : booking.isHoldExpired ? 'Expire hold' : 'Force expire'}
        </button>
      </footer>
    </article>
  );
}
