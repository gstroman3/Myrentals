export type PaymentMethod = 'zelle' | 'venmo' | 'card';

export interface PaymentOption {
  id: PaymentMethod;
  label: string;
  recipient: string;
  instructions: string;
  logo: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  disabled?: boolean;
  statusLabel?: string;
}

const ZELLE_EMAIL = process.env.PAYMENT_ZELLE_EMAIL?.trim() || 'payments@stromanproperties.com';
const VENMO_HANDLE = process.env.PAYMENT_VENMO_HANDLE?.trim() || '@StromanProperties';

export const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'zelle',
    label: 'Zelle',
    recipient: ZELLE_EMAIL,
    instructions:
      'Send via your banking app to Stroman Properties. Include the memo so we can match your transfer quickly.',
    logo: {
      src: '/images/zelle-seeklogo.png',
      alt: 'Zelle',
      width: 117,
      height: 48,
    },
  },
  {
    id: 'venmo',
    label: 'Venmo',
    recipient: VENMO_HANDLE,
    instructions: `Open Venmo and send to ${VENMO_HANDLE}. Use the memo exactly and add your stay dates in the notes.`,
    logo: {
      src: '/images/venmo-seeklogo.png',
      alt: 'Venmo',
      width: 64,
      height: 48,
    },
  },
  {
    id: 'card',
    label: 'Pay by Card (3% fee)',
    recipient: 'Secure payment link',
    instructions:
      'Use our secure Stripe checkout link to complete your payment with any major credit or debit card.',
    logo: {
      src: '/images/payment-card.svg',
      alt: 'Credit or debit card',
      width: 96,
      height: 48,
    },
    disabled: true,
    statusLabel: 'Coming soon',
  },
];

export function getPaymentOption(method: string | null | undefined): PaymentOption | null {
  if (!method) {
    return null;
  }
  const normalized = method.trim().toLowerCase();
  return PAYMENT_OPTIONS.find((option) => option.id === normalized) ?? null;
}

export function getPaymentLabel(method: string | null | undefined): string {
  const option = getPaymentOption(method);
  if (option) {
    return option.label;
  }
  return method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Payment';
}
