import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    PAYMENT_ZELLE_NAME: process.env.PAYMENT_ZELLE_NAME,
    PAYMENT_ZELLE_EMAIL: process.env.PAYMENT_ZELLE_EMAIL,
    PAYMENT_ZELLE_PHONE: process.env.PAYMENT_ZELLE_PHONE,
    PAYMENT_VENMO_HANDLE: process.env.PAYMENT_VENMO_HANDLE,
    LEGAL_RENTAL_AGREEMENT_URL: process.env.LEGAL_RENTAL_AGREEMENT_URL,
    LEGAL_CANCELLATION_POLICY_URL: process.env.LEGAL_CANCELLATION_POLICY_URL,
  },
};

export default nextConfig;
