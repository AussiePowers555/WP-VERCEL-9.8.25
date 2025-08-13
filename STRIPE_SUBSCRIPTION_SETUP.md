# Stripe Subscription System Setup Guide

## Overview
This project now includes a complete Stripe-based subscription system that provides:
- Monthly recurring subscriptions with 14-day free trials
- Automatic access control middleware
- Stripe Checkout integration
- Customer subscription verification
- Multiple subscription tiers (Basic, Professional, Enterprise)

## Environment Variables Required
Add these to your Vercel environment variables:

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
DEV_MODE=false
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Setup Instructions

### 1. Create Stripe Account
- Go to [https://stripe.com](https://stripe.com) and create an account
- Get your API keys from Stripe Dashboard > Developers > API keys

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Stripe Products
Run the setup script to create products and prices in your Stripe account:
```bash
npx tsx scripts/setup-stripe-products.ts
```

**Important**: Copy the generated Price IDs and update them in `lib/stripe.ts`

### 4. Configure Webhooks
In your Stripe Dashboard:
- Go to Developers > Webhooks
- Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
- Select events: `checkout.session.completed`, `customer.subscription.updated`
- Copy the webhook secret to your environment variables

### 5. Test the System
1. Visit `/subscribe/pricing` to see the pricing page
2. Select a plan to test Stripe Checkout
3. Use Stripe test cards for testing
4. Verify webhook events in Stripe Dashboard

## Features

### Subscription Plans
- **Basic**: $29/month - Basic features, email support, up to 5 projects
- **Professional**: $99/month - All basic features, priority support, unlimited projects, analytics
- **Enterprise**: $299/month - All professional features, custom integrations, dedicated support, SLA

### Access Control
- Non-subscribers are redirected to `/subscribe/pricing`
- Existing subscribers can login at `/subscribe/login`
- All subscription routes are public
- Main app routes are protected by subscription middleware

### Development Mode
Set `DEV_MODE=true` to bypass subscription checks during development.

## File Structure
```
lib/
├── stripe.ts              # Stripe configuration and price IDs
└── subscription.ts        # Subscription utility functions

app/
├── api/
│   ├── subscribe/[plan]/  # Plan selection and checkout redirect
│   ├── subscription/verify # Customer access verification
│   └── webhooks/stripe    # Stripe webhook handler
└── subscribe/
    ├── pricing/           # Pricing page with plan selection
    ├── success/           # Post-purchase success page
    └── login/             # Subscriber login page

scripts/
└── setup-stripe-products.ts # Stripe product creation script

middleware.ts              # Updated to include subscription routes
```

## Customization

### Modify Plans
Edit the plans array in `app/subscribe/pricing/page.tsx` and `scripts/setup-stripe-products.ts`

### Change Trial Period
Update the `trialDays` parameter in `app/api/subscribe/[plan]/route.ts`

### Add Features
Extend the subscription system by:
- Adding more subscription tiers
- Implementing usage-based billing
- Adding coupon support
- Integrating with your user database

## Testing
- Use Stripe test mode for development
- Test cards: 4242 4242 4242 4242 (success), 4000 0000 0000 0002 (declined)
- Monitor webhook events in Stripe Dashboard
- Test subscription lifecycle (create, update, cancel)

## Deployment
1. Set environment variables in Vercel
2. Deploy your application
3. Test the complete subscription flow
4. Monitor webhook delivery in Stripe Dashboard

## Support
- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- Check Stripe Dashboard for webhook delivery status
