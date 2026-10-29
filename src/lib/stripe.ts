import Stripe from 'stripe';

// Lazy initialization wrapper so Next.js build step doesn't crash when env vars aren't present at compile-time
let stripeInstance: Stripe | null = null;

export const getStripe = () => {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is missing from environment variables.');
    }
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2025-02-24.acacia' as any,
      typescript: true,
    });
  }
  return stripeInstance;
};

// For direct usage where supported
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    const client = getStripe();
    return (client as any)[prop];
  },
});