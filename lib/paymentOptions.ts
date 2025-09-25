export type PaymentMethod = 'zelle' | 'venmo';

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
