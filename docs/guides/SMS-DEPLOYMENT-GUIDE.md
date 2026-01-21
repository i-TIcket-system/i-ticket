# SMS Bot Deployment Guide - i-Ticket Platform

Complete guide to deploying the SMS booking bot for production use in Ethiopia.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: SMS Gateway Setup](#step-1-sms-gateway-setup)
- [Step 2: TeleBirr Merchant Account](#step-2-telebirr-merchant-account)
- [Step 3: Environment Configuration](#step-3-environment-configuration)
- [Step 4: Database Migration](#step-4-database-migration)
- [Step 5: Deploy Application](#step-5-deploy-application)
- [Step 6: Configure Webhooks](#step-6-configure-webhooks)
- [Step 7: Testing](#step-7-testing)
- [Step 8: Monitoring](#step-8-monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- ✅ SMS gateway account (Negarit or GeezSMS)
- ✅ TeleBirr merchant account
- ✅ Domain name with HTTPS (for webhooks)
- ✅ Hosting platform (Vercel, AWS, or VPS)

### Technical Requirements
- Node.js 18+ installed
- PostgreSQL database (production instance)
- Git for version control
- Basic command line knowledge

### Estimated Setup Time
- SMS Gateway: 1-2 days (account approval)
- TeleBirr Merchant: 3-5 days (merchant verification)
- Technical Setup: 2-4 hours
- **Total: ~1 week**

---

## Step 1: SMS Gateway Setup

### Option A: Negarit SMS (Recommended)

**1.1 Sign Up**
- Visit: https://www.negarit.net
- Create business account
- Submit business registration documents
- Wait for approval (1-2 days)

**1.2 Get Credentials**
After approval, you'll receive:
- API Key
- API Secret
- Shortcode (e.g., 9999)
- API URL (e.g., https://api.negarit.com/v1/sms/send)

**1.3 Configure Webhook**
In Negarit dashboard:
1. Navigate to "Webhooks" or "Callbacks"
2. Set incoming SMS webhook URL:
   ```
   https://your-domain.com/api/sms/incoming
   ```
3. Choose webhook format: JSON
4. Save configuration

**1.4 Test Sandbox**
```bash
# Test sending SMS
curl -X POST https://api.negarit.com/v1/sms/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0912345678",
    "from": "9999",
    "message": "Test from i-Ticket"
  }'
```

### Option B: GeezSMS

**1.1 Sign Up**
- Visit: https://geezsms.com
- Create account
- Complete KYC verification

**1.2 Get Credentials**
- API Key
- Sender ID
- API URL

**1.3 Pricing**
Contact GeezSMS for Ethiopian market pricing:
- Typically: 0.30-0.50 ETB per outbound SMS
- Inbound SMS: Usually included or 0.10-0.20 ETB

---

## Step 2: TeleBirr Merchant Account

### 2.1 Application Process

**Required Documents:**
- Business license (የንግድ ፈቃድ)
- TIN (Tax Identification Number)
- Business bank account
- Owner's ID
- Company registration certificate

**How to Apply:**
1. Visit Ethio Telecom office or TeleBirr partner bank
2. Submit merchant application form
3. Provide required documents
4. Wait for approval (3-5 business days)

**Alternative:** Contact TeleBirr business support:
- Email: business@telebirr.et (if available)
- Phone: 127 (TeleBirr customer service)

### 2.2 Get API Credentials

After approval, you'll receive:
- **App ID** (Merchant identifier)
- **App Key** (Secret key for signing)
- **Public Key** (For signature verification)
- **Merchant Code** (e.g., ITICKET001)

### 2.3 Configure Callback URL

In TeleBirr merchant dashboard:
1. Set payment notification URL:
   ```
   https://your-domain.com/api/payments/telebirr/callback
   ```
2. Choose callback format: JSON
3. Enable merchant-initiated payments (push payments)

### 2.4 Test Sandbox

TeleBirr provides a sandbox environment:
```bash
# Test payment initiation
curl -X POST https://sandbox.telebirr.et/v1/payment/request \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "YOUR_APP_ID",
    "phone": "0912345678",
    "amount": "100.00",
    "outTradeNo": "TEST_001",
    "notifyUrl": "https://your-domain.com/api/payments/telebirr/callback"
  }'
```

---

## Step 3: Environment Configuration

### 3.1 Create Production .env

Copy `.env.sms.example` to `.env.production`:

```bash
cp .env.sms.example .env.production
```

### 3.2 Fill in Credentials

Edit `.env.production`:

```env
# ===== Database =====
DATABASE_URL=postgresql://user:password@host:5432/iticket

# ===== NextAuth =====
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_nextauth_secret_here

# ===== SMS Gateway (Negarit/GeezSMS) =====
SMS_GATEWAY_URL=https://api.negarit.com/v1/sms/send
SMS_GATEWAY_API_KEY=nrg_live_abc123...
SMS_GATEWAY_SHORTCODE=9999
SMS_WEBHOOK_SECRET=randomly_generated_webhook_secret_here

# ===== TeleBirr Payment =====
TELEBIRR_APP_ID=iticket_12345
TELEBIRR_APP_KEY=sk_live_abc123...
TELEBIRR_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----
TELEBIRR_API_URL=https://api.telebirr.com/v1
TELEBIRR_NOTIFY_URL=https://your-domain.com/api/payments/telebirr/callback
TELEBIRR_MERCHANT_CODE=ITICKET001

# ===== Feature Flags =====
DEMO_MODE=false
SMS_BOT_ENABLED=true

# ===== Cron Job Security =====
CRON_SECRET=randomly_generated_cron_secret_here
```

### 3.3 Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate SMS_WEBHOOK_SECRET
openssl rand -hex 32

# Generate CRON_SECRET
openssl rand -hex 32
```

### 3.4 Verify Configuration

Create `scripts/verify-config.js`:

```javascript
// Verify all required environment variables are set
const required = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'SMS_GATEWAY_URL',
  'SMS_GATEWAY_API_KEY',
  'TELEBIRR_APP_ID',
  'TELEBIRR_APP_KEY'
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing environment variables:', missing);
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

Run with:
```bash
node scripts/verify-config.js
```

---

## Step 4: Database Migration

### 4.1 Backup Current Database

```bash
# Backup before migration
pg_dump -h localhost -U iticket -d iticket > backup_before_sms.sql
```

### 4.2 Run Migration

**Option A: Using Prisma Migrate (Recommended)**
```bash
# Generate migration
npx prisma migrate dev --name add_sms_support

# Apply to production database
npx prisma migrate deploy
```

**Option B: Using DB Push (Development)**
```bash
# Sync schema directly (no migration files)
npx prisma db push
```

### 4.3 Verify Schema

```bash
# Check if SmsSession table exists
psql -U iticket -d iticket -c "\d SmsSession"

# Check User table modifications
psql -U iticket -d iticket -c "\d User"
```

Expected output:
```
Table "public.SmsSession"
Column       | Type      | Nullable
-------------+-----------+---------
id           | text      | not null
phone        | text      | not null
sessionId    | text      | not null
state        | text      | not null
language     | text      | not null
...
```

---

## Step 5: Deploy Application

### Option A: Vercel (Recommended - Easiest)

**5.1 Install Vercel CLI**
```bash
npm i -g vercel
```

**5.2 Login**
```bash
vercel login
```

**5.3 Deploy**
```bash
# First deployment
vercel

# Production deployment
vercel --prod
```

**5.4 Set Environment Variables**
```bash
# Set each variable in Vercel dashboard or via CLI
vercel env add SMS_GATEWAY_URL
vercel env add SMS_GATEWAY_API_KEY
vercel env add TELEBIRR_APP_ID
# ... etc for all variables
```

**5.5 Configure Cron Job**

Create `vercel.json` in project root:

```json
{
  "crons": [{
    "path": "/api/cron/cleanup",
    "schedule": "*/15 * * * *"
  }]
}
```

Redeploy:
```bash
vercel --prod
```

### Option B: AWS EC2 / VPS

**5.1 Server Setup**
```bash
# SSH into server
ssh user@your-server-ip

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2
```

**5.2 Deploy Code**
```bash
# Clone repository
git clone https://github.com/your-repo/i-ticket.git
cd i-ticket

# Install dependencies
npm install

# Build application
npm run build
```

**5.3 Configure Environment**
```bash
# Copy environment file
cp .env.production .env

# Edit with production values
nano .env
```

**5.4 Start Application**
```bash
# Start with PM2
pm2 start npm --name "iticket" -- start

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

**5.5 Configure Nginx (Reverse Proxy)**
```nginx
# /etc/nginx/sites-available/iticket
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**5.6 Set Up SSL (Let's Encrypt)**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**5.7 Configure Cron Job**
```bash
# Edit crontab
crontab -e

# Add line (runs every 15 minutes)
*/15 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/cleanup
```

---

## Step 6: Configure Webhooks

### 6.1 SMS Gateway Webhook

**Negarit Dashboard:**
1. Login to https://negarit.com/dashboard
2. Navigate to Settings → Webhooks
3. Add webhook:
   - URL: `https://your-domain.com/api/sms/incoming`
   - Method: POST
   - Format: JSON
4. Test webhook (send test SMS)

### 6.2 TeleBirr Payment Webhook

**TeleBirr Merchant Portal:**
1. Login to merchant dashboard
2. Navigate to API Settings → Callbacks
3. Set notification URL:
   ```
   https://your-domain.com/api/payments/telebirr/callback
   ```
4. Save configuration
5. Test with sandbox payment

### 6.3 Verify Webhook Security

**Test webhook authentication:**
```bash
# This should fail (no signature)
curl -X POST https://your-domain.com/api/sms/incoming \
  -H "Content-Type: application/json" \
  -d '{"from":"0912345678","message":"test"}'

# Response should indicate signature verification
```

---

## Step 7: Testing

### 7.1 Pre-Launch Testing Checklist

**SMS Gateway Tests:**
- [ ] Send test SMS to verify shortcode works
- [ ] Verify incoming SMS triggers webhook
- [ ] Check webhook receives correct payload
- [ ] Verify SMS delivery confirmations

**SMS Bot Tests:**
- [ ] HELP command returns command list
- [ ] BOOK command searches trips
- [ ] Trip selection works
- [ ] Passenger data collection flows correctly
- [ ] Booking confirmation creates booking
- [ ] CHECK command verifies tickets

**TeleBirr Payment Tests:**
- [ ] Payment initiation sends MMI popup
- [ ] User can approve payment via popup
- [ ] Callback webhook receives confirmation
- [ ] Booking status updates to PAID
- [ ] Tickets generate automatically
- [ ] Ticket SMS sends successfully

**Bilingual Tests:**
- [ ] Amharic commands work (መጽሐፍ, ማረጋገጫ, etc.)
- [ ] Language auto-detection works
- [ ] All responses translate correctly

### 7.2 Test with Real Phone Numbers

**Phase 1: Internal Testing (You + Team)**
```
1. Book ticket via SMS using your phone
2. Verify payment popup appears
3. Approve payment
4. Check ticket SMS received
5. Verify ticket with CHECK command
6. Use ticket at bus station (optional)
```

**Phase 2: Beta Testing (10-20 Users)**
```
1. Recruit beta users (friends, family, employees)
2. Give them shortcode (e.g., 9999)
3. Instruct: "Send 'BOOK ADDIS HAWASSA TODAY' to 9999"
4. Monitor for issues
5. Collect feedback
```

**Phase 3: Soft Launch (100 Users)**
```
1. Announce at 1-2 bus stations
2. Poster with shortcode and instructions
3. Monitor for 1 week
4. Fix any issues discovered
```

### 7.3 Load Testing

**Test concurrent users:**
```bash
# Use Apache Bench to simulate 50 concurrent SMS
ab -n 50 -c 10 -p test-payload.json -T application/json \
  https://your-domain.com/api/sms/incoming
```

**Monitor performance:**
- Response time should be < 2 seconds
- Database queries optimized
- No memory leaks over 1000+ messages

---

## Step 8: Monitoring

### 8.1 Application Monitoring

**Vercel Analytics** (if using Vercel):
- Enable in Vercel dashboard
- Monitor API response times
- Track error rates

**Custom Monitoring Dashboard:**

Create `src/app/admin/sms/stats/page.tsx`:

```typescript
// SMS Statistics Dashboard (Super Admin only)
export default async function SmsStatsPage() {
  const stats = await prisma.adminLog.groupBy({
    by: ['action'],
    where: {
      action: { in: ['SMS_RECEIVED', 'SMS_SENT', 'PAYMENT_SUCCESS_SMS'] },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    },
    _count: true
  });

  return (
    <div>
      <h1>SMS Bot Statistics (Last 24 Hours)</h1>
      <ul>
        {stats.map(s => (
          <li key={s.action}>
            {s.action}: {s._count} events
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 8.2 Key Metrics to Track

**Operational Metrics:**
- SMS sent per day
- SMS received per day
- Active sessions
- Session completion rate (%)
- Payment success rate (%)

**Business Metrics:**
- SMS bookings vs web bookings
- Revenue from SMS channel
- Average ticket price (SMS)
- Top routes booked via SMS

**Quality Metrics:**
- Average messages per booking
- Error rate by type
- Payment timeout rate
- User drop-off by state

### 8.3 Logging

**View logs in production:**

**Vercel:**
```bash
vercel logs --follow
```

**PM2 (VPS):**
```bash
pm2 logs iticket --lines 100
```

**Filter for SMS events:**
```bash
pm2 logs iticket | grep "SMS"
```

### 8.4 Alerts

**Set up alerts for:**
- SMS gateway failures (no messages in 1 hour)
- Payment callback failures (>10% rate)
- Database connection errors
- High error rate (>5%)

**Using Vercel:**
- Configure webhook alerts in Vercel dashboard

**Using Custom Solution:**
- Email alerts via SendGrid/AWS SES
- SMS alerts for critical issues
- Slack/Discord webhooks

---

## Troubleshooting

### Issue 1: SMS Not Sending

**Symptoms:**
- Webhook receives messages
- Bot processes correctly
- No SMS sent to user

**Solutions:**
1. Check SMS gateway credentials:
   ```bash
   echo $SMS_GATEWAY_API_KEY
   ```
2. Verify account balance (if prepaid)
3. Check server logs for gateway errors:
   ```bash
   grep "SMS Gateway" logs.txt
   ```
4. Test gateway directly (bypass bot):
   ```bash
   curl -X POST $SMS_GATEWAY_URL \
     -H "Authorization: Bearer $SMS_GATEWAY_API_KEY" \
     -d '{"to":"YOUR_PHONE","message":"Test"}'
   ```

### Issue 2: Payment Not Initiating

**Symptoms:**
- Booking created
- No payment popup on phone

**Solutions:**
1. Verify TeleBirr credentials
2. Check phone number format (must be 09XXXXXXXX)
3. Check TeleBirr account balance
4. Review TeleBirr API logs
5. Verify callback URL is whitelisted

### Issue 3: Webhook Not Receiving SMS

**Symptoms:**
- User sends SMS
- No response from bot

**Solutions:**
1. Verify webhook URL in SMS gateway dashboard
2. Check if URL is accessible:
   ```bash
   curl https://your-domain.com/api/sms/incoming
   # Should return: {"status":"OK"}
   ```
3. Check webhook IP whitelist (if configured)
4. Review SMS gateway dashboard for delivery status
5. Check server logs for incoming requests

### Issue 4: Session Timeout Too Fast

**Symptoms:**
- Users report "session expired" frequently
- Can't complete booking

**Solutions:**
1. Increase timeout in `src/lib/sms/session.ts`:
   ```typescript
   const SESSION_TIMEOUT_MINUTES = 30; // Increase from 15
   ```
2. Reduce number of required inputs
3. Combine steps (e.g., ask "Name and ID" in one message)

### Issue 5: Language Detection Wrong

**Symptoms:**
- User sends Amharic, gets English response

**Solutions:**
1. Check `detectLanguage()` function
2. Add more Amharic keywords to detection
3. Allow manual language selection:
   ```
   User: EN
   Bot: Language set to English
   ```

### Issue 6: Payment Timeout

**Symptoms:**
- Payment initiated
- User doesn't receive popup
- Booking auto-cancelled

**Solutions:**
1. Check user's TeleBirr account status
2. Verify phone number is registered with TeleBirr
3. Increase timeout from 5 to 10 minutes
4. Add reminder SMS at 3 minutes:
   ```
   "Payment pending. Check phone for popup. 2 min left."
   ```

### Issue 7: Duplicate Bookings

**Symptoms:**
- Same user creates multiple bookings

**Solutions:**
1. Check rate limiting is enabled
2. Add duplicate detection:
   ```typescript
   // Check for recent booking on same trip
   const recentBooking = await prisma.booking.findFirst({
     where: {
       userId,
       tripId,
       createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
     }
   });

   if (recentBooking) {
     return "You already booked this trip 5 min ago. Reply STATUS to check.";
   }
   ```

---

## Production Launch Checklist

### Pre-Launch (1 Week Before)

- [ ] All environment variables configured
- [ ] Database migrated successfully
- [ ] SMS gateway account active with sufficient balance
- [ ] TeleBirr merchant account approved
- [ ] Webhooks configured and tested
- [ ] SSL certificate installed (HTTPS)
- [ ] Cron job configured (session cleanup)
- [ ] Monitoring dashboard set up
- [ ] Error tracking configured (Sentry/LogRocket)
- [ ] Backup strategy in place

### Launch Day

- [ ] Deploy to production
- [ ] Verify all endpoints responding
- [ ] Send test SMS from personal phone
- [ ] Complete test booking end-to-end
- [ ] Verify payment works
- [ ] Check ticket generation
- [ ] Monitor logs for 1 hour
- [ ] Announce to users (soft launch)

### Post-Launch (First Week)

- [ ] Monitor daily for errors
- [ ] Check SMS costs vs budget
- [ ] Review user feedback
- [ ] Fix any critical bugs
- [ ] Document any issues found
- [ ] Optimize based on usage patterns

### Post-Launch (First Month)

- [ ] Analyze booking conversion rates
- [ ] Review payment success rates
- [ ] Calculate actual ROI
- [ ] Plan feature enhancements
- [ ] Consider scaling infrastructure

---

## Cost Management

### SMS Costs

**Negarit Pricing (Estimated):**
- Setup fee: 5,000 - 10,000 ETB (one-time)
- Shortcode rental: 5,000 ETB/month
- Outbound SMS: 0.50 ETB per message
- Inbound SMS: Free or 0.10 ETB per message

**Monthly Cost Projection:**

| Bookings/Month | SMS Count | SMS Cost | Shortcode | Total |
|----------------|-----------|----------|-----------|-------|
| 100 | 800 | 400 ETB | 5,000 ETB | 5,400 ETB |
| 500 | 4,000 | 2,000 ETB | 5,000 ETB | 7,000 ETB |
| 1,000 | 8,000 | 4,000 ETB | 5,000 ETB | 9,000 ETB |
| 5,000 | 40,000 | 20,000 ETB | 5,000 ETB | 25,000 ETB |

### TeleBirr Fees

- Transaction fee: 1% (minimum 5 ETB)
- No monthly fees for API access
- 1,000 transactions = ~5,000 ETB in fees

### Total Monthly Operating Cost

**For 1,000 bookings/month:**
- SMS: 9,000 ETB
- TeleBirr: 5,000 ETB
- Hosting (Vercel): $20 = ~700 ETB
- **Total: ~14,700 ETB (~$105 USD)**

**Revenue (5% commission):**
- 1,000 bookings × 350 ETB avg ticket × 5% = 17,500 ETB
- **Net profit: 2,800 ETB/month (~$20)**
- **Margin: 16%**

**Break-even:** ~800 bookings/month

---

## Scaling Considerations

### When You Hit 5,000 Bookings/Month

**1. Upgrade Database:**
- Increase PostgreSQL instance size
- Add read replicas
- Enable connection pooling

**2. Add Redis for Sessions:**
```bash
# Install Redis
npm install ioredis

# Configure in src/lib/sms/session.ts
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
```

**3. Load Balancing:**
- Use Vercel Pro (auto-scaling)
- Or deploy multiple EC2 instances behind ALB

**4. SMS Gateway Redundancy:**
- Configure fallback provider
- Automatic failover on gateway errors

---

## Security Best Practices

### 1. Rate Limiting

Already implemented in `src/app/api/sms/incoming/route.ts`:
- 10 messages per minute per phone
- Prevents spam

**Add IP-based rate limiting:**
```bash
# Vercel: Enable Edge Config rate limiting
# VPS: Use nginx rate limiting
limit_req_zone $binary_remote_addr zone=sms:10m rate=30r/m;
```

### 2. Input Validation

All inputs sanitized in bot:
- Phone numbers validated (Ethiopian format)
- Message content sanitized (remove special chars)
- SQL injection prevented (Prisma ORM)

### 3. Webhook Security

**SMS Webhook:**
- IP whitelist (SMS gateway IPs only)
- Signature verification enabled
- HTTPS required

**TeleBirr Callback:**
- Signature verification (HMAC-SHA256)
- TLS 1.2+ required
- Validate transaction IDs

### 4. Data Privacy

**User Data:**
- Store minimal data (phone, name, ID)
- National ID for record-keeping only
- Auto-delete guest users after 90 days:
  ```sql
  DELETE FROM "User"
  WHERE "isGuestUser" = true
  AND "createdAt" < NOW() - INTERVAL '90 days'
  AND id NOT IN (SELECT "userId" FROM "Booking" WHERE "createdAt" > NOW() - INTERVAL '90 days');
  ```

---

## Maintenance

### Daily Tasks
- Review error logs
- Check SMS delivery rate
- Monitor payment success rate
- Verify cron job ran successfully

### Weekly Tasks
- Analyze booking trends
- Review user feedback
- Check infrastructure costs
- Plan feature improvements

### Monthly Tasks
- Database backup verification
- Security audit
- Cost analysis
- Performance optimization
- Update documentation

---

## User Communication

### Launch Announcement

**SMS to existing users:**
```
🚌 NEW! Book i-Ticket via SMS!

No smartphone needed.
Send: BOOK ADDIS HAWASSA JAN15
To: 9999

Quick, easy, instant tickets!
```

**Posters at bus stations:**
```
┌─────────────────────────────────┐
│   BOOK VIA SMS - NO APP NEEDED!  │
│                                   │
│   📱 Send message to: 9999       │
│                                   │
│   Example:                        │
│   BOOK ADDIS HAWASSA JAN15       │
│                                   │
│   ✅ Instant booking              │
│   ✅ TeleBirr payment             │
│   ✅ Ticket via SMS               │
│                                   │
│   [QR code to user guide]         │
└─────────────────────────────────┘
```

### User Guide Flyer

**English Version:**
```
i-TICKET SMS BOOKING GUIDE

1. SEARCH TRIPS
   Send: BOOK [FROM] [TO] [DATE]
   Example: BOOK ADDIS HAWASSA JAN15

2. SELECT TRIP
   Reply with trip number (1, 2, 3, etc.)

3. ENTER DETAILS
   - How many passengers?
   - Passenger names
   - ID numbers

4. CONFIRM
   Reply: YES

5. PAY
   Check phone for payment popup
   Enter TeleBirr password

6. RECEIVE TICKET
   You'll get ticket code via SMS
   Show code to conductor at bus

OTHER COMMANDS:
- CHECK [code] - Verify ticket
- HELP - Show commands

Questions? Call 0911234567
```

**Amharic Version:**
```
የአይ-ቲኬት ኤስኤምኤስ የቦታ ማስያዣ መመሪያ

1. ጉዞ ፈልግ
   መልእክት: መጽሐፍ [ከ] [ወደ] [ቀን]
   ምሳሌ: መጽሐፍ አዲስ ሀዋሳ ጃን15

2. ጉዞ ምረጥ
   የጉዞ ቁጥር ይላኩ (1, 2, 3, ...)

3. መረጃ ያስገቡ
   - ስንት ተሳፋሪዎች?
   - ስሞች
   - መታወቂያ ቁጥሮች

4. ያረጋግጡ
   አዎ ይላኩ

5. ይክፈሉ
   የክፍያ ፖፕ አፕ ይመጣል
   የቴሌብር የይለፍ ቃል ያስገቡ

6. ትኬት ይቀበሉ
   ትኬት ኮድ በኤስኤምኤስ
   ኮድ ለመንገዳው ያሳዩ

ሌሎች ትዕዛዞች:
- ማረጋገጫ [ኮድ] - ትኬት መመርመር
- እርዳታ - ትዕዛዞች

ጥያቄ? ይደውሉ 0911234567
```

---

## Support Plan

### Tier 1: Automated (SMS Bot)
- HELP command
- CHECK command
- STATUS command

### Tier 2: Human Support (Phone)
- Dedicated support line: 0911234567
- Mon-Sun: 6 AM - 10 PM
- Handle complex issues

### Tier 3: Technical Support
- Developer on-call for critical issues
- Response time: < 1 hour
- Fix deployment within 4 hours

### Common User Issues

**"I didn't receive ticket SMS"**
→ Check AdminLog for SMS_SENT record
→ Verify gateway delivery status
→ Resend manually if needed

**"Payment failed but money deducted"**
→ Check TeleBirr transaction status
→ Verify callback received
→ Contact TeleBirr support for reconciliation

**"Ticket code doesn't work"**
→ Verify code in database (typo?)
→ Check booking status is PAID
→ Verify trip date is valid

---

## Rollback Plan

### If Critical Issue Occurs

**Step 1: Disable SMS Bot (5 minutes)**
```bash
# Set environment variable
vercel env add SMS_BOT_ENABLED false
vercel --prod

# Or update .env on VPS and restart
SMS_BOT_ENABLED=false pm2 restart iticket
```

**Step 2: Notify Users (10 minutes)**
```bash
# Send broadcast SMS to all recent users
SELECT DISTINCT phone FROM "User"
WHERE "isGuestUser" = true
AND "createdAt" > NOW() - INTERVAL '7 days';

# Send to each:
"SMS booking temporarily offline. Please use web: iticket.et"
```

**Step 3: Handle Pending Payments (30 minutes)**
```sql
-- Find pending SMS payments
SELECT * FROM "Payment"
WHERE status = 'PENDING'
AND "initiatedVia" = 'SMS'
AND "createdAt" > NOW() - INTERVAL '1 hour';

-- Contact users directly to complete payment or refund
```

**Step 4: Fix Issue (varies)**
- Deploy fix to staging
- Test thoroughly
- Deploy to production

**Step 5: Re-enable (5 minutes)**
```bash
SMS_BOT_ENABLED=true
vercel --prod
```

**Step 6: Monitor (2 hours)**
- Watch for errors
- Verify fix works
- Communicate with users

---

## Success Criteria

### Week 1
- ✅ 50+ SMS bookings
- ✅ 0 critical errors
- ✅ 80%+ conversion rate (search → booking)
- ✅ 90%+ payment success rate

### Month 1
- ✅ 500+ SMS bookings
- ✅ 20%+ of total bookings via SMS
- ✅ <2% error rate
- ✅ Positive user feedback

### Month 3
- ✅ 2,000+ SMS bookings
- ✅ 40%+ of bookings via SMS
- ✅ Profitable (revenue > costs)
- ✅ Feature requests prioritized

---

## Next Steps After Launch

### Immediate Enhancements (Month 1-2)
1. **Trip reminders:** Send SMS 1 day before departure
2. **Booking modifications:** Cancel/reschedule via SMS
3. **Multi-language:** Add Oromo support
4. **Voice fallback:** IVR for illiterate users

### Future Features (Month 3-6)
1. **USSD menu:** Interactive menu vs text-only
2. **WhatsApp bot:** Same logic, richer media
3. **Loyalty program:** "Book 5 trips, get 1 free"
4. **Group booking:** "Share code for 10% off"

### Scale Preparation (Month 6-12)
1. **Redis caching:** Faster session management
2. **CDN:** Faster API responses
3. **Database optimization:** Sharding for high volume
4. **Regional expansion:** Support more cities/routes

---

## Support Resources

### Documentation
- This deployment guide
- API documentation: `/docs/api.md`
- User guide: Distributed at bus stations
- Developer docs: `/docs/sms-bot.md`

### Contacts
- SMS Gateway Support: support@negarit.net
- TeleBirr Support: 127 or business@telebirr.et
- i-Ticket Technical: your-dev-email@domain.com

### Community
- GitHub Issues: For bug reports
- WhatsApp Group: For beta testers
- Email Support: support@iticket.et

---

## Appendix

### A. Environment Variables Reference

Complete list of all SMS-related environment variables:

```env
# SMS Gateway
SMS_GATEWAY_URL           # Required. API endpoint for sending SMS
SMS_GATEWAY_API_KEY       # Required. Authentication key
SMS_GATEWAY_SHORTCODE     # Required. Your shortcode (e.g., 9999)
SMS_WEBHOOK_SECRET        # Optional. For webhook signature verification

# TeleBirr
TELEBIRR_APP_ID           # Required. Merchant app ID
TELEBIRR_APP_KEY          # Required. Secret key for signing
TELEBIRR_PUBLIC_KEY       # Required. For callback verification
TELEBIRR_API_URL          # Required. TeleBirr API base URL
TELEBIRR_NOTIFY_URL       # Required. Your callback URL
TELEBIRR_MERCHANT_CODE    # Required. Your merchant code

# Feature Flags
DEMO_MODE                 # Optional. Set to "true" for testing
SMS_BOT_ENABLED           # Optional. Set to "false" to disable

# Cron
CRON_SECRET               # Optional. Protect cron endpoints
```

### B. Database Indexes

Ensure these indexes exist for optimal performance:

```sql
CREATE INDEX idx_sms_session_phone ON "SmsSession"(phone);
CREATE INDEX idx_sms_session_expires ON "SmsSession"("expiresAt");
CREATE INDEX idx_payment_status_via ON "Payment"(status, "initiatedVia");
CREATE INDEX idx_user_guest ON "User"("isGuestUser", "createdAt");
```

### C. Monitoring Queries

**Active sessions:**
```sql
SELECT COUNT(*) FROM "SmsSession"
WHERE "expiresAt" > NOW();
```

**SMS bookings today:**
```sql
SELECT COUNT(*) FROM "Booking" b
JOIN "Payment" p ON p."bookingId" = b.id
WHERE p."initiatedVia" = 'SMS'
AND b."createdAt"::date = CURRENT_DATE;
```

**Payment success rate:**
```sql
SELECT
  COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) * 100.0 / COUNT(*) as success_rate
FROM "Payment"
WHERE "initiatedVia" = 'SMS'
AND "createdAt" > NOW() - INTERVAL '24 hours';
```

---

## Conclusion

This SMS bot brings i-Ticket to **60%+ of Ethiopians** who don't use smartphones. With proper deployment and monitoring, it can become your primary booking channel.

**Remember:**
- Start with demo mode
- Test thoroughly before going live
- Monitor closely in first week
- Iterate based on user feedback

**Questions?** Contact development team or refer to technical documentation.

---

**Built with ❤️ for Ethiopian transportation accessibility**
