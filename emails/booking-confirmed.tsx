import * as React from 'react';
import { renderEmail, type EmailContent } from '@/lib/email';
import {
  EmailLayout,
  PolicyLinksList,
  buttonStyle,
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

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: '0 8px',
  margin: '0 0 24px',
};

const labelStyle: React.CSSProperties = {
  ...textStyle,
  margin: 0,
  fontWeight: 600,
  width: '45%',
};

const valueStyle: React.CSSProperties = {
  ...textStyle,
  margin: 0,
  textAlign: 'right',
  width: '55%',
};

const itineraryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#2563eb',
};

export interface BookingConfirmedEmailProps {
  guestName: string | null;
  invoiceNumber: string;
  stay: StayDetails | null;
  paidAt: string;
  arrivalGuideUrl: string;
}

function BookingConfirmedEmail(props: BookingConfirmedEmailProps) {
  const { guestName, invoiceNumber, stay, paidAt, arrivalGuideUrl } = props;
  const greeting = guestName?.trim() ? `Hi ${guestName.trim()},` : 'Hello,';
  const paidAtDisplay = formatDateTimeDisplay(paidAt);
  const stayRange = stay ? formatStayRange(stay) : null;

  const rows = [
    { label: 'Invoice', value: invoiceNumber },
    stay ? { label: 'Check-in', value: stay.checkInDisplay } : null,
    stay ? { label: 'Check-out', value: stay.checkOutDisplay } : null,
    stay ? { label: 'Nights', value: String(stay.nights) } : null,
    { label: 'Payment verified', value: paidAtDisplay },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <EmailLayout title="[Ashburn VA Stay] Booking Confirmed">
      <h1 style={headingStyle}>Your stay is confirmed!</h1>
      <p style={textStyle}>{greeting}</p>
      <p style={textStyle}>
        We received your payment and locked in your stay at Ashburn VA Stay
        {stayRange ? ` (${stayRange})` : ''}. We can&rsquo;t wait to host you.
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
      <h2 style={subheadingStyle}>Next steps</h2>
      <p style={textStyle}>
        In the days leading up to your arrival we&rsquo;ll send detailed check-in instructions, Wi-Fi
        credentials, and local recommendations. In the meantime you can review our welcome guide
        anytime.
      </p>
      <p style={{ ...textStyle, textAlign: 'center' }}>
        <a href={arrivalGuideUrl} style={itineraryButtonStyle}>
          View welcome guide
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

function createBookingConfirmedText(props: BookingConfirmedEmailProps): string {
  const { guestName, invoiceNumber, stay, paidAt, arrivalGuideUrl } = props;
  const lines: string[] = [];
  lines.push(`Hi ${guestName?.trim() ? guestName.trim() : 'there'},`);
  lines.push('');
  lines.push('Great news — your booking is confirmed!');
  lines.push(`Invoice: ${invoiceNumber}`);
  if (stay) {
    lines.push(`Check-in: ${stay.checkInDisplay}`);
    lines.push(`Check-out: ${stay.checkOutDisplay}`);
    lines.push(`Nights: ${stay.nights}`);
  }
  lines.push(`Payment verified: ${formatDateTimeDisplay(paidAt)}`);
  lines.push('');
  lines.push(`Welcome guide: ${arrivalGuideUrl}`);
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

export async function buildBookingConfirmedEmail(
  props: BookingConfirmedEmailProps,
): Promise<EmailContent> {
  const subject = `[Ashburn VA Stay] Booking Confirmed - Invoice ${props.invoiceNumber}`;
  const html = await renderEmail(<BookingConfirmedEmail {...props} />);
  const text = createBookingConfirmedText(props);
  return { subject, html, text };
}
