import 'dotenv/config';
import { stripe } from '@/lib/stripe';

async function run() {
  const plans = [
    { name: 'Basic Plan', desc: 'Basic access', amount: 2900, id: 'basic' },
    { name: 'Professional Plan', desc: 'Pro access', amount: 9900, id: 'professional' },
    { name: 'Enterprise Plan', desc: 'Enterprise access', amount: 29900, id: 'enterprise' },
  ];

  for (const p of plans) {
    const product = await stripe.products.create({ name: p.name, description: p.desc, metadata: { plan: p.id, type: 'app_subscription' } });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: p.amount,
      currency: 'usd',
      recurring: { interval: 'month', interval_count: 1, trial_period_days: 14 },
      metadata: { plan: p.id },
    });
    console.log(`Created ${p.name}: product=${product.id} price=${price.id}`);
  }
}

run().catch(err => { console.error(err); process.exit(1); });
