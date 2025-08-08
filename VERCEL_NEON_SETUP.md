# Vercel + Neon PostgreSQL Setup Guide

## Environment Variables for Vercel

### Required Environment Variables
Add these environment variables to your Vercel project:

```bash
# Database Configuration
DATABASE_URL=postgresql://<USER>:<PASSWORD>@<HOST>/<DB>?channel_binding=require&sslmode=require

# Application Configuration  
NEXT_PUBLIC_BASE_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_APP_NAME=PBikeRescue Rails

# JWT Secret for authentication
JWT_SECRET=<generate-a-strong-secret>

# API Keys (Add in Vercel, do not commit real keys)
BREVO_API_KEY=<vercel-env>
BREVO_SENDER_EMAIL=<vercel-env>
BREVO_SENDER_NAME=<vercel-env>

# JotForm Integration
JOTFORM_API_KEY=<vercel-env>

# DeepSeek AI Configuration
DEEPSEEK_API_URL=https://openrouter.ai/deepseek/deepseek-r1:free
DEEPSEEK_API_KEY=<vercel-env>

# Stripe Payment Configuration
STRIPE_SECRET_KEY=<vercel-env>

# Email Configuration
EMAIL_FROM=<vercel-env>
EMAIL_REPLY_TO=<vercel-env>

# Production Mode
NODE_ENV=production
```

## Vercel CLI Setup Commands

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Link your project to Vercel
```bash
vercel link
```

### 4. Set environment variables using Vercel CLI
```bash
# Database URL
vercel env add DATABASE_URL

# When prompted, paste your Neon connection string
# postgresql://<USER>:<PASSWORD>@<HOST>/<DB>?channel_binding=require&sslmode=require

# JWT Secret
vercel env add JWT_SECRET

# Set other environment variables as needed
vercel env add BREVO_API_KEY
vercel env add JOTFORM_API_KEY
vercel env add STRIPE_SECRET_KEY
```

## Manual Vercel Dashboard Setup

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each environment variable from the list above

## Neon Database Details

- Project, database, region: configure as per your Neon account
- Use pooled connection URLs in production

## Vercel Configuration

Your Next.js project will build with default Vercel settings.

## Database Migration on Vercel

When deployed, your app will:
1. Auto-detect PostgreSQL connection (not SQLite)
2. Initialize PostgreSQL tables and indexes
3. Seed initial data if database is empty
4. Use connection pooling for better performance

## Testing the Setup

1. Deploy to Vercel: `vercel --prod`
2. Test the health endpoint: `https://your-app.vercel.app/api/health`
3. Check database connectivity in Vercel logs

## Important Notes

- Do not commit real secrets. Use Vercel env vars.
- SSL is required and properly configured for Neon.
- Connection pooling is recommended for serverless functions.
- The app will automatically use PostgreSQL when `DATABASE_URL` starts with `postgresql://`.