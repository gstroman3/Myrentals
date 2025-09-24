'use client';

import type { CSSProperties, FormEvent } from 'react';
import { useState } from 'react';

type UploadState = 'idle' | 'submitting' | 'success';

interface UploadProofPageProps {
  params: { invoice: string };
}

const containerStyle: CSSProperties = {
  maxWidth: '640px',
  margin: '0 auto',
  padding: '3rem 1.5rem',
};

const cardStyle: CSSProperties = {
  background: '#ffffff',
  borderRadius: '0.75rem',
  padding: '2rem',
  boxShadow: '0 2px 12px rgba(15, 23, 42, 0.12)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
};

const fieldsetStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  border: 'none',
  padding: 0,
  margin: 0,
};

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  border: '1px solid #d4d4d8',
  fontSize: '1rem',
};

const helperStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.9rem',
  color: '#6b7280',
  fontWeight: 400,
};

const messageStyle: CSSProperties = {
  borderRadius: '0.5rem',
  padding: '1rem',
  fontSize: '0.95rem',
  lineHeight: 1.5,
};

const successStyle: CSSProperties = {
  ...messageStyle,
  background: '#ecfdf5',
  color: '#166534',
  border: '1px solid #bbf7d0',
};

const errorStyle: CSSProperties = {
  ...messageStyle,
  background: '#fef2f2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
};

const submitStyle: CSSProperties = {
  padding: '0.85rem 1.5rem',
  background: 'var(--color-primary)',
  color: '#ffffff',
  fontSize: '1rem',
  border: 'none',
  borderRadius: '0.5rem',
  cursor: 'pointer',
  fontWeight: 600,
};

export default function UploadProofPage({ params }: UploadProofPageProps) {
  const invoiceNumber = params.invoice ?? '';
  const [state, setState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = state === 'submitting';
  const isSuccess = state === 'success';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    formData.set('invoice_number', invoiceNumber);

    const payerName = formData.get('payer_name');
    const proof = formData.get('proof');

    if (typeof payerName !== 'string' || !payerName.trim()) {
      setError('Please share the name associated with the payment.');
      return;
    }

    if (!(proof instanceof File) || proof.size === 0) {
      setError('Please attach your payment screenshot or PDF before submitting.');
      return;
    }

    setError(null);
    setState('submitting');

    try {
      const response = await fetch('/api/bookings/proof', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        const message = payload?.error ?? `We could not upload your proof (status ${response.status}).`;
        throw new Error(message);
      }

      formElement.reset();
      setState('success');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setState('idle');
    }
  };

  return (
    <main style={containerStyle}>
      <section style={cardStyle}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--color-primary)' }}>Upload payment proof</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            Invoice <strong>{invoiceNumber}</strong>
          </p>
        </header>

        <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Thanks for sending your payment. Upload a quick screenshot or PDF of your transfer and share any transaction
          reference details so our team can match it quickly.
        </p>

        {isSuccess && (
          <div style={successStyle} role="status" aria-live="polite">
            Thanks! We received your payment proof. Owner will verify and confirm.
          </div>
        )}

        {error && (
          <div style={errorStyle} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input type="hidden" name="invoice_number" value={invoiceNumber} />
          <fieldset style={fieldsetStyle}>
            <label style={labelStyle}>
              Payer name
              <input
                type="text"
                name="payer_name"
                required
                placeholder="Full name of the payer"
                style={inputStyle}
                disabled={isSubmitting}
              />
            </label>

            <label style={labelStyle}>
              Transaction reference
              <input
                type="text"
                name="reference"
                placeholder="Confirmation number or memo"
                style={inputStyle}
                disabled={isSubmitting}
              />
              <p style={helperStyle}>Include any confirmation code, memo, or handle that helps us find your transfer.</p>
            </label>

            <label style={labelStyle}>
              Additional note
              <textarea
                name="note"
                rows={4}
                placeholder="Anything else we should know?"
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                disabled={isSubmitting}
              />
            </label>

            <label style={labelStyle}>
              Proof of payment
              <input type="file" name="proof" accept="image/*,.pdf" required style={inputStyle} disabled={isSubmitting} />
              <p style={helperStyle}>Upload a screenshot or PDF. JPG, PNG, HEIC, and PDF files are supported.</p>
            </label>
          </fieldset>

          <button type="submit" style={{ ...submitStyle, opacity: isSubmitting ? 0.7 : 1 }} disabled={isSubmitting}>
            {isSubmitting ? 'Uploading…' : 'Submit payment proof'}
          </button>
        </form>
      </section>
    </main>
  );
}
