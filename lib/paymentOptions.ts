export type PaymentMethod = 'zelle' | 'venmo';

export interface PaymentOption {
  id: PaymentMethod;
  label: string;
  recipient: string;
  instructions: string;
  logo: {
    src: string;
    alt: string;
  };
}

export const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'zelle',
    label: 'Zelle',
    recipient: 'payments@stromanproperties.com',
    instructions:
      'Send via your banking app to Stroman Properties. Include the memo so we can match your transfer quickly.',
    logo: {
      src: '/images/payment-zelle.svg',
      alt: 'Zelle',
    },
  },
  {
    id: 'venmo',
    label: 'Venmo',
    recipient: '@StromanProperties',
    instructions:
      'Open Venmo and send to @StromanProperties. Use the memo exactly and add your stay dates in the notes.',
    logo: {
      src: '/images/payment-venmo.svg',
      alt: 'Venmo',
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
