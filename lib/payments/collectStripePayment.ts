export interface StripePaymentOptions {
  amount: number;
  currency: string;
  customerEmail: string;
  description?: string;
}

export async function collectStripePayment(
  options: StripePaymentOptions,
): Promise<never> {
  void options;
  throw new Error('Stripe payments are not implemented yet.');
}
