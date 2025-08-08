# PostgreSQL Setup for Vercel Deployment

Your application already supports PostgreSQL! It automatically switches between SQLite (local) and PostgreSQL (production) based on the `DATABASE_URL` format.

## Quick Setup Steps

### 1. Create a PostgreSQL Database

Choose one of these providers (all have free tiers):

#### Option A: Neon (Recommended for Vercel)
1. Go to [neon.tech](https://neon.tech)
2. Sign up for free account
3. Create new project
4. Copy the connection string (looks like: `postgresql://user:pass@host/database?sslmode=require`)

#### Option B: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy the connection string

#### Option C: Railway PostgreSQL
1. Go to [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy the DATABASE_URL from variables

### 2. Add Database URL to Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add these variables:

```
DATABASE_URL = [your PostgreSQL connection string]
JWT_SECRET = [generate a secure random string]
NEXT_PUBLIC_BASE_URL = https://wp-rental-app.vercel.app
```

### 3. Deploy to Vercel

```bash
# Deploy to production
vercel --prod
```

## How It Works

Your `src/lib/database.ts` file automatically detects the database type:

- If `DATABASE_URL` starts with `file:` → Uses SQLite (local development)
- If `DATABASE_URL` starts with `postgresql://` → Uses PostgreSQL (production)

The database will automatically:
1. Create all required tables on first run
2. Seed initial data (test users and cases)
3. Handle all migrations automatically

## Default Login Credentials

After deployment, these accounts will be available:

1. **Developer Account 1:**
   - Email: `whitepointer2016@gmail.com`
   - Password: `Tr@ders84`

2. **Developer Account 2:**
   - Email: `michaelalanwilson@gmail.com`
   - Password: `Tr@ders84`

3. **Test Workspace User:**
   - Email: `aussiepowers555@gmail.com`
   - Password: `abc123`

## Environment Variables Checklist

Required for production:
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `JWT_SECRET` - Secure random string for auth
- ✅ `NEXT_PUBLIC_BASE_URL` - Your production URL

Optional but recommended:
- ⚠️ `BREVO_API_KEY` - For sending emails
- ⚠️ `BREVO_SENDER_EMAIL` - From email address
- ⚠️ `JOTFORM_API_KEY` - For form integration

## Testing Your Deployment

1. Visit your deployed URL
2. Try logging in with one of the developer accounts
3. Check that cases and data load properly
4. Test creating a new case

## Troubleshooting

### Database Connection Issues
- Ensure your PostgreSQL URL includes `?sslmode=require`
- Check that the database allows connections from Vercel IPs
- Verify environment variables are set in Vercel dashboard

### Tables Not Created
- The app automatically creates tables on first connection
- Check Vercel function logs for any errors
- Tables are created in `src/lib/database.ts:createTables()`

### Data Not Loading
- Initial seed data is added automatically
- Check if `seedInitialData()` ran successfully
- View Vercel function logs for details

## Database Schema

The PostgreSQL database includes these tables:
- `cases` - Main case management
- `contacts` - Contact information
- `workspaces` - Workspace management
- `user_accounts` - User authentication
- `bikes` - Fleet management
- `signature_tokens` - Digital signatures
- `rental_agreements` - Rental documents
- And more...

All tables are created automatically with proper indexes and relationships.