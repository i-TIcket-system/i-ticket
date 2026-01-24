# i-Ticket Deployment Workflow

## Environment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   LOCAL DEV          RENDER STAGING           AWS EC2 PRODUCTION        │
│   ──────────         ──────────────           ──────────────────        │
│   localhost:3000  →  i-ticket-staging    →    i-ticket.et               │
│                      .onrender.com                                       │
│                                                                          │
│   • Code changes     • Test changes           • Live users              │
│   • Feature dev      • Bug verification       • Real transactions       │
│   • Debug            • QA testing             • Production data         │
│                      • Stakeholder preview                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Two-Environment Strategy

### 1. RENDER (Staging/Development)
- **URL**: https://i-ticket-staging.onrender.com
- **Purpose**: Testing, bug fixes, new features, previews
- **Database**: Separate staging database (seeded test data)
- **Payments**: Demo mode only (no real transactions)
- **SMS**: Mock mode (console logging)

### 2. AWS EC2 (Production)
- **URL**: https://i-ticket.et
- **Server**: 54.147.33.168
- **Purpose**: Live platform for real users
- **Database**: Production PostgreSQL
- **Payments**: Real TeleBirr integration (when ready)
- **SMS**: Real SMS gateway

---

## Workflow Steps

### Step 1: Develop Locally
```bash
npm run dev
# Make changes, test locally
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-branch
```

### Step 3: Deploy to Render (Automatic)
- Render auto-deploys on push to main branch
- Or manually trigger deploy from Render dashboard
- Test thoroughly on staging URL

### Step 4: QA on Staging
- Test all features on https://i-ticket-staging.onrender.com
- Verify bug fixes work
- Get stakeholder approval if needed

### Step 5: Deploy to Production (AWS EC2)
```bash
# SSH to production server
ssh -i mela-shared-key.pem ubuntu@54.147.33.168

# Pull latest changes
cd /var/www/i-ticket
git pull origin main

# Install any new dependencies
npm ci

# Run migrations if any
npx prisma migrate deploy

# Rebuild
npm run build

# Restart app
pm2 restart i-ticket

# Verify
pm2 logs i-ticket --lines 20
```

---

## Render Setup Instructions

### Option A: One-Click Deploy (Recommended)
1. Go to https://render.com
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Select the repo containing `render.yaml`
5. Click "Apply" - Render creates everything automatically

### Option B: Manual Setup
1. Go to https://render.com → Dashboard
2. Create PostgreSQL database:
   - Name: `iticket-staging-db`
   - Plan: Free
   - Region: Frankfurt
3. Create Web Service:
   - Connect GitHub repo
   - Build Command: `npm ci && npx prisma generate && npm run build`
   - Start Command: `npm start`
   - Add environment variables (see render.yaml)

### Environment Variables for Render
```env
NODE_ENV=production
DATABASE_URL=[Auto from Render DB]
NEXTAUTH_URL=https://i-ticket-staging.onrender.com
NEXTAUTH_SECRET=[Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"]
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true
SMS_MOCK=true
CRON_SECRET=[Generate: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"]
TELEBIRR_APP_ID=demo
TELEBIRR_APP_KEY=demo
```

---

## Database Seeding on Render

After first deployment, seed the staging database:

1. Go to Render Dashboard → Your Web Service → Shell
2. Run:
```bash
npm run seed
```

This creates:
- 5 bus companies (Selam Bus, Sky Bus, etc.)
- 15 test users
- Sample trips
- Super Admin: 0911223344 / demo123

---

## Render Free Tier Limitations

| Resource | Free Tier | Paid Starter |
|----------|-----------|--------------|
| Web Service | 750 hours/month | Unlimited |
| Database | 256 MB | 1 GB |
| RAM | 512 MB | 512 MB - 2 GB |
| Sleep | After 15 min idle | Always on |
| Custom Domain | ✓ | ✓ |

**Note**: Free tier sleeps after 15 minutes of inactivity. First request after sleep takes ~30 seconds to wake up.

---

## When to Deploy to Production

**DO deploy when**:
- ✅ All tests pass on staging
- ✅ Bug is verified fixed
- ✅ Feature works as expected
- ✅ No console errors
- ✅ Stakeholder approved (if applicable)

**DON'T deploy when**:
- ❌ Untested changes
- ❌ Known bugs exist
- ❌ During peak hours (prefer early morning or weekend)
- ❌ Without database backup

---

## Quick Reference Commands

### Local Development
```bash
npm run dev                    # Start dev server
npm run build                  # Test production build
npm run lint                   # Check code quality
```

### Render Staging
```bash
# Trigger manual deploy from Render dashboard
# Or push to main branch for auto-deploy
```

### AWS EC2 Production
```bash
ssh -i mela-shared-key.pem ubuntu@54.147.33.168
cd /var/www/i-ticket
git pull origin main
npm ci
npx prisma migrate deploy
npm run build
pm2 restart i-ticket
pm2 logs i-ticket
```

### Monitoring
```bash
# Production
pm2 status                     # Check app status
pm2 logs i-ticket              # View logs
i-ticket-dashboard             # Monitoring dashboard

# Render
# Use Render dashboard for logs and metrics
```

---

## Support Contacts

- **Render Issues**: https://render.com/docs
- **AWS Issues**: AWS Support Console
- **App Issues**: Check logs first, then escalate

---

**Last Updated**: January 24, 2026
**Version**: 1.0
