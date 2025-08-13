import { stripe, priceIds } from './stripe';

export async function createCheckoutSession(plan: keyof typeof priceIds, successUrl: string, cancelUrl: string, trialDays = 0) {
  const price = priceIds[plan];
  if (!price) throw new Error('Invalid plan');

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    allow_promotion_codes: true,
    success_url: `${successUrl}?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    line_items: [{ price, quantity: 1 }],
  };

  if (trialDays > 0) {
    params.subscription_data = { trial_period_days: trialDays };
  }

  const session = await stripe.checkout.sessions.create(params);
  return session;
}

export async function customerHasActiveSubscription(email: string) {
  const customers = await stripe.customers.list({ email, limit: 1 });
  if (!customers.data.length) return { hasAccess: false, reason: 'No customer' };
  const customer = customers.data[0];

  const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'active', limit: 1 });
  if (!subs.data.length) return { hasAccess: false, reason: 'No active subscription' };

  const sub = subs.data[0];
  return {
    hasAccess: true,
    subscriptionId: sub.id,
    customerId: customer.id,
    currentPeriodEnd: sub.current_period_end,
  };
}
