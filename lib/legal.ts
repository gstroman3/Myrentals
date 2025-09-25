const SITE_FALLBACK = 'https://stromanproperties.com';

const SITE_URL = process.env.BOOKINGS_SITE_URL?.trim() || SITE_FALLBACK;

export const LEGAL_RENTAL_AGREEMENT_URL =
  process.env.LEGAL_RENTAL_AGREEMENT_URL?.trim() || `${SITE_URL}/rental-agreement`;

export const LEGAL_CANCELLATION_POLICY_URL =
  process.env.LEGAL_CANCELLATION_POLICY_URL?.trim() || `${SITE_URL}/cancellation-policy`;

export const LEGAL_POLICY_LINKS = [
  { label: 'Rental Agreement', href: LEGAL_RENTAL_AGREEMENT_URL },
  { label: 'Cancellation Policy', href: LEGAL_CANCELLATION_POLICY_URL },
] as const;

export { SITE_URL };
