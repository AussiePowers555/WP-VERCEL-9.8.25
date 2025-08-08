# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (runs on port 9015 with Turbopack)
- **Start Cloudflare tunnel**: `cloudflared tunnel --url http://localhost:9015` (manual setup)
- **Update environment with tunnel URL**: `node setup-cloudflare-url.js https://your-url.trycloudflare.com`
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Run linting**: `npm run lint`
- **Run type checking**: `npm run typecheck`
- **Run tests**: Tests use Playwright - configuration in `playwright.config.ts`

## Deployment Process

### Auto-Deploy to Vercel After Bug Fixes
**IMPORTANT**: When fixing bugs, always deploy changes to Vercel automatically:

1. **After fixing bugs and testing locally**:
   ```bash
   git add -A
   git commit -m "fix: [description of bug fix]"
   git push origin master
   vercel --prod
   ```

2. **Vercel Auto-Deployment Workflow**:
   - Fix and test bugs locally
   - Commit changes with descriptive message
   - Push to GitHub repository
   - Deploy to production with `vercel --prod`
   - Vercel will automatically build and deploy the latest changes

3. **Pre-deployment Checklist**:
   - ✅ All TypeScript errors resolved (`npm run typecheck`)
   - ✅ Linting passes (`npm run lint`)
   - ✅ Local testing confirms fix works
   - ✅ Database migrations applied if needed
   - ✅ Environment variables updated in Vercel dashboard if needed

## Testing Environment Setup with Cloudflare Tunnel

This is our testing environment for email signatures and PDF generation from prefilled forms being signed by customers.

### Cloudflare Tunnel Setup for External Testing
1. **Install cloudflared:**
   ```bash
   # Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   # Or use chocolatey: choco install cloudflared
   ```

2. **Start Cloudflare tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:9015
   ```

3. **Update environment variable:**
   - Copy the HTTPS forwarding URL from cloudflared (e.g., `https://abc123.trycloudflare.com`)
   - Update `NEXT_PUBLIC_BASE_URL` in `.env.local` with the tunnel URL
   - Or use the helper script: `node setup-cloudflare-url.js https://abc123.trycloudflare.com`

4. **Restart development server:**
   ```bash
   npm run dev
   ```

### Testing Capabilities with Cloudflare Tunnel
- **Email Signature Testing**: Send emails with form links accessible from any device
- **PDF Generation Testing**: Test PDF generation from prefilled customer forms
- **External Form Access**: Allow customers to access and sign documents from mobile devices
- **JotForm Integration**: Test webhook endpoints with external URLs
- **Cross-device Testing**: Test the application from different devices and networks

### Testing Workflow
1. Start local development server (`npm run dev`)
2. Start Cloudflare tunnel on port 9015 (`cloudflared tunnel --url http://localhost:9015`)
3. Update `.env.local` with tunnel URL (`node setup-cloudflare-url.js https://your-url.trycloudflare.com`)
4. Restart development server to pick up new environment variable
5. Test email links and form submissions from external devices
6. Verify PDF generation and signature workflows

### Important Notes
- Keep cloudflared window open during testing sessions
- Cloudflare tunnel URL changes each restart (free tier limitation)
- All form links in emails will use the tunnel URL for external access

### Auto-Restart Development Server

**CRITICAL**: When testing code updates, the development server must be restarted to pick up environment variable changes:

#### When Auto-Restart is Required:
- After updating `NEXT_PUBLIC_BASE_URL` in `.env.local`
- After running `npm run setup-local-ip`
- After running `node setup-cloudflare-url.js`
- When switching between local/tunnel/network IP testing

#### Auto-Restart Commands:
```bash
# Stop current server (Ctrl+C) then restart:
npm run dev

# Or use auto-restart for .env changes:
npm run dev:auto-restart
```

#### Testing Workflow with Auto-Restart:
1. Make environment changes (IP/URL updates)
2. **ALWAYS restart dev server** - environment variables only load on startup
3. Test email signature links from external devices
4. Verify PDF generation works with new URLs

**Remember**: Next.js only reads environment variables at startup, so restart is mandatory for testing!
- PDF generation and signature processes are tested through the Cloudflare tunnel

## Memory Log

### Deployment and Infrastructure
- I am working to perfect my Vercel deployment to work perfectly with my Neon database
- Currently getting errors when clicking on different menu buttons
- Need to perfect the schema, business logic, functions so this rental bike app works perfectly and is production ready for release without client experiencing any bugs
