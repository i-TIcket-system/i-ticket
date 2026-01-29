import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      phone: string
      companyId: string | null
      companyName: string | null
      companyLogo: string | null
      staffRole: string | null
      profilePicture: string | null
      nationalId: string | null
      mustChangePassword?: boolean
      // FEATURE 4: Platform Staff Management
      platformStaffRole?: string
      platformStaffDepartment?: string
      platformStaffPermissions?: Record<string, boolean>
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    phone: string
    companyId: string | null
    companyName: string | null
    companyLogo: string | null
    staffRole: string | null
    profilePicture: string | null
    nationalId: string | null
    mustChangePassword?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    phone: string
    companyId: string | null
    companyName: string | null
    companyLogo: string | null
    staffRole: string | null
    profilePicture: string | null
    nationalId: string | null
    mustChangePassword?: boolean
    // FEATURE 4: Platform Staff Management
    platformStaffRole?: string
    platformStaffDepartment?: string
    platformStaffPermissions?: Record<string, boolean>
  }
}
