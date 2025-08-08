# Deployment Checklist

## Pre-deployment Steps

### 1. Environment Variables
Create `.env.production` with:
```
NODE_ENV=production
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB?sslmode=require
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://yourdomain.com
```

### 2. Database Initialization
Ensure the database initializes on first run:
- [ ] Database creation works in production
- [ ] Initial data seeding works
- [ ] User accounts can be created

### 3. Build Test
```bash
npm run build
npm start
```
- [ ] Build completes without errors
- [ ] App starts correctly
- [ ] Database operations work
- [ ] Login functionality works

### 4. Database Configuration
Ensure Neon Postgres is reachable and `DATABASE_URL` is correct.

### 5. Production Scripts
Add to `package.json`:
```json
{
  "scripts": {
    "start": "next start -p $PORT",
    "start:prod": "NODE_ENV=production next start"
  }
}
```

## Deployment Options

### Recommended: DigitalOcean Droplet
1. Create Ubuntu 22.04 droplet ($5/month)
2. Install Node.js 18+
3. Setup PM2 for process management
4. Configure Nginx as reverse proxy
5. Setup SSL with Let's Encrypt

### Quick Deploy: Railway
1. Connect GitHub repo
2. Set environment variables
3. Deploy with one click

### Alternative: Render
1. Connect GitHub repo
2. Set build/start commands
3. Set `DATABASE_URL` environment variable

## Post-deployment

### 1. Health Checks
- [ ] App loads correctly
- [ ] Database operations work
- [ ] Login/authentication works
- [ ] Case creation works
- [ ] Fleet management works
- [ ] File uploads work

### 2. Backup Strategy
Use Neon backups/branching or schedule `pg_dump`.

### 3. Monitoring
- Set up uptime monitoring
- Monitor disk space (SQLite grows over time)
- Monitor memory usage

## Troubleshooting

### Common Issues
1. **Database locked**: Ensure proper file permissions
2. **Module not found**: Run `npm install` on server
3. **Port conflicts**: Use environment variable PORT
4. **File uploads fail**: Check storage permissions

### Database Issues
```bash
# Check DATABASE_URL variable
echo $DATABASE_URL

# Test Postgres connection (if psql available)
psql "$DATABASE_URL" -c "\dt"
```