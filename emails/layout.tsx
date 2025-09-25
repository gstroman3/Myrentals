/* eslint-disable @next/next/no-head-element */
import * as React from 'react';

const containerStyle: React.CSSProperties = {
  backgroundColor: '#f5f5f5',
  padding: '32px 16px',
  margin: 0,
};

const cardStyle: React.CSSProperties = {
  maxWidth: '640px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '32px',
  boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)',
};

const footerStyle: React.CSSProperties = {
  maxWidth: '640px',
  margin: '24px auto 0',
  fontFamily: '"Helvetica Neue", Arial, sans-serif',
  fontSize: '13px',
  lineHeight: '18px',
  color: '#475569',
  textAlign: 'center',
};

export const textStyle: React.CSSProperties = {
  fontFamily: '"Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  lineHeight: '24px',
  color: '#0f172a',
  margin: '0 0 16px',
};

export const headingStyle: React.CSSProperties = {
  fontFamily: '"Helvetica Neue", Arial, sans-serif',
  fontSize: '22px',
  lineHeight: '30px',
  color: '#0f172a',
  fontWeight: 700,
  margin: '0 0 16px',
};

export const subheadingStyle: React.CSSProperties = {
  fontFamily: '"Helvetica Neue", Arial, sans-serif',
  fontSize: '18px',
  lineHeight: '26px',
  color: '#0f172a',
  fontWeight: 600,
  margin: '24px 0 12px',
};

export const listStyle: React.CSSProperties = {
  ...textStyle,
  margin: '0 0 16px 20px',
  padding: 0,
};

export const listItemStyle: React.CSSProperties = {
  margin: '0 0 8px',
};

export const emphasisStyle: React.CSSProperties = {
  fontWeight: 600,
};

export const buttonStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '14px 24px',
  backgroundColor: '#0f172a',
  color: '#ffffff',
  textDecoration: 'none',
  borderRadius: '999px',
  fontFamily: '"Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  fontWeight: 600,
};

const SITE_FALLBACK = 'https://stromanproperties.com';

export const SITE_URL = process.env.BOOKINGS_SITE_URL ?? SITE_FALLBACK;

export const POLICY_LINKS = [
  { label: 'House Rules', href: `${SITE_URL}/house-rules` },
  { label: 'Cancellation Policy', href: `${SITE_URL}/cancellation-policy` },
];

interface EmailLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function EmailLayout({ title, children }: EmailLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>{title}</title>
        <meta name="color-scheme" content="light" />
      </head>
      <body style={containerStyle}>
        <div style={cardStyle}>{children}</div>
        <p style={footerStyle}>
          Need assistance? Reply to this email or contact{' '}
          <a href="mailto:bookings@stromanproperties.com" style={{ color: '#0f172a' }}>
            bookings@stromanproperties.com
          </a>
          .
        </p>
      </body>
    </html>
  );
}

export function PolicyLinksList() {
  return (
    <ul style={listStyle}>
      {POLICY_LINKS.map((link) => (
        <li key={link.href} style={listItemStyle}>
          <a
            href={link.href}
            style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
