/**
 * FEATURE 4: Admin Portal Navigation System
 *
 * Department and role-based navigation configuration for platform staff.
 * Each department sees only relevant sidebar items based on their permissions.
 */

import {
  LayoutDashboard,
  Building2,
  Bus,
  FileText,
  Users,
  DollarSign,
  BarChart3,
  Headphones,
  Megaphone,
  Shield,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import { PLATFORM_PERMISSIONS } from "./platform-staff-permissions"

export interface NavigationItem {
  title: string
  href: string
  icon: LucideIcon
  permission: string
  badge?: string // Optional badge text (e.g., "New", "Beta")
}

/**
 * Full Admin Navigation (CEO / Super Admin without PlatformStaff record)
 * These users see all items
 */
export const FULL_ADMIN_NAVIGATION: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    permission: PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    title: "Companies",
    href: "/admin/companies",
    icon: Building2,
    permission: PLATFORM_PERMISSIONS.VIEW_COMPANIES,
  },
  {
    title: "All Trips",
    href: "/admin/trips",
    icon: Bus,
    permission: PLATFORM_PERMISSIONS.VIEW_TRIPS,
  },
  {
    title: "Manifests",
    href: "/admin/manifests",
    icon: FileText,
    permission: PLATFORM_PERMISSIONS.VIEW_MANIFESTS,
  },
  {
    title: "Platform Staff",
    href: "/admin/staff",
    icon: Users,
    permission: PLATFORM_PERMISSIONS.VIEW_PLATFORM_STAFF,
  },
  {
    title: "Sales Team",
    href: "/admin/sales-persons",
    icon: Megaphone,
    permission: PLATFORM_PERMISSIONS.VIEW_MARKETING,
  },
  {
    title: "Company Support",
    href: "/admin/company-support",
    icon: Headphones,
    permission: PLATFORM_PERMISSIONS.VIEW_SUPPORT,
  },
  {
    title: "Audit Logs",
    href: "/admin/audit-logs",
    icon: Shield,
    permission: PLATFORM_PERMISSIONS.VIEW_AUDIT_LOGS,
  },
]

/**
 * Department-Specific Navigation Templates
 * Each department has a curated set of items relevant to their work
 */

export const FINANCE_NAVIGATION: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    permission: PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    title: "Financial Reports",
    href: "/admin/finance/reports",
    icon: BarChart3,
    permission: PLATFORM_PERMISSIONS.VIEW_FINANCE,
  },
  {
    title: "Commission Tracking",
    href: "/admin/finance/commissions",
    icon: DollarSign,
    permission: PLATFORM_PERMISSIONS.VIEW_FINANCE,
  },
  {
    title: "Settlements",
    href: "/admin/finance/settlements",
    icon: DollarSign,
    permission: PLATFORM_PERMISSIONS.VIEW_FINANCE,
    badge: "New",
  },
  {
    title: "Companies",
    href: "/admin/companies",
    icon: Building2,
    permission: PLATFORM_PERMISSIONS.VIEW_COMPANIES,
  },
  {
    title: "All Trips",
    href: "/admin/trips",
    icon: Bus,
    permission: PLATFORM_PERMISSIONS.VIEW_TRIPS,
  },
  {
    title: "Manifests",
    href: "/admin/manifests",
    icon: FileText,
    permission: PLATFORM_PERMISSIONS.VIEW_MANIFESTS,
  },
]

export const SUPPORT_NAVIGATION: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    permission: PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    title: "Company Support",
    href: "/admin/company-support",
    icon: Headphones,
    permission: PLATFORM_PERMISSIONS.VIEW_SUPPORT,
  },
  {
    title: "Support Tickets",
    href: "/admin/support",
    icon: Headphones,
    permission: PLATFORM_PERMISSIONS.VIEW_TICKETS,
  },
  {
    title: "Companies",
    href: "/admin/companies",
    icon: Building2,
    permission: PLATFORM_PERMISSIONS.VIEW_COMPANIES,
  },
  {
    title: "All Trips",
    href: "/admin/trips",
    icon: Bus,
    permission: PLATFORM_PERMISSIONS.VIEW_TRIPS,
  },
]

export const OPERATIONS_NAVIGATION: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    permission: PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    title: "All Trips",
    href: "/admin/trips",
    icon: Bus,
    permission: PLATFORM_PERMISSIONS.VIEW_TRIPS,
  },
  {
    title: "Manifests",
    href: "/admin/manifests",
    icon: FileText,
    permission: PLATFORM_PERMISSIONS.VIEW_MANIFESTS,
  },
  {
    title: "Companies",
    href: "/admin/companies",
    icon: Building2,
    permission: PLATFORM_PERMISSIONS.VIEW_COMPANIES,
  },
]

