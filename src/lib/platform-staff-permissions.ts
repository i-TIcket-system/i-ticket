/**
 * FEATURE 4: Platform Staff Permission System
 *
 * Permission-based access control for i-Ticket platform employees.
 * Supports role-based and granular permission checks.
 */

import { Session } from "next-auth"

/**
 * Standard Platform Permissions
 * These are the core permissions used across the admin portal
 */
export const PLATFORM_PERMISSIONS = {
  // Dashboard & Overview
  VIEW_DASHBOARD: "view_dashboard",

  // Company Management
  VIEW_COMPANIES: "view_companies",
  MANAGE_COMPANIES: "manage_companies",

  // Trip Operations
  VIEW_TRIPS: "view_trips",
  MANAGE_TRIPS: "manage_trips",
  VIEW_MANIFESTS: "view_manifests",

  // Financial
  VIEW_FINANCE: "view_finance",
  MANAGE_FINANCE: "manage_finance",
  VIEW_REPORTS: "view_reports",
  EXPORT_DATA: "export_data",
  APPROVE_SETTLEMENTS: "approve_settlements",

  // Sales & Marketing
  VIEW_MARKETING: "view_marketing",
  MANAGE_SALES_TEAM: "manage_sales_team",
  MANAGE_COMMISSIONS: "manage_commissions",

  // Support
  VIEW_SUPPORT: "view_support",
  MANAGE_SUPPORT: "manage_support",
  VIEW_TICKETS: "view_tickets",
  RESPOND_TICKETS: "respond_tickets",

  // Platform Staff
  VIEW_PLATFORM_STAFF: "view_platform_staff",
  MANAGE_PLATFORM_STAFF: "manage_platform_staff",

  // Operations
  VIEW_OPERATIONS: "view_operations",
  MANAGE_OPERATIONS: "manage_operations",

  // Audit & Compliance
  VIEW_AUDIT_LOGS: "view_audit_logs",
  VIEW_COMPLIANCE: "view_compliance",
  MANAGE_COMPLIANCE: "manage_compliance",

  // Technical
  VIEW_TECHNICAL: "view_technical",
  MANAGE_TECHNICAL: "manage_technical",
} as const

/**
 * Check if a user has a specific permission
 *
 * @param session - Next-Auth session object
 * @param permission - Permission string to check
 * @returns true if user has permission, false otherwise
 *
 * @example
 * if (hasPermission(session, PLATFORM_PERMISSIONS.VIEW_FINANCE)) {
 *   // Show finance data
 * }
 */
export function hasPermission(session: Session | null, permission: string): boolean {
  if (!session?.user) return false

  // Non-admin users have no permissions
  if (session.user.role !== "SUPER_ADMIN") return false

  // Super admin with no PlatformStaff record = full access (backward compatibility)
  if (!session.user.platformStaffRole) {
    return true
  }

  // CEO has wildcard permissions
  if (session.user.platformStaffRole === "CEO") {
    return true
  }

  // Check specific permission
  const permissions = session.user.platformStaffPermissions || {}
  return permissions[permission] === true
}

/**
 * Require a specific permission (throws error if not authorized)
 * Use this in API routes to enforce permission checks
 *
 * @param session - Next-Auth session object
 * @param permission - Required permission
 * @throws Error with "FORBIDDEN" message if permission denied
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   const session = await requireSuperAdmin()
 *   requirePermission(session, PLATFORM_PERMISSIONS.VIEW_FINANCE)
 *   // ... rest of API logic
 * }
 */
export function requirePermission(session: Session | null, permission: string): void {
  if (!hasPermission(session, permission)) {
    throw new Error("FORBIDDEN")
  }
}

/**
 * Check if user has ANY of the provided permissions
 * Useful for OR-based permission checks
 *
 * @param session - Next-Auth session object
 * @param permissions - Array of permission strings
 * @returns true if user has at least one permission
 *
 * @example
 * if (hasAnyPermission(session, [PLATFORM_PERMISSIONS.VIEW_FINANCE, PLATFORM_PERMISSIONS.MANAGE_FINANCE])) {
 *   // User can access finance section
 * }
 */
