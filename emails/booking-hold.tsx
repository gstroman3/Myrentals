import * as React from 'react';
import type { PaymentOption } from '@/lib/paymentOptions';
import { renderEmail, type EmailContent } from '@/lib/email';
import {
  EmailLayout,
  PolicyLinksList,
  buttonStyle,
  emphasisStyle,
  headingStyle,
  subheadingStyle,
  textStyle,
  POLICY_LINKS,
} from './layout';
import {
  formatDateTimeDisplay,
  formatStayRange,
  type StayDetails,
} from '@/lib/stays';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const summaryTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: '0 8px',
  margin: '0 0 24px',
};

const summaryLabelStyle: React.CSSProperties = {
  ...textStyle,
  margin: 0,
  fontWeight: 600,
  width: '45%',
};

const summaryValueStyle: React.CSSProperties = {
  ...textStyle,
  margin: 0,
  textAlign: 'right',
  width: '55%',
};

export interface BookingHoldEmailProps {
  guestName: string | null;
  invoiceNumber: string;
  stay: StayDetails | null;
  holdExpiresAt: string;
  totalAmount: number;
  paymentOption: PaymentOption | null;
  proofUrl: string;
}

function formatCurrency(amount: number): string {
  return currencyFormatter.format(Math.round(amount * 100) / 100);
}

function BookingHoldEmail(props: BookingHoldEmailProps) {
  const {
    guestName,
    invoiceNumber,
    stay,
    holdExpiresAt,
    totalAmount,
    paymentOption,
    proofUrl,
  } = props;
  const greeting = guestName?.trim() ? `Hi ${guestName.trim()},` : 'Hello,';
  const stayRange = stay ? formatStayRange(stay) : null;
  const holdExpiresDisplay = formatDateTimeDisplay(holdExpiresAt);
  const totalDisplay = formatCurrency(totalAmount);

  const rows = [
    { label: 'Invoice', value: invoiceNumber },
    stay ? { label: 'Check-in', value: stay.checkInDisplay } : null,
    stay ? { label: 'Check-out', value: stay.checkOutDisplay } : null,
    stay ? { label: 'Nights', value: String(stay.nights) } : null,
    { label: 'Total due', value: totalDisplay },
    { label: 'Hold expires', value: holdExpiresDisplay },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <EmailLayout title="[Ashburn VA Stay] Hold Created">
      <h1 style={headingStyle}>Hold confirmed for Ashburn VA Stay</h1>
      <p style={textStyle}>{greeting}</p>
      <p style={textStyle}>
        Thanks for choosing Ashburn VA Stay! We have placed a temporary hold on your
        requested dates
        {stayRange ? ` (${stayRange})` : ''} while we await your payment.
      </p>
      <table style={summaryTableStyle} role="presentation">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td style={summaryLabelStyle}>{row.label}</td>
              <td style={summaryValueStyle}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 style={subheadingStyle}>How to complete your payment</h2>
      {paymentOption ? (
        <>
          <p style={textStyle}>
            Send <span style={emphasisStyle}>{totalDisplay}</span> via{' '}
            <span style={emphasisStyle}>{paymentOption.label}</span> to{' '}
            <span style={emphasisStyle}>{paymentOption.recipient}</span>.
          </p>
          <p style={textStyle}>{paymentOption.instructions}</p>
        </>
      ) : (
        <p style={textStyle}>
          Use the payment method you selected to remit <span style={emphasisStyle}>{totalDisplay}</span>
          {' '}to Stroman Properties.
        </p>
      )}
      <p style={textStyle}>
        Once your transfer is sent, upload proof so we can verify and fully confirm your stay.
      </p>
      <p style={{ ...textStyle, textAlign: 'center' }}>
        <a href={proofUrl} style={buttonStyle}>
          Upload payment proof
        </a>
      </p>
      <h2 style={subheadingStyle}>House rules &amp; policies</h2>
      <PolicyLinksList />
      <p style={textStyle}>
        Warm regards,
        <br />
        Stroman Properties
      </p>
    </EmailLayout>
  );
}

function createBookingHoldText(props: BookingHoldEmailProps): string {
  const {
    guestName,
    invoiceNumber,
    stay,
    holdExpiresAt,
    totalAmount,
    paymentOption,
    proofUrl,
  } = props;
  const lines: string[] = [];
  lines.push(`Hi ${guestName?.trim() ? guestName.trim() : 'there'},`);
  lines.push('');
  if (stay) {
    lines.push(
      `We\'ve placed a temporary hold on Ashburn VA Stay from ${stay.checkInDisplay} to ${stay.checkOutDisplay}.`,
    );
  } else {
    lines.push("We've placed a temporary hold on Ashburn VA Stay for your requested dates.");
  }
  lines.push(`Invoice: ${invoiceNumber}`);
  if (stay) {
    lines.push(`Nights: ${stay.nights}`);
    lines.push(`Check-in: ${stay.checkInDisplay}`);
    lines.push(`Check-out: ${stay.checkOutDisplay}`);
  }
  lines.push(`Total due: ${formatCurrency(totalAmount)}`);
  lines.push(`Hold expires: ${formatDateTimeDisplay(holdExpiresAt)}`);
  lines.push('');
  if (paymentOption) {
    lines.push(
      `Send ${formatCurrency(totalAmount)} via ${paymentOption.label} to ${paymentOption.recipient}.`,
    );
    lines.push(paymentOption.instructions);
  } else {
    lines.push('Use the payment method you selected to submit your total.');
  }
  lines.push('');
  lines.push(`Upload proof so we can verify your payment: ${proofUrl}`);
  lines.push('');
  lines.push('Policies:');
  POLICY_LINKS.forEach((link) => {
    lines.push(`- ${link.label}: ${link.href}`);
  });
  lines.push('');
  lines.push('Warm regards,');
  lines.push('Stroman Properties');
  return lines.join('\n');
}

export async function buildBookingHoldEmail(
  props: BookingHoldEmailProps,
): Promise<EmailContent> {
  const subject = `[Ashburn VA Stay] Hold Created - Invoice ${props.invoiceNumber}`;
  const html = await renderEmail(<BookingHoldEmail {...props} />);
  const text = createBookingHoldText(props);
  return { subject, html, text };
}
