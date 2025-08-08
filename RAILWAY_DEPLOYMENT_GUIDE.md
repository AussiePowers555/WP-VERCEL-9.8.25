# Railway Deployment Guide for WP Perfect Score Motorbike Rental

## Prerequisites
- Railway CLI installed and logged in (`railway whoami` should show your account)
- GitHub repository pushed with latest changes
- PostgreSQL-ready application code

## Deployment Steps

### 1. Initialize Railway Project
```bash
railway init
```

**During initialization, choose:**
- **Project Name**: `wp-perfect-score-motorbike-rental`
- **Template**: Empty Project (or deploy from GitHub if available)
- **GitHub Integration**: Connect to `https://github.com/AussiePowers555/WP-Railway_06.08.2025.git`

### 2. Add PostgreSQL Database
```bash
railway add --database postgresql
```

### 3. Set Environment Variables
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-secure-jwt-secret-here
railway variables set NEXT_PUBLIC_BASE_URL=https://your-railway-domain.up.railway.app
```

### 4. Deploy Application
```bash
railway up
```

### 5. Check Deployment Status
```bash
railway status
railway logs
```

### 6. Get Database Connection URL
```bash
railway variables
```

Look for `DATABASE_URL` - this will be automatically set by Railway's PostgreSQL service.

## Configuration Files

### `railway.toml`
Already created with:
- Nixpacks builder configuration
- Production build and start commands
- Environment variables

### Database Auto-Detection
The application automatically detects Railway's PostgreSQL through:
- `DATABASE_URL` environment variable
- Connection pooling optimized for Railway
- SSL configuration for production database

## Post-Deployment Setup

1. **Initialize Database Schema**:
   ```bash
   railway run npm run setup:database
   ```

2. **Verify Database Connection**:
   ```bash
   railway run node scripts/verify-postgresql.js
   ```

3. **Open Application**:
   ```bash
   railway open
   ```

## Custom Domain (Optional)
```bash
railway domain add yourdomain.com
```

## Monitoring
- View logs: `railway logs`
- Check service status: `railway status`
- Access Railway dashboard: `railway open --dashboard`

## Environment Variables Needed
- `DATABASE_URL` (automatically provided by Railway PostgreSQL)
- `JWT_SECRET` (secure random string)
- `NODE_ENV=production`
- `NEXT_PUBLIC_BASE_URL` (your Railway domain)

## Troubleshooting

### Build Issues
- Check `railway logs` for build errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Database Issues
- Check `DATABASE_URL` is properly set
- Verify PostgreSQL service is running
- Run database setup scripts

### Connection Issues
- Check environment variables with `railway variables`
- Verify domain configuration
- Check service health in Railway dashboard