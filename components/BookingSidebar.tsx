'use client';

import { useMemo, useState } from 'react';
import type { Property } from '@/lib/properties';

type PaymentMethod = 'zelle' | 'venmo' | 'paypal';

type HoldResponse = {
  invoice_number: number | string;
  hold_expires_at: string;
};

interface BookingSidebarProps {
  property: Property;
  checkIn: Date | null;
  checkOut: Date | null;
  hasBlockedOverlap: boolean;
  propertyTimezone: string;
  holdWindowHours: number;
}

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  recipient: string;
  instructions: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'zelle',
    label: 'Zelle',
    recipient: 'payments@stromanproperties.com',
    instructions: 'Send via your banking app to Stroman Properties. Include the memo so we can match your transfer quickly.',
  },
  {
    id: 'venmo',
    label: 'Venmo',
    recipient: '@StromanProperties',
    instructions: 'Open Venmo and send to @StromanProperties. Use the memo exactly and add your stay dates in the notes.',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    recipient: 'paypal.me/stromanproperties',
    instructions: 'Visit paypal.me/stromanproperties and submit the total as “Friends & Family” when possible to avoid fees.',
  },
];

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  paymentMethod: PaymentMethod;
}

const CURRENCY_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatDateDisplay(date: Date | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function toUtcDateValue(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function calculateNights(checkIn: Date | null, checkOut: Date | null): number {
  if (!checkIn || !checkOut) {
    return 0;
  }
  const diff = toUtcDateValue(checkOut) - toUtcDateValue(checkIn);
  return Math.max(0, Math.round(diff / (24 * 60 * 60 * 1000)));
}

function formatMemo(
  invoiceNumber: number | string,
  fullName: string,
  checkIn: Date | null,
  checkOut: Date | null,
): string {
  if (!checkIn || !checkOut) {
    return `Invoice ${invoiceNumber}`;
  }
  const parts = fullName.trim().split(/\s+/);
  const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0] ?? '';
  const start = new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
  }).format(checkIn);
  const stayEnd = new Date(checkOut);
  stayEnd.setDate(stayEnd.getDate() - 1);
  const end = new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
  }).format(stayEnd);
  return `Invoice ${invoiceNumber} / ${lastName || 'Guest'} / ${start}–${end}`;
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

