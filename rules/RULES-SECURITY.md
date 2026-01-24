# Security Rules (RULE-014 to RULE-017)

> **Priority**: 🔒 SECURITY
> **Violation Impact**: Attack surface, vulnerability
> **Back to**: [RULES.md](../RULES.md)

---

## 14. Input Validation

**Rule ID**: `RULE-014`

### The Rule

**ALL user input MUST be validated with Zod:**

### parseInt Vulnerability

```typescript
// ❌ DANGEROUS: parseInt accepts scientific notation
parseInt("1e10") // Returns 1, not 10000000000!
parseInt("123abc") // Returns 123, ignores "abc"

// ✅ SAFE: Use Zod
const schema = z.coerce.number().int().positive();
schema.parse("1e10") // Throws error
schema.parse("123abc") // Throws error
```

### Required Validations

| Input Type | Zod Schema |
|------------|------------|
| ID (string) | `z.string().cuid()` or `z.string().uuid()` |
| Phone | `z.string().regex(/^09\d{8}$/)` |
| Price | `z.coerce.number().positive()` |
| Date | `z.coerce.date()` |
| Enum | `z.enum([...values])` |

### SQL Injection Prevention

- Always use Prisma (parameterized queries)
- Never construct SQL strings manually
- Validate all string inputs for length/format

### Files

- All API routes in `src/app/api/**/*.ts`

### Related Bugs

- Bug #7: parseInt Accepts Scientific Notation

---

## 15. Rate Limiting

**Rule ID**: `RULE-015`

### Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 attempts | 15 minutes |
| Register | 3 attempts | 60 minutes |
| Booking | 10 attempts | 1 minute |
| Payment | 5 attempts | 1 minute |
| Company chat | 10 messages | 1 hour |

### Implementation

```typescript
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  try {
    await limiter.check(10, ip); // 10 requests per minute
  } catch {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  // ... handle request
}
```

### Files

- `src/lib/rate-limit.ts`

---

## 16. Authentication

**Rule ID**: `RULE-016`

### Session Management

| Setting | Value |
|---------|-------|
| Provider | NextAuth.js |
| Session duration | 30 days |
| Password hashing | bcrypt |
| Session strategy | JWT |

### Role Hierarchy

```
SUPER_ADMIN > COMPANY_ADMIN > Staff Roles > CUSTOMER
```

### Force Password Change

New company admins with temporary passwords:
1. Login succeeds
2. Redirect to `/force-change-password`
3. Cannot access other pages until changed
4. `mustChangePassword` flag cleared after change

### Session Data

```typescript
// Available in session.user
interface SessionUser {
  id: string;
  phone: string;
  role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "CUSTOMER" | "SALES_PERSON";
  companyId?: string; // For company staff
  staffRole?: string; // DRIVER, CONDUCTOR, etc.
  mustChangePassword?: boolean;
}
```

### Files

- `src/lib/auth.ts`
- `src/app/api/auth/[...nextauth]/route.ts`

---

## 17. Payment Security

**Rule ID**: `RULE-017`

### TeleBirr Integration

| Security Feature | Implementation |
|------------------|----------------|
| Signature | HMAC-SHA256 |
| Callback verification | Signature validation |
| Replay protection | `ProcessedCallback` table |

### Replay Attack Prevention

```typescript
// Check if callback already processed
const existingCallback = await prisma.processedCallback.findUnique({
  where: { signatureHash: hash(callbackSignature) }
});

if (existingCallback) {
  return NextResponse.json({ status: "already_processed" });
}

// Process payment...

// Mark as processed
await prisma.processedCallback.create({
  data: {
    signatureHash: hash(callbackSignature),
    processedAt: new Date()
  }
});
```

### Amount Verification

```typescript
// ALWAYS verify callback amount matches expected
const booking = await prisma.booking.findUnique({
  where: { id: bookingId },
  include: { payment: true }
});

const expectedAmount = booking.payment.amount;
const callbackAmount = callback.transactionAmount;

if (Math.abs(expectedAmount - callbackAmount) > 0.01) {
  await logSecurityIncident("AMOUNT_MISMATCH", { expected, received });
  return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
}
```

### Files

- `src/app/api/payment/telebirr/callback/route.ts`
- `src/lib/payment/telebirr-handler.ts`

### Related Bugs

- Bug #12: Payment Replay Attack Possible