export const MARKETING_NAVIGATION: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    permission: PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    title: "Sales Team",
    href: "/admin/sales-persons",
    icon: Megaphone,
    permission: PLATFORM_PERMISSIONS.VIEW_MARKETING,
  },
  {
    title: "Commissions",
    href: "/admin/finance/commissions",
    icon: DollarSign,
    permission: PLATFORM_PERMISSIONS.MANAGE_COMMISSIONS,
  },
  {
    title: "Companies",
    href: "/admin/companies",
    icon: Building2,
    permission: PLATFORM_PERMISSIONS.VIEW_COMPANIES,
  },
]

export const TECHNICAL_NAVIGATION: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    permission: PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    title: "System Health",
    href: "/admin/technical/health",
    icon: Wrench,
    permission: PLATFORM_PERMISSIONS.VIEW_TECHNICAL,
  },
  {
    title: "Audit Logs",
    href: "/admin/audit-logs",
    icon: Shield,
    permission: PLATFORM_PERMISSIONS.VIEW_AUDIT_LOGS,
  },
  {
    title: "Support Tickets",
    href: "/admin/support",
    icon: Headphones,
    permission: PLATFORM_PERMISSIONS.VIEW_TICKETS,
  },
]

export const COMPLIANCE_NAVIGATION: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    permission: PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    title: "Audit Logs",
    href: "/admin/audit-logs",
    icon: Shield,
    permission: PLATFORM_PERMISSIONS.VIEW_AUDIT_LOGS,
  },
  {
    title: "Compliance Reports",
    href: "/admin/compliance/reports",
    icon: FileText,
    permission: PLATFORM_PERMISSIONS.VIEW_COMPLIANCE,
  },
  {
    title: "Companies",
    href: "/admin/companies",
    icon: Building2,
    permission: PLATFORM_PERMISSIONS.VIEW_COMPANIES,
  },
  {
    title: "All Trips",
    href: "/admin/trips",
    icon: Bus,
    permission: PLATFORM_PERMISSIONS.VIEW_TRIPS,
  },
]

export const MANAGEMENT_NAVIGATION: NavigationItem[] = FULL_ADMIN_NAVIGATION

/**
 * Department to Navigation Mapping
 * Maps department names to their corresponding navigation arrays
 */
export const DEPARTMENT_NAVIGATION: Record<string, NavigationItem[]> = {
  FINANCE: FINANCE_NAVIGATION,
  SUPPORT: SUPPORT_NAVIGATION,
  OPERATIONS: OPERATIONS_NAVIGATION,
  MARKETING: MARKETING_NAVIGATION,
  TECHNICAL: TECHNICAL_NAVIGATION,
  COMPLIANCE: COMPLIANCE_NAVIGATION,
  MANAGEMENT: MANAGEMENT_NAVIGATION,
}

/**
 * Get navigation items for a specific department
 *
 * @param department - Department name (FINANCE, SUPPORT, etc.)
 * @returns Array of navigation items for that department
 *
 * @example
 * const navItems = getNavigationForDepartment("FINANCE")
 * // Returns finance-specific sidebar items
 */
export function getNavigationForDepartment(department: string | undefined): NavigationItem[] {
  if (!department) {
    return FULL_ADMIN_NAVIGATION
  }

  return DEPARTMENT_NAVIGATION[department] || FULL_ADMIN_NAVIGATION
}

/**
 * Get navigation items filtered by user's permissions
 * This is the main function to use in the admin layout
 *
 * @param department - User's department
 * @param permissions - User's permission object from session
 * @param isCEO - Whether user is CEO (gets all items)
 * @returns Filtered navigation items user has permission to see
 *
 * @example
 * const navItems = getFilteredNavigation(
 *   session.user.platformStaffDepartment,
 *   session.user.platformStaffPermissions,
 *   session.user.platformStaffRole === "CEO"
 * )
 */
export function getFilteredNavigation(
  department: string | undefined,
  permissions: Record<string, boolean> | undefined,
  isCEO: boolean = false
): NavigationItem[] {
  // CEO or Super Admin without PlatformStaff = full navigation
  if (isCEO || !department) {
    return FULL_ADMIN_NAVIGATION
  }

  // Get department-specific navigation
  const navItems = getNavigationForDepartment(department)

  // Filter by permissions
  if (!permissions) {
    return []
  }

  return navItems.filter(item => permissions[item.permission] === true)
}
