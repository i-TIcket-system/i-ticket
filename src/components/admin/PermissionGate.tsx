"use client"

/**
 * FEATURE 4: Permission Gate Component
 *
 * UI-level permission control component.
 * Shows/hides content based on user's permissions.
 */

import { useSession } from "next-auth/react"
import { hasPermission, hasAnyPermission, hasAllPermissions } from "@/lib/platform-staff-permissions"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Shield } from "lucide-react"

interface PermissionGateProps {
  /**
   * Single permission string to check
   * Use this for simple permission checks
   */
  permission?: string

  /**
   * Array of permissions (for OR/AND logic)
   * Used with requireAny or requireAll
   */
  permissions?: string[]

  /**
   * If true, user needs ANY of the permissions (OR logic)
   * Default: false
   */
  requireAny?: boolean

  /**
   * If true, user needs ALL of the permissions (AND logic)
   * Default: true (when permissions array is provided)
   */
  requireAll?: boolean

  /**
   * Content to show if user has permission
   */
  children: React.ReactNode

  /**
   * Optional fallback content if user lacks permission
   * If not provided, nothing is rendered
   */
  fallback?: React.ReactNode

  /**
   * If true, shows a disabled/locked state with tooltip instead of hiding
   * Useful for buttons that should be visible but disabled
   */
  showDisabled?: boolean

  /**
   * Custom tooltip message when disabled
   * Default: "You don't have permission to access this feature"
   */
  disabledMessage?: string
}

/**
 * Permission Gate Component
 *
 * Conditionally renders children based on user's permissions.
 *
 * @example Single permission check
 * <PermissionGate permission={PLATFORM_PERMISSIONS.VIEW_FINANCE}>
 *   <Button>View Finance</Button>
 * </PermissionGate>
 *
 * @example Multiple permissions (OR logic)
 * <PermissionGate permissions={[PLATFORM_PERMISSIONS.VIEW_FINANCE, PLATFORM_PERMISSIONS.MANAGE_FINANCE]} requireAny>
 *   <FinanceSection />
 * </PermissionGate>
 *
 * @example Multiple permissions (AND logic)
 * <PermissionGate permissions={[PLATFORM_PERMISSIONS.VIEW_FINANCE, PLATFORM_PERMISSIONS.EXPORT_DATA]} requireAll>
 *   <ExportButton />
 * </PermissionGate>
 *
 * @example With fallback
 * <PermissionGate permission={PLATFORM_PERMISSIONS.MANAGE_COMPANIES} fallback={<p>No access</p>}>
 *   <CompanyEditor />
 * </PermissionGate>
 *
 * @example Show disabled state
 * <PermissionGate permission={PLATFORM_PERMISSIONS.MANAGE_FINANCE} showDisabled>
 *   <Button>Approve Settlement</Button>
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  permissions,
  requireAny = false,
  requireAll = true,
  children,
  fallback,
  showDisabled = false,
  disabledMessage = "You don't have permission to access this feature",
}: PermissionGateProps) {
  const { data: session } = useSession()

  // Determine if user has required permission(s)
  const hasRequiredPermission = () => {
    // Single permission check
    if (permission) {
      return hasPermission(session, permission)
    }

    // Multiple permissions check
    if (permissions && permissions.length > 0) {
      if (requireAny) {
        return hasAnyPermission(session, permissions)
      }
      if (requireAll) {
        return hasAllPermissions(session, permissions)
      }
    }

    // No permission specified = deny by default for safety
    return false
  }

  const hasAccess = hasRequiredPermission()

  // User has permission - render children normally
  if (hasAccess) {
    return <>{children}</>
  }

  // User lacks permission
  if (showDisabled) {
    // Show disabled state with tooltip
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative inline-block">
              <div className="pointer-events-none opacity-50 cursor-not-allowed">
                {children}
              </div>
              <Shield className="absolute top-0 right-0 h-3 w-3 text-yellow-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{disabledMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Render fallback or nothing
  return <>{fallback || null}</>
}

/**
 * Simple permission check hook (for non-JSX logic)
 *
 * @example
 * const canManageFinance = usePermission(PLATFORM_PERMISSIONS.MANAGE_FINANCE)
 * if (canManageFinance) {
 *   // Do something
 * }
 */
export function usePermission(permission: string): boolean {
  const { data: session } = useSession()
  return hasPermission(session, permission)
}

/**
 * Multiple permissions check hook (OR logic)
 *
 * @example
 * const canAccessFinance = useAnyPermission([
 *   PLATFORM_PERMISSIONS.VIEW_FINANCE,
 *   PLATFORM_PERMISSIONS.MANAGE_FINANCE
 * ])
 */
export function useAnyPermission(permissions: string[]): boolean {
  const { data: session } = useSession()
  return hasAnyPermission(session, permissions)
}

/**
 * Multiple permissions check hook (AND logic)
 *
 * @example
 * const canExportFinance = useAllPermissions([
 *   PLATFORM_PERMISSIONS.VIEW_FINANCE,
 *   PLATFORM_PERMISSIONS.EXPORT_DATA
 * ])
 */
export function useAllPermissions(permissions: string[]): boolean {
  const { data: session } = useSession()
  return hasAllPermissions(session, permissions)
}
