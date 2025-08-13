import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY missing');

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export const priceIds = {
  basic: 'price_YOUR_BASIC_PRICE_ID',
  professional: 'price_YOUR_PROFESSIONAL_PRICE_ID',
  enterprise: 'price_YOUR_ENTERPRISE_PRICE_ID',
} as const;
