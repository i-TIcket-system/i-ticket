import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import prisma from "./db"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error("Phone and password required")
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
            throw new Error("Invalid password")
          }

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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.phone = user.phone
        token.companyId = user.companyId
        token.companyName = user.companyName
        token.staffRole = user.staffRole
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
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}