export default function BookingSidebar({
  property,
  checkIn,
  checkOut,
  hasBlockedOverlap,
  propertyTimezone,
  holdWindowHours,
}: BookingSidebarProps) {
  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
    paymentMethod: 'zelle',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holdDetails, setHoldDetails] = useState<HoldResponse | null>(null);
  const [confirmedMethod, setConfirmedMethod] = useState<PaymentMethod | null>(null);

  const nights = useMemo(() => calculateNights(checkIn, checkOut), [checkIn, checkOut]);

  const pricing = useMemo(() => {
    if (nights <= 0) {
      return null;
    }
    const nightlyTotal = nights * property.nightlyRate;
    const cleaningFee = property.cleaningFee;
    const taxable = nightlyTotal + cleaningFee;
    const taxes = Number((taxable * property.taxRate).toFixed(2));
    const total = nightlyTotal + cleaningFee + taxes;
    return {
      nightlyTotal,
      cleaningFee,
      taxes,
      total,
    };
  }, [nights, property.cleaningFee, property.nightlyRate, property.taxRate]);

  const selectedPayment = useMemo(
    () => PAYMENT_OPTIONS.find((option) => option.id === (confirmedMethod ?? form.paymentMethod)),
    [confirmedMethod, form.paymentMethod],
  );

  const isRangeSelected = Boolean(checkIn && checkOut && nights > 0);
  const isFormComplete = Boolean(form.fullName && form.email && form.phone && isRangeSelected);
  const isSubmitDisabled =
    !isFormComplete || hasBlockedOverlap || isSubmitting || Boolean(holdDetails);

  const memoText = holdDetails
    ? formatMemo(holdDetails.invoice_number, form.fullName, checkIn, checkOut)
    : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitDisabled || !checkIn || !checkOut) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/bookings/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_slug: property.slug,
          check_in: checkIn.toISOString(),
          check_out: checkOut.toISOString(),
          guest_name: form.fullName,
          guest_email: form.email,
          guest_phone: form.phone,
          payment_method: form.paymentMethod,
        }),
      });
      if (!response.ok) {
        throw new Error(`Unable to create hold (status ${response.status})`);
      }
      const payload = (await response.json()) as HoldResponse;
      setHoldDetails(payload);
      setConfirmedMethod(form.paymentMethod);
    } catch (err) {
      console.error(err);
      setError('We could not start your hold. Please try again or contact us for help.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="booking-sidebar">
      <div className="booking-summary card">
        <h2>Your stay</h2>
        <dl>
          <div>
            <dt>Check-in</dt>
            <dd>{formatDateDisplay(checkIn)}</dd>
          </div>
          <div>
            <dt>Check-out</dt>
            <dd>{formatDateDisplay(checkOut)}</dd>
          </div>
          <div>
            <dt>Nights</dt>
            <dd>{nights || '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="pricing-breakdown card">
        <h3>Pricing estimate</h3>
        <ul>
          <li>
            <span>
              {nights > 0
                ? `${nights} night${nights === 1 ? '' : 's'} × ${CURRENCY_FORMAT.format(property.nightlyRate)}`
                : `Nightly rate`}
            </span>
            <strong>
              {pricing ? CURRENCY_FORMAT.format(pricing.nightlyTotal) : '—'}
            </strong>
          </li>
          <li>
            <span>Cleaning fee</span>
            <strong>
              {pricing ? CURRENCY_FORMAT.format(pricing.cleaningFee) : '—'}
            </strong>
          </li>
          <li>
            <span>Estimated taxes</span>
            <strong>{pricing ? CURRENCY_FORMAT.format(pricing.taxes) : '—'}</strong>
          </li>
          <li className="total">
            <span>Total due</span>
            <strong>{pricing ? CURRENCY_FORMAT.format(pricing.total) : '—'}</strong>
          </li>
        </ul>
        <p className="estimate-note">
          {pricing
            ? 'Final total confirmed upon verification.'
            : 'Add your dates to see an estimated total.'}
        </p>
      </div>

      <form className="booking-form card" onSubmit={handleSubmit}>
        <h3>Guest details</h3>
        <label>
          Full name
          <input
            type="text"
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            required
            placeholder="Jamie Rivera"
            disabled={Boolean(holdDetails)}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
            placeholder="jamie@example.com"
            disabled={Boolean(holdDetails)}
          />
        </label>
        <label>
          Phone
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            required
            placeholder="(555) 555-1234"
            disabled={Boolean(holdDetails)}
          />
        </label>

        <fieldset className="payment-methods" disabled={Boolean(holdDetails)}>
          <legend>Preferred payment</legend>
          {PAYMENT_OPTIONS.map((option) => (
            <label key={option.id} className="payment-option">
              <input
                type="radio"
                name="payment-method"
                value={option.id}
                checked={form.paymentMethod === option.id}
                onChange={() => setForm({ ...form, paymentMethod: option.id })}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>

        {hasBlockedOverlap ? (
          <div className="form-warning" role="alert">
            Selected dates conflict with an existing booking. Choose different nights to continue.
          </div>
        ) : null}
        {error ? (
          <div className="form-error" role="alert">
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={isSubmitDisabled}>
          {isSubmitting ? 'Creating hold…' : holdDetails ? 'Hold created' : 'Start 24-hour hold'}
        </button>
        <p className="hold-disclaimer">Soft-held for 24 hours. Unpaid holds auto-expire.</p>
      </form>

      {holdDetails && selectedPayment ? (
        <div className="hold-next-steps card">
          <h3>Next steps</h3>
          <p>
            Invoice <strong>{holdDetails.invoice_number}</strong> is reserved until{' '}
            <strong>{formatDateTimeInZone(holdDetails.hold_expires_at, propertyTimezone)}</strong>.
          </p>
          <p>
            Send the total via <strong>{selectedPayment.label}</strong> to{' '}
            <strong>{selectedPayment.recipient}</strong>.
          </p>
          <p>{selectedPayment.instructions}</p>
          {memoText ? (
            <p className="payment-memo">
              Memo: <strong>{memoText}</strong>
            </p>
          ) : null}
          <p className="proof-note">
            Upload payment proof (screenshot or transaction ID) once sent so we can confirm your stay quickly.
          </p>
          <p className="hold-window-note">
            Holds last {holdWindowHours} hours unless confirmed. Reach out if you need more time or have questions.
          </p>
        </div>
      ) : null}
    </aside>
  );
}
