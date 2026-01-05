# Security Guidelines - i-Ticket Platform

## Overview

This document outlines security best practices, compliance requirements, and operational guidelines for the i-Ticket bus booking platform.

---

## Environment Variables Security

### Critical Security Rules

1. **NEVER commit `.env` files to git**
   - Already protected in `.gitignore`
   - Use `.env.example` for templates only
   - Each developer generates their own secrets

2. **Generate strong secrets**
   ```bash
   # NEXTAUTH_SECRET (required, 32+ bytes)
   node -e "console.log('NEXTAUTH_SECRET=\"' + require('crypto').randomBytes(32).toString('base64') + '\"')"

   # Database password (16+ characters)
   node -e "console.log('DB_PASSWORD=' + require('crypto').randomBytes(16).toString('hex'))"
   ```

3. **Rotate credentials regularly**
   - Database passwords: Every 90 days minimum
   - API keys: When team members leave or potential exposure
   - NEXTAUTH_SECRET: Every major deployment or security incident

### Required Environment Variables

| Variable | Purpose | Security Level | Validation |
|----------|---------|----------------|------------|
| `DATABASE_URL` | PostgreSQL connection | **P0 - CRITICAL** | Validated on startup |
| `NEXTAUTH_SECRET` | Session signing | **P0 - CRITICAL** | Must be 32+ chars |
| `NEXTAUTH_URL` | App URL | P1 - High | Required |
| `CLICKUP_API_KEY` | Task management | P2 - Medium | Optional |

---

## SQL Injection Prevention

### Safe Patterns (ALWAYS USE THESE)

✅ **Using Prisma ORM** (automatic parameter escaping):
```typescript
const users = await prisma.user.findMany({
  where: { phone: userInput }  // Prisma escapes automatically
})
```

✅ **Using $queryRaw with tagged template** (parameters escaped):
```typescript
const results = await prisma.$queryRaw`
  SELECT * FROM "User"
  WHERE phone = ${userInput}
  AND "createdAt" >= ${date}::timestamp
`
```

✅ **Using Prisma.sql helper**:
```typescript
import { Prisma } from '@prisma/client'
const results = await prisma.$queryRaw(
  Prisma.sql`SELECT * FROM "User" WHERE phone = ${userInput}`
)
```

### Unsafe Patterns (NEVER DO THIS)

❌ **String concatenation with user input**:
```typescript
// DANGEROUS - SQL injection vulnerability
const query = `SELECT * FROM "User" WHERE phone = '${userInput}'`
const results = await prisma.$queryRawUnsafe(query)
```

❌ **Template literals without Prisma escaping**:
```typescript
// DANGEROUS - bypasses Prisma's safety
const query = `SELECT * FROM "User" WHERE phone = '${userInput}'`
const results = await database.raw(query)
```

---

## Authentication & Authorization

### Session Security

**Current Configuration:**
- Strategy: JWT (stateless)
- Duration: 7 days
- Secret: NEXTAUTH_SECRET (validated on startup)

**Best Practices:**
- Never expose session tokens in logs
- Clear browser cookies on logout
- Implement device tracking for suspicious logins
- Consider shorter session duration for admin roles

### Password Security

**Current Implementation:**
- Hashing: bcrypt with salt rounds
- Minimum length: 6 characters (enforced client-side)
- Guest users: No password required (SMS-only)

**Production Recommendations:**
- Increase minimum password length to 8 characters
- Add password strength meter
- Implement password history (prevent reuse)
- Enforce password rotation every 90 days for admins

---

## Payment Security

### Current Model: Platform-as-Merchant

**Payment Flow:**
1. Customer pays: Ticket price + 5% commission
2. All payments go to i-Ticket TeleBirr merchant account
3. i-Ticket settles with bus companies bi-weekly
4. Commission retained by i-Ticket

**Security Measures:**
- ✅ Signature verification on all callbacks
- ✅ Timestamp validation (5-minute window)
- ✅ **Replay attack protection** (callback hash + transaction ID tracking)
- ✅ Demo mode for testing without real transactions
- ✅ Comprehensive audit logging

### Callback Replay Protection

