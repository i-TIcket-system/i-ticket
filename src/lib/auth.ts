import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import prisma from "./db"

// P0-SEC-002: Server-side rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; firstAttempt: number; lockedUntil?: number }>()

function checkLoginRateLimit(identifier: string, type: 'ip' | 'phone'): { allowed: boolean; remainingMinutes?: number } {
  const now = Date.now()
  const limits = {
    ip: { maxAttempts: 10, windowMs: 15 * 60 * 1000 }, // 10 attempts per 15 minutes per IP
    phone: { maxAttempts: 5, windowMs: 30 * 60 * 1000, lockoutMs: 15 * 60 * 1000 } // 5 attempts per 30 min, 15 min lockout
  }

  const limit = limits[type]
  const attempt = loginAttempts.get(identifier)

  if (!attempt) {
    loginAttempts.set(identifier, { count: 1, firstAttempt: now })
    return { allowed: true }
  }

  // Check if lockout period has expired
  if (attempt.lockedUntil && now < attempt.lockedUntil) {
    const remainingMs = attempt.lockedUntil - now
    return {
      allowed: false,
      remainingMinutes: Math.ceil(remainingMs / 60000)
    }
  }

  // Check if window has expired
  if (now - attempt.firstAttempt > limit.windowMs) {
    loginAttempts.set(identifier, { count: 1, firstAttempt: now })
    return { allowed: true }
  }

  // Increment attempt count
  attempt.count++

  // Check if max attempts exceeded
  if (attempt.count > limit.maxAttempts) {
    // Set lockout for phone-based limiting
    if (type === 'phone' && 'lockoutMs' in limit) {
      attempt.lockedUntil = now + limit.lockoutMs
    }

    return {
      allowed: false,
      remainingMinutes: type === 'phone' ? 15 : Math.ceil((limit.windowMs - (now - attempt.firstAttempt)) / 60000)
    }
  }

  return { allowed: true }
}

// Cleanup old entries (called on each check instead of setInterval)
function cleanupOldAttempts() {
  const now = Date.now()
  for (const [key, value] of Array.from(loginAttempts.entries())) {
    if (now - value.firstAttempt > 60 * 60 * 1000 && (!value.lockedUntil || now > value.lockedUntil)) {
      loginAttempts.delete(key)
    }
  }
}

// Validate required environment variables at startup
function validateEnvVars() {
  const required = {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  }

  const missing: string[] = []

  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim() === '') {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env.local file and ensure all required variables are set.`
    )
  }

  // Validate NEXTAUTH_SECRET strength
  const secret = required.NEXTAUTH_SECRET!
  if (secret.length < 32) {
    throw new Error(
      `NEXTAUTH_SECRET is too weak (${secret.length} characters). ` +
      `Generate a strong secret with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
    )
  }

  // Warn about default values in production
  if (process.env.NODE_ENV === 'production') {
    if (secret.includes('your-super-secret-key') || secret.includes('change-in-production')) {
      throw new Error(
        'NEXTAUTH_SECRET contains default placeholder text. ' +
        'You MUST generate a new secret for production.'
      )
    }
  }
}

// Run validation on module load
validateEnvVars()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error("Phone and password required")
        }

        // P0-SEC-002: Server-side rate limiting
        cleanupOldAttempts() // Cleanup on each login attempt
        const phone = credentials.phone
        const phoneLimit = checkLoginRateLimit(`phone:${phone}`, 'phone')

        if (!phoneLimit.allowed) {
          throw new Error(
            `Account temporarily locked. Too many failed attempts. Try again in ${phoneLimit.remainingMinutes} minute${phoneLimit.remainingMinutes !== 1 ? 's' : ''} or reset your password.`
          )
        }

        // First, try to find regular user
        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone },
          include: { company: true }
        })

        if (user) {
          if (!user.password) {
            throw new Error("This account has no password set. Please use SMS login.")
          }

          const isValid = await compare(credentials.password, user.password)
          if (!isValid) {
            // Failed attempt - will be counted by rate limiter
            throw new Error("Invalid password")
          }

          // P0-SEC-002: Clear rate limit on successful login
          loginAttempts.delete(`phone:${phone}`)

          return {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
            companyName: user.company?.name || null,
            staffRole: user.staffRole,
          }
        }

        // If not found, try sales person
        const salesPerson = await prisma.salesPerson.findUnique({
          where: { phone: credentials.phone }
        })

        if (salesPerson) {
          if (salesPerson.status !== 'ACTIVE') {
            throw new Error("Your account has been deactivated. Please contact admin.")
          }

          const isValid = await compare(credentials.password, salesPerson.password)
          if (!isValid) {
            throw new Error("Invalid password")
          }

          // Update last login
          await prisma.salesPerson.update({
            where: { id: salesPerson.id },
            data: { lastLoginAt: new Date() }
          })

          return {
            id: salesPerson.id,
            name: salesPerson.name,
            phone: salesPerson.phone,
            email: salesPerson.email,
            role: 'SALES_PERSON',
            companyId: null,
            companyName: null,
            staffRole: null,
          }
        }

        throw new Error("No user found with this phone number")
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.phone = user.phone
        token.companyId = user.companyId
        token.companyName = user.companyName
        token.staffRole = user.staffRole
      }

      // Refresh company name when session is manually updated
      if (trigger === 'update' && token.companyId) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: { company: true }
          })
          if (freshUser?.company) {
            token.companyName = freshUser.company.name
          }
        } catch (error) {
          console.error('Failed to refresh company name in token:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.phone = token.phone as string
        session.user.companyId = token.companyId as string | null
        session.user.companyName = token.companyName as string | null
        session.user.staffRole = token.staffRole as string | null
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours (reduced from 7 days for security)
    // For admin/company roles, consider even shorter duration (8-12 hours)
    // Users can use "Remember Me" feature if needed (future enhancement)
  },
  secret: process.env.NEXTAUTH_SECRET,
}
