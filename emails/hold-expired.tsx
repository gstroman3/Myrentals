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

export interface HoldExpiredEmailProps {
  guestName: string | null;
  invoiceNumber: string;
  stay: StayDetails | null;
  expiredAt: string;
  holdExpiresAt: string | null;
}

function HoldExpiredEmail(props: HoldExpiredEmailProps) {
  const { guestName, invoiceNumber, stay, expiredAt, holdExpiresAt } = props;
  const greeting = guestName?.trim() ? `Hi ${guestName.trim()},` : 'Hello,';
  const expiredDisplay = formatDateTimeDisplay(expiredAt);
  const scheduledExpiry = holdExpiresAt ? formatDateTimeDisplay(holdExpiresAt) : null;
  const stayRange = stay ? formatStayRange(stay) : null;

  const rows = [
    { label: 'Invoice', value: invoiceNumber },
    stay ? { label: 'Requested stay', value: stayRange ?? `${stay.checkInDisplay} – ${stay.checkOutDisplay}` } : null,
    scheduledExpiry ? { label: 'Original hold deadline', value: scheduledExpiry } : null,
    { label: 'Expired at', value: expiredDisplay },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <EmailLayout title="[Ashburn VA Stay] Hold Expired">
      <h1 style={headingStyle}>Hold expired</h1>
      <p style={textStyle}>{greeting}</p>
      <p style={textStyle}>
        We didn&rsquo;t receive payment in time, so the temporary hold on Ashburn VA Stay has expired.
        The dates you requested are now available for other guests.
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
      <h2 style={subheadingStyle}>Need assistance?</h2>
      <p style={textStyle}>
        If you still want to stay with us, reply to this email and we&rsquo;ll help you set up a new hold
        or explore alternative dates.
      </p>
      <h2 style={subheadingStyle}>House rules &amp; policies</h2>
      <PolicyLinksList />
      <p style={textStyle}>Regards,
        <br />
        Stroman Properties
      </p>
    </EmailLayout>
  );
}

function createHoldExpiredText(props: HoldExpiredEmailProps): string {
  const { guestName, invoiceNumber, stay, expiredAt, holdExpiresAt } = props;
  const lines: string[] = [];
  lines.push(`Hi ${guestName?.trim() ? guestName.trim() : 'there'},`);
  lines.push('');
  lines.push('Your booking hold has expired.');
  lines.push(`Invoice: ${invoiceNumber}`);
  if (stay) {
    lines.push(`Requested stay: ${stay.checkInDisplay} to ${stay.checkOutDisplay}`);
  }
  if (holdExpiresAt) {
    lines.push(`Original deadline: ${formatDateTimeDisplay(holdExpiresAt)}`);
  }
  lines.push(`Expired at: ${formatDateTimeDisplay(expiredAt)}`);
  lines.push('');
  lines.push('Reply if you\'d like us to reopen the conversation or secure new dates.');
  lines.push('');
  lines.push('Policies:');
  POLICY_LINKS.forEach((link) => {
    lines.push(`- ${link.label}: ${link.href}`);
  });
  lines.push('');
  lines.push('Regards,');
  lines.push('Stroman Properties');
  return lines.join('\n');
}

export async function buildHoldExpiredEmail(
  props: HoldExpiredEmailProps,
): Promise<EmailContent> {
  const subject = `[Ashburn VA Stay] Hold Expired - Invoice ${props.invoiceNumber}`;
  const html = await renderEmail(<HoldExpiredEmail {...props} />);
  const text = createHoldExpiredText(props);
  return { subject, html, text };
}