**How It Works:**
```typescript
// 1. Generate unique hash of callback payload
const callbackHash = generateCallbackHash(body)

// 2. Check if already processed
const { processed } = await isCallbackProcessed(transactionId, callbackHash)

// 3. If yes, reject (replay attack!)
if (processed) {
  return "Already processed"
}

// 4. Record BEFORE processing
await recordProcessedCallback(...)

// 5. Now safe to process
await handleSuccessfulPayment(...)
```

**Protection Against:**
- Duplicate ticket generation
- Double booking same seats
- Revenue leakage from replayed callbacks
- Audit trail corruption

---

## Race Condition Protection

### Booking Slot Allocation

**Problem:** Multiple users booking last seats simultaneously = overbooking

**Solution:** Row-level database locking

```typescript
// Lock trip row during booking
const trip = await tx.$queryRaw`
  SELECT * FROM "Trip"
  WHERE id = ${tripId}
  FOR UPDATE NOWAIT
`

// Atomic slot decrement
await tx.$executeRaw`
  UPDATE "Trip"
  SET "availableSlots" = "availableSlots" - ${count}
  WHERE id = ${tripId}
    AND "availableSlots" >= ${count}
`
```

**Benefits:**
- Prevents overbooking
- Fast failure with NOWAIT (better UX)
- Serializable transaction isolation

---

## Trip Update Protection

### Business Rules

**Immutable Fields After Paid Bookings:**
- `price` - Cannot change ticket price after customers paid
- `totalSlots` - Cannot decrease capacity (only increase allowed)
- `busType` - Cannot change vehicle type
- `departureTime` - Cannot modify schedule

**Validation:**
```typescript
const validation = await validateTripUpdate(tripId, updateFields)

if (!validation.allowed) {
  return error("Cannot modify after bookings are paid")
}
```

**Audit Trail:**
- All update attempts logged (successful and blocked)
- Shows who tried to change what
- Includes paid booking count at time of attempt

---

## Data Protection

### Personal Data (GDPR-Style)

**Data Collected:**
- Name, phone number, national ID (passengers)
- Payment transaction details
- Booking history

**Protection Measures:**
- Encrypted database connections (SSL/TLS)
- Role-based access control
- Audit logging of all data access
- No plaintext storage of sensitive data

### PCI DSS Considerations

**Current Status:**
- ✅ No credit card data stored (mobile money only)
- ✅ Payment processing via certified provider (TeleBirr)
- ✅ Signature verification on callbacks
- ✅ HTTPS required in production

**Not Applicable:**
- Credit card storage requirements
- PAN encryption

---

## Production Deployment Checklist

### Pre-Deployment Security

- [ ] Strong database password (16+ characters)
- [ ] NEXTAUTH_SECRET generated with crypto.randomBytes (32+ bytes)
- [ ] `DEMO_MODE=false` (no demo transactions in production)
- [ ] `NODE_ENV=production`
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Database backups automated (daily minimum)
- [ ] Error monitoring configured (Sentry, DataDog, etc.)
- [ ] Rate limiting enabled on all public endpoints
- [ ] CORS properly configured (production domain only)

### Regulatory Compliance

- [ ] Payment Gateway Operator license from National Bank of Ethiopia
- [ ] ETB 3 million capital deposited in blocked account
- [ ] Escrow account opened with Ethiopian bank
- [ ] Settlement period ≤ 48 hours (avoid money transmission classification)
- [ ] AML (Anti-Money Laundering) controls documented
- [ ] Customer data privacy policy published

### Infrastructure Security

- [ ] Web Application Firewall (WAF) configured
- [ ] DDoS protection enabled (CloudFlare, AWS Shield)
- [ ] Load balancer with SSL termination
- [ ] Database not publicly accessible (private subnet)
- [ ] VPN or bastion host for database access
- [ ] Automated security scanning (Snyk, npm audit)

---

## Incident Response Plan

### Credential Compromise

**Immediate Actions (Within 1 Hour):**
1. Rotate all affected credentials
2. Revoke all active user sessions
3. Check audit logs for unauthorized access
4. Block suspicious IP addresses

**Investigation (Within 4 Hours):**
1. Determine scope of compromise
2. Identify affected users/data
3. Check for data exfiltration
4. Document timeline and attack vector

**Recovery (Within 24 Hours):**
1. Notify affected users if data breach occurred
2. Restore from backup if necessary
3. Implement additional security controls
4. Update security documentation

### Database Breach

