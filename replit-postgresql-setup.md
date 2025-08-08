# PostgreSQL Setup for Replit Deployment

## Step 1: Enable PostgreSQL in Replit

1. In your Replit project, go to the **Database** tab (on the left sidebar)
2. Click **Enable PostgreSQL**
3. Copy the connection string that Replit provides

## Step 2: Update Environment Variables

Create or update these environment variables in Replit:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database_name
NODE_ENV=production
PORT=3000

# Application Configuration
NEXT_PUBLIC_BASE_URL=https://your-repl-name.your-username.repl.co
NEXT_PUBLIC_APP_NAME=PBikeRescue Rails

# JWT Secret for authentication
JWT_SECRET=your-secure-secret-key-for-production

# API Keys (Replace with actual keys)
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=PBikeRescue

# JotForm Integration (Optional)
JOTFORM_API_KEY=your_jotform_api_key
JOTFORM_BASE_URL=https://api.jotform.com

# Google Drive Integration (Optional)
GOOGLE_DRIVE_CLIENT_ID=your_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REDIRECT_URI=your_redirect_uri
GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token

# Email Configuration
EMAIL_FROM=noreply@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com
```

## Step 3: Verify Database Connection

The app will automatically:
1. Detect PostgreSQL connection via DATABASE_URL
2. Initialize PostgreSQL connection pool
3. Create all required tables and indexes
4. Seed initial data (contacts, workspaces, users, sample cases)

## Step 4: Deploy

1. The app will build and start automatically
2. Database initialization happens on first startup
3. Check console logs for successful database connection

## Database Schema

The PostgreSQL schema includes:
- `cases` - Main case management table
- `contacts` - Lawyers, rental companies, etc.
- `workspaces` - Client portal organization
- `user_accounts` - Authentication and access control
- `bikes` - Fleet management
- `signature_tokens` - Digital document signing
- `digital_signatures` - Signature capture
- `rental_agreements` - Generated agreements
- `case_interactions` - Communication logs
- `signed_documents` - Document storage metadata

## Troubleshooting

If you encounter issues:
1. Check that PostgreSQL is enabled in Replit
2. Verify DATABASE_URL is correctly set
3. Check console logs for connection errors
4. Ensure all required environment variables are set