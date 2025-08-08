# 🚀 Replit Deployment Guide

## Quick Setup

1. **Import to Replit:**
   - Go to https://replit.com
   - Click "Create Repl" → "Import from GitHub"
   - Use repository URL: `https://github.com/AussiePowers555/wpsqliterailway.git`

2. **Configure Environment Variables:**
   Add these as **Secrets** in your Replit project:
   
   ```bash
   NODE_ENV=production
   DEV_MODE=false
   DISABLE_EMAIL_SENDING=true
   NEXTAUTH_SECRET=generate_secure_random_string_here
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB?sslmode=require
   ```

3. **Optional API Keys (for full functionality):**
   ```bash
   BREVO_API_KEY=your_brevo_api_key
   BREVO_SENDER_EMAIL=your_email@example.com
   BREVO_SENDER_NAME=PBikeRescue
   JOTFORM_API_KEY=your_jotform_api_key
   ```

## Automatic Configuration

The project includes:
- ✅ `.replit` - Main configuration file
- ✅ `replit.nix` - Dependencies and environment
- ✅ `.env.replit` - Environment template

## Default Login Credentials

- **Email**: `whitepointer2016@gmail.com`
- **Password**: `Tr@ders84`

## Features Available

✅ **Working Features:**
- User Authentication (SQLite)
- Case Management
- Bike Fleet Management
- Document Management
- Database Seeding

⚠️ **Requires API Keys:**
- Email notifications (Brevo)
- Form submissions (JotForm)

## Port Configuration

Replit automatically handles port configuration:
- Development: Uses PORT environment variable
- Production: Served on standard web port

## Database

- **Type**: Postgres (Neon)
- **Location**: `/home/runner/[repl-name]/data/pbike-rescue.db`
- **Auto-seeding**: Creates test data on first run

## Run Commands

```bash
# Development
npm run dev

# Production (automatic in Replit)
npm run start

# Build
npm run build
```

## Troubleshooting

### Database Issues
- Database auto-creates on first run
- Check console for database path confirmation
- Ensure `data/` directory has write permissions

### Port Issues
- Replit handles port mapping automatically
- App runs on port 3000 internally

### Build Issues
- Run `npm install` if dependencies are missing
- Check Node.js version (should be 20.x)

## Security Notes

🔒 **Important**: 
- Change `NEXTAUTH_SECRET` to a secure random string
- Don't commit API keys to the repository
- Use Replit's Secrets feature for sensitive data

## Support

For issues:
1. Check Replit console logs
2. Verify environment variables are set
3. Ensure all dependencies are installed

---

**Ready to Deploy!** 🚀 Your motorbike rental management system is configured for Replit.