**Immediate:**
1. Isolate database (disable external access)
2. Create forensic snapshot
3. Rotate database credentials
4. Enable query logging for forensics

**Investigation:**
1. Audit all database access logs
2. Check for unauthorized queries
3. Identify compromised accounts
4. Assess data exposure scope

**Recovery:**
1. Restore from last known good backup
2. Re-run critical transactions if needed
3. Notify regulators if required by law
4. Implement enhanced monitoring

### Payment Fraud

**Detection:**
- Multiple failed payment attempts from same IP
- Unusual booking patterns (bulk bookings, then cancellations)
- Replay attack attempts logged
- Chargebacks or refund requests

**Response:**
1. Block suspicious accounts/IPs
2. Review affected transactions
3. Contact TeleBirr fraud department
4. Notify bus companies of suspicious bookings
5. Preserve evidence for potential legal action

---

## Code Review Security Checklist

Before merging any PR:

### Authentication & Authorization
- [ ] All API routes check authentication (except public endpoints)
- [ ] Role-based access control enforced
- [ ] No hardcoded credentials in code
- [ ] Session timeout configured appropriately

### Input Validation
- [ ] All user inputs validated with Zod schemas
- [ ] File upload validation (if applicable)
- [ ] Phone number format validation
- [ ] Date/time validation and timezone handling

### Data Security
- [ ] No SQL injection vulnerabilities (use Prisma ORM)
- [ ] No XSS vulnerabilities (sanitize HTML output)
- [ ] No sensitive data in console.log statements
- [ ] Error messages don't leak system information

### Payment Security
- [ ] Amount recalculated server-side (never trust client)
- [ ] Signature verification on all callbacks
- [ ] Idempotency keys for payment operations
- [ ] Comprehensive audit logging

### General Security
- [ ] No `.env` files committed
- [ ] Dependencies up to date (`npm audit`)
- [ ] No commented-out security code
- [ ] Proper error handling (don't expose stack traces)

---

## Monitoring & Alerts

### Critical Alerts (Immediate Action)

**Setup PagerDuty/Slack alerts for:**
- Payment callback replay attempts (> 5 in 1 hour)
- Failed authentication attempts (> 10 from same IP)
- Database connection failures
- Booking race condition errors (> 5% of attempts)
- TeleBirr API errors (> 10% failure rate)

### Warning Alerts (Review Within 24 Hours)

- Unusual booking patterns
- Multiple cancellations from same user
- API response time > 5 seconds
- Database query duration > 10 seconds
- Low slot alerts not triggering

### Metrics to Track

**Daily:**
- Total bookings created
- Payment success rate
- Callback replay blocks
- Booking race condition conflicts
- API error rate

**Weekly:**
- Settlement processing time
- Bus company payout accuracy
- Customer support tickets related to payments
- Security incident count

**Monthly:**
- Credential rotation compliance
- Dependency vulnerability scan
- Penetration testing results
- Compliance audit status

---

## Development Environment Security

### Local Setup

**Required:**
- Generate unique NEXTAUTH_SECRET per developer
- Use separate database instance (not shared)
- Never use production credentials locally
- Enable query logging for debugging

**Recommended:**
- Use Docker for consistent environment
- Implement pre-commit hooks (prevent .env commits)
- Run `npm audit` before committing
- Use VS Code security extensions (ESLint, Snyk)

### Git Hooks

**Pre-commit Hook** (`.git/hooks/pre-commit`):
```bash
#!/bin/sh
# Prevent committing .env files
if git diff --cached --name-only | grep -E '\.env$|\.env\.local$|\.env\.docker$'; then
  echo "ERROR: Attempted to commit .env file!"
  exit 1
fi

# Check for potential credential leaks
if git diff --cached | grep -E 'password.*=|api_key.*=|secret.*='; then
  echo "WARNING: Potential credential found!"
  read -p "Continue? (y/N) " -n 1 -r
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
```

---

## Contact & Reporting

**Security Concerns:**
- Report to development team lead immediately
- Email: security@i-ticket.et (when established)
- For critical vulnerabilities: Follow responsible disclosure

**Emergency Contacts:**
- Tech Lead: [Contact Info]
- System Admin: [Contact Info]
- NBE Compliance Officer: [Contact Info]

---

**Document Version:** 1.0
**Last Updated:** January 5, 2026
**Next Review:** April 5, 2026 (quarterly)
