import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { sendOwnerNotification } from '@/lib/notifications';
import { supabaseJson, supabaseRequest } from '@/lib/supabase/rest';
import { uploadStorageObject } from '@/lib/supabase/storage';

const PROCESSORS = ['zelle', 'venmo', 'paypal', 'offline'] as const;
type Processor = (typeof PROCESSORS)[number];
const VALID_PROCESSORS = new Set<Processor>(PROCESSORS);

type BookingRecord = {
  id: string;
  invoice_number: string;
  status: string;
  hold_expires_at: string | null;
  payment_method: string | null;
};

type PaymentRecord = {
  id: string;
  booking_id: string;
};

class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function requireFormString(form: FormData, field: string): string {
  const value = form.get(field);
  if (typeof value !== 'string') {
    throw new HttpError(`Missing field: ${field}`, 400);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new HttpError(`Missing field: ${field}`, 400);
  }
  return trimmed;
}

function optionalFormString(form: FormData, field: string): string | null {
  const value = form.get(field);
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function sanitizeInvoiceFolder(invoice: string): string {
  const fallback = 'invoice';
  const cleaned = invoice.replace(/[^A-Za-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return cleaned || fallback;
}

function resolveExtension(filename: string): string | null {
  const parts = filename.split('.');
  if (parts.length < 2) return null;
  const ext = parts.pop();
  if (!ext) return null;
  const safe = ext.toLowerCase().replace(/[^a-z0-9]/g, '');
  return safe || null;
}

function buildProofObjectPath(invoiceNumber: string, originalName: string): string {
  const folder = sanitizeInvoiceFolder(invoiceNumber);
  const extension = resolveExtension(originalName);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '');
  const suffix = extension ? `.${extension}` : '';
  return `${folder}/${timestamp}-${randomUUID()}${suffix}`;
}

function isHoldExpired(holdExpiresAt: string | null): boolean {
  if (!holdExpiresAt) return false;
  const expires = new Date(holdExpiresAt);
  if (Number.isNaN(expires.getTime())) {
    return true;
  }
  return expires.getTime() <= Date.now();
}

function resolveProcessor(value: string | null): Processor {
  const normalized = (value ?? '').toLowerCase();
  if (VALID_PROCESSORS.has(normalized as Processor)) {
    return normalized as Processor;
  }
  return 'offline';
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const invoiceNumber = requireFormString(form, 'invoice_number');
    const payerName = requireFormString(form, 'payer_name');
    const reference = optionalFormString(form, 'reference');
    const note = optionalFormString(form, 'note');
    const proof = form.get('proof');

    if (!(proof instanceof File)) {
      throw new HttpError('Proof upload is required', 400);
    }
    if (proof.size <= 0) {
      throw new HttpError('Uploaded proof file is empty', 400);
    }

    const bookingRecords = await supabaseJson<BookingRecord[]>(
      `/bookings?invoice_number=eq.${encodeURIComponent(invoiceNumber)}&select=id,invoice_number,status,hold_expires_at,payment_method&limit=1`,
    );
    const booking = bookingRecords?.[0];
    if (!booking) {
      throw new HttpError('Booking not found for this invoice', 404);
    }
    if (booking.status !== 'pending_hold') {
      throw new HttpError('This booking is not awaiting payment proof', 400);
    }
    if (isHoldExpired(booking.hold_expires_at)) {
      throw new HttpError('This hold has expired. Please contact us for assistance.', 400);
    }

    const paymentRecords = await supabaseJson<PaymentRecord[]>(
      `/payments?booking_id=eq.${encodeURIComponent(booking.id)}&select=id,booking_id&limit=1`,
    );
    const payment = paymentRecords?.[0];
    if (!payment) {
      throw new HttpError('Payment record not found for this booking', 404);
    }

    const fileData = await proof.arrayBuffer();
    const objectPath = buildProofObjectPath(invoiceNumber, proof.name);
    const uploadResult = await uploadStorageObject({
      bucket: 'proofs',
      objectPath,
      body: fileData,
      contentType: proof.type || 'application/octet-stream',
      upsert: true,
    });

    const processor = resolveProcessor(booking.payment_method);
    const updatePayload = {
      payer_name: payerName,
      reference: reference ?? null,
      note: note ?? null,
      proof_file_url: uploadResult.publicUrl,
      processor,
      received_at: new Date().toISOString(),
    };

    const updateResponse = await supabaseRequest(
      `/payments?id=eq.${encodeURIComponent(payment.id)}`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        json: updatePayload,
      },
    );

    if (!updateResponse.ok) {
      const text = await updateResponse.text().catch(() => '');
      throw new Error(`Failed to update payment record (${updateResponse.status}): ${text}`);
    }

    const emailLines = [
      'A guest submitted payment proof.',
      `Invoice: ${invoiceNumber}`,
      `Payer: ${payerName}`,
      `Processor: ${processor}`,
      reference ? `Reference: ${reference}` : null,
      note ? `Note: ${note}` : null,
      `Proof URL: ${uploadResult.publicUrl}`,
    ].filter(Boolean);

    await sendOwnerNotification({
      subject: 'Payment proof received.',
      body: emailLines.join('\n'),
    });

    return NextResponse.json({
      success: true,
      message: 'Thanks! We received your payment proof. Owner will verify and confirm.',
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error('Failed to process payment proof upload', error);
    return NextResponse.json({ error: 'Unable to submit payment proof' }, { status: 500 });
  }
}