export function hasAnyPermission(session: Session | null, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(session, permission))
}

/**
 * Check if user has ALL of the provided permissions
 * Useful for AND-based permission checks
 *
 * @param session - Next-Auth session object
 * @param permissions - Array of permission strings
 * @returns true if user has all permissions
 *
 * @example
 * if (hasAllPermissions(session, [PLATFORM_PERMISSIONS.VIEW_FINANCE, PLATFORM_PERMISSIONS.EXPORT_DATA])) {
 *   // User can view and export finance data
 * }
 */
export function hasAllPermissions(session: Session | null, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(session, permission))
}

/**
 * Get default permissions for a specific role
 * Used when creating new platform staff members
 *
 * @param role - Platform staff role (CEO, ACCOUNTANT, etc.)
 * @returns Array of permission strings
 *
 * @example
 * const accountantPerms = getPermissionsForRole("ACCOUNTANT")
 * // Returns: ["view_finance", "view_reports", "view_dashboard", ...]
 */
export function getPermissionsForRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    // Top Management - Full Access
    CEO: ["*"], // Wildcard = all permissions

    // Finance Department
    ACCOUNTANT: [
      PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
      PLATFORM_PERMISSIONS.VIEW_FINANCE,
      PLATFORM_PERMISSIONS.VIEW_REPORTS,
      PLATFORM_PERMISSIONS.EXPORT_DATA,
      PLATFORM_PERMISSIONS.VIEW_COMPANIES,
      PLATFORM_PERMISSIONS.VIEW_TRIPS,
    ],
    SENIOR_ACCOUNTANT: [
      PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
      PLATFORM_PERMISSIONS.VIEW_FINANCE,
      PLATFORM_PERMISSIONS.MANAGE_FINANCE,
      PLATFORM_PERMISSIONS.VIEW_REPORTS,
      PLATFORM_PERMISSIONS.EXPORT_DATA,
      PLATFORM_PERMISSIONS.APPROVE_SETTLEMENTS,
      PLATFORM_PERMISSIONS.VIEW_COMPANIES,
      PLATFORM_PERMISSIONS.VIEW_TRIPS,
    ],
    FINANCE_MANAGER: [
      PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
      PLATFORM_PERMISSIONS.VIEW_FINANCE,
      PLATFORM_PERMISSIONS.MANAGE_FINANCE,
      PLATFORM_PERMISSIONS.VIEW_REPORTS,
      PLATFORM_PERMISSIONS.EXPORT_DATA,
      PLATFORM_PERMISSIONS.APPROVE_SETTLEMENTS,
      PLATFORM_PERMISSIONS.VIEW_COMPANIES,
      PLATFORM_PERMISSIONS.VIEW_TRIPS,
      PLATFORM_PERMISSIONS.VIEW_MANIFESTS,
      PLATFORM_PERMISSIONS.VIEW_AUDIT_LOGS,
    ],

    // Support Department
    SUPPORT_AGENT: [
      PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
      PLATFORM_PERMISSIONS.VIEW_SUPPORT,
      PLATFORM_PERMISSIONS.VIEW_TICKETS,
      PLATFORM_PERMISSIONS.RESPOND_TICKETS,
      PLATFORM_PERMISSIONS.VIEW_COMPANIES,
      PLATFORM_PERMISSIONS.VIEW_TRIPS,
    ],
    SUPPORT_MANAGER: [
      PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
      PLATFORM_PERMISSIONS.VIEW_SUPPORT,
      PLATFORM_PERMISSIONS.MANAGE_SUPPORT,
      PLATFORM_PERMISSIONS.VIEW_TICKETS,
      PLATFORM_PERMISSIONS.RESPOND_TICKETS,
      PLATFORM_PERMISSIONS.VIEW_COMPANIES,
      PLATFORM_PERMISSIONS.VIEW_TRIPS,
      PLATFORM_PERMISSIONS.VIEW_AUDIT_LOGS,
    ],

    // Operations Department
    OPERATIONS_COORDINATOR: [
      PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
      PLATFORM_PERMISSIONS.VIEW_OPERATIONS,
      PLATFORM_PERMISSIONS.VIEW_TRIPS,
      PLATFORM_PERMISSIONS.VIEW_MANIFESTS,
      PLATFORM_PERMISSIONS.VIEW_COMPANIES,
    ],
    OPERATIONS_MANAGER: [
      PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
      PLATFORM_PERMISSIONS.VIEW_OPERATIONS,
      PLATFORM_PERMISSIONS.MANAGE_OPERATIONS,
      PLATFORM_PERMISSIONS.VIEW_TRIPS,
      PLATFORM_PERMISSIONS.MANAGE_TRIPS,
      PLATFORM_PERMISSIONS.VIEW_MANIFESTS,
      PLATFORM_PERMISSIONS.VIEW_COMPANIES,
      PLATFORM_PERMISSIONS.VIEW_REPORTS,
    ],

    // Marketing/Sales Department
    MARKETING_COORDINATOR: [
      PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
      PLATFORM_PERMISSIONS.VIEW_MARKETING,
      PLATFORM_PERMISSIONS.VIEW_COMPANIES,
    ],
    SALES_MANAGER: [
      PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
      PLATFORM_PERMISSIONS.VIEW_MARKETING,
      PLATFORM_PERMISSIONS.MANAGE_SALES_TEAM,
      PLATFORM_PERMISSIONS.MANAGE_COMMISSIONS,
      PLATFORM_PERMISSIONS.VIEW_REPORTS,
    ],

    // Technical Department
    TECHNICAL_SUPPORT: [
      PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
      PLATFORM_PERMISSIONS.VIEW_TECHNICAL,
      PLATFORM_PERMISSIONS.VIEW_SUPPORT,
      PLATFORM_PERMISSIONS.VIEW_TICKETS,
    ],
    DEVELOPER: [
      PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
      PLATFORM_PERMISSIONS.VIEW_TECHNICAL,
      PLATFORM_PERMISSIONS.MANAGE_TECHNICAL,
      PLATFORM_PERMISSIONS.VIEW_AUDIT_LOGS,
    ],

    // Compliance Department
    COMPLIANCE_OFFICER: [
      PLATFORM_PERMISSIONS.VIEW_DASHBOARD,
      PLATFORM_PERMISSIONS.VIEW_COMPLIANCE,
      PLATFORM_PERMISSIONS.MANAGE_COMPLIANCE,
      PLATFORM_PERMISSIONS.VIEW_AUDIT_LOGS,
      PLATFORM_PERMISSIONS.VIEW_COMPANIES,
      PLATFORM_PERMISSIONS.VIEW_TRIPS,
      PLATFORM_PERMISSIONS.VIEW_REPORTS,
    ],
  }

  return rolePermissions[role] || []
}

/**
 * Convert permissions array to JSON object for database storage
 *
 * @param permissions - Array of permission strings
 * @returns JSON object with permissions as keys (all set to true)
 *
 * @example
 * const perms = permissionsArrayToObject(["view_finance", "view_reports"])
 * // Returns: { "view_finance": true, "view_reports": true }
 */
export function permissionsArrayToObject(permissions: string[]): Record<string, boolean> {
  const obj: Record<string, boolean> = {}
  permissions.forEach(perm => {
    obj[perm] = true
  })
  return obj
}

/**
 * Convert permissions JSON object to array of permission strings
 *
 * @param permissions - JSON object from database
 * @returns Array of permission strings (only true values)
 *
 * @example
 * const perms = permissionsObjectToArray({ "view_finance": true, "manage_finance": false })
 * // Returns: ["view_finance"]
 */
export function permissionsObjectToArray(permissions: Record<string, boolean>): string[] {
  return Object.entries(permissions)
    .filter(([_, value]) => value === true)
    .map(([key, _]) => key)
}
