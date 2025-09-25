export type PaymentMethod = 'zelle' | 'venmo' | 'paypal';

export interface PaymentOption {
  id: PaymentMethod;
  label: string;
  recipient: string;
  instructions: string;
}

export const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'zelle',
    label: 'Zelle',
    recipient: 'payments@stromanproperties.com',
    instructions:
      'Send via your banking app to Stroman Properties. Include the memo so we can match your transfer quickly.',
  },
  {
    id: 'venmo',
    label: 'Venmo',
    recipient: '@StromanProperties',
    instructions:
      'Open Venmo and send to @StromanProperties. Use the memo exactly and add your stay dates in the notes.',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    recipient: 'paypal.me/stromanproperties',
    instructions:
      'Visit paypal.me/stromanproperties and submit the total as “Friends & Family” when possible to avoid fees.',
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
