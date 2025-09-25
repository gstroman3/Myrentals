import * as React from 'react';
import { renderEmail, type EmailContent } from '@/lib/email';
import {
  EmailLayout,
  PolicyLinksList,
  headingStyle,
  subheadingStyle,
  textStyle,
  POLICY_LINKS,
} from './layout';
import { formatDateTimeDisplay, formatStayRange, type StayDetails } from '@/lib/stays';
import { getPaymentLabel } from '@/lib/paymentOptions';

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: '0 6px',
  margin: '0 0 24px',
};

const labelStyle: React.CSSProperties = {
  ...textStyle,
  margin: 0,
  fontWeight: 600,
  width: '40%',
};

const valueStyle: React.CSSProperties = {
  ...textStyle,
  margin: 0,
  textAlign: 'right',
  width: '60%',
  wordBreak: 'break-word',
};

export interface PaymentProofEmailProps {
  invoiceNumber: string;
  payerName: string;
  processor: string;
  reference?: string | null;
  note?: string | null;
  proofUrl: string;
  submittedAt: string;
  stay: StayDetails | null;
  paymentMethod: string | null;
}

function PaymentProofReceivedEmail(props: PaymentProofEmailProps) {
  const { invoiceNumber, payerName, processor, reference, note, proofUrl, submittedAt, stay, paymentMethod } = props;
  const receivedDisplay = formatDateTimeDisplay(submittedAt);
  const paymentLabel = getPaymentLabel(processor || paymentMethod || 'Payment');
  const stayDescription = stay ? `${formatStayRange(stay)} (${stay.nights} nights)` : '—';

  const rows = [
    { label: 'Invoice', value: invoiceNumber },
    { label: 'Payer', value: payerName },
    { label: 'Payment method', value: paymentLabel },
    { label: 'Submitted', value: receivedDisplay },
    { label: 'Stay', value: stayDescription },
    reference ? { label: 'Reference', value: reference } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <EmailLayout title="[Ashburn VA Stay] Payment Proof Received">
      <h1 style={headingStyle}>Payment proof received</h1>
      <p style={textStyle}>
        A guest submitted proof of payment for Ashburn VA Stay. Please review the details below and
        verify the booking when ready.
      </p>
      <table style={tableStyle} role="presentation">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td style={labelStyle}>{row.label}</td>
              <td style={valueStyle}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {note ? <p style={textStyle}>Guest note: {note}</p> : null}
      <p style={textStyle}>
        View the uploaded proof:
        {' '}
        <a href={proofUrl} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
          {proofUrl}
        </a>
      </p>
      <h2 style={subheadingStyle}>Next steps</h2>
      <p style={textStyle}>
        Confirm the payment in the admin dashboard and notify the guest once verified. If anything
        looks incorrect, reach out to the guest before approving.
      </p>
      <h2 style={subheadingStyle}>Policies</h2>
      <PolicyLinksList />
      <p style={textStyle}>— Stroman Properties</p>
    </EmailLayout>
  );
}

function createPaymentProofText(props: PaymentProofEmailProps): string {
  const { invoiceNumber, payerName, processor, reference, note, proofUrl, submittedAt, stay, paymentMethod } = props;
  const lines: string[] = [];
  const paymentLabel = getPaymentLabel(processor || paymentMethod || 'Payment');
  lines.push('A guest submitted payment proof.');
  lines.push(`Invoice: ${invoiceNumber}`);
  lines.push(`Payer: ${payerName}`);
  lines.push(`Method: ${paymentLabel}`);
  lines.push(`Submitted: ${formatDateTimeDisplay(submittedAt)}`);
  if (stay) {
    lines.push(`Stay: ${stay.checkInDisplay} to ${stay.checkOutDisplay} (${stay.nights} nights)`);
  }
  if (reference) {
    lines.push(`Reference: ${reference}`);
  }
  if (note) {
    lines.push(`Note: ${note}`);
  }
  lines.push(`Proof URL: ${proofUrl}`);
  lines.push('');
  lines.push('Policies:');
  POLICY_LINKS.forEach((link) => {
    lines.push(`- ${link.label}: ${link.href}`);
  });
  return lines.join('\n');
}

export async function buildPaymentProofReceivedEmail(
  props: PaymentProofEmailProps,
): Promise<EmailContent> {
  const subject = `[Ashburn VA Stay] Payment Proof Received - Invoice ${props.invoiceNumber}`;
  const html = await renderEmail(<PaymentProofReceivedEmail {...props} />);
  const text = createPaymentProofText(props);
  return { subject, html, text };
}
