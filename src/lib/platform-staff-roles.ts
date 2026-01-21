/**
 * Platform Staff Roles & Departments
 *
 * Defines all staff roles for i-Ticket platform employees (not company staff)
 * Based on SaaS organizational structure research
 */

export const DEPARTMENTS = {
  FINANCE: 'FINANCE',
  OPERATIONS: 'OPERATIONS',
  SUPPORT: 'SUPPORT',
  MARKETING: 'MARKETING',
  TECHNICAL: 'TECHNICAL',
  COMPLIANCE: 'COMPLIANCE',
  MANAGEMENT: 'MANAGEMENT',
} as const

export type Department = typeof DEPARTMENTS[keyof typeof DEPARTMENTS]

export const PLATFORM_STAFF_ROLES = {
  // Finance Department
  ACCOUNTANT: 'ACCOUNTANT',
  FINANCIAL_ANALYST: 'FINANCIAL_ANALYST',
  BILLING_MANAGER: 'BILLING_MANAGER',
  REVENUE_MANAGER: 'REVENUE_MANAGER',
  PAYROLL_SPECIALIST: 'PAYROLL_SPECIALIST',

  // Operations Department
  OPERATIONS_MANAGER: 'OPERATIONS_MANAGER',
  DISPATCH_COORDINATOR: 'DISPATCH_COORDINATOR',
  SYSTEM_ADMINISTRATOR: 'SYSTEM_ADMINISTRATOR',
  QA_SPECIALIST: 'QA_SPECIALIST',

  // Customer Support Department
  SUPPORT_AGENT: 'SUPPORT_AGENT',
  SUPPORT_TEAM_LEAD: 'SUPPORT_TEAM_LEAD',
  CUSTOMER_SUCCESS_MANAGER: 'CUSTOMER_SUCCESS_MANAGER',
  TECHNICAL_SUPPORT: 'TECHNICAL_SUPPORT',

  // Marketing & Business
  MARKETING_MANAGER: 'MARKETING_MANAGER',
  CONTENT_MANAGER: 'CONTENT_MANAGER',
  BUSINESS_ANALYST: 'BUSINESS_ANALYST',
  PARTNERSHIP_MANAGER: 'PARTNERSHIP_MANAGER',

  // Technical Department
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  DATABASE_ADMIN: 'DATABASE_ADMIN',
  DEVOPS_ENGINEER: 'DEVOPS_ENGINEER',
  SECURITY_ANALYST: 'SECURITY_ANALYST',

  // Compliance & Legal
  COMPLIANCE_OFFICER: 'COMPLIANCE_OFFICER',
  LEGAL_ADVISOR: 'LEGAL_ADVISOR',
  DATA_PROTECTION_OFFICER: 'DATA_PROTECTION_OFFICER',

  // Management
  CEO: 'CEO',
  GENERAL_MANAGER: 'GENERAL_MANAGER',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
} as const

export type PlatformStaffRole = typeof PLATFORM_STAFF_ROLES[keyof typeof PLATFORM_STAFF_ROLES]

export interface RoleDefinition {
  role: PlatformStaffRole
  department: Department
  label: string
  description: string
  defaultPermissions: string[]
}

export const ROLE_DEFINITIONS: Record<PlatformStaffRole, RoleDefinition> = {
  // Finance Department
  ACCOUNTANT: {
    role: 'ACCOUNTANT',
    department: 'FINANCE',
    label: 'Accountant',
    description: 'General accounting, bookkeeping, financial records management',
    defaultPermissions: ['view_finance', 'manage_accounts', 'view_reports'],
  },
  FINANCIAL_ANALYST: {
    role: 'FINANCIAL_ANALYST',
    department: 'FINANCE',
    label: 'Financial Analyst',
    description: 'Financial planning, analysis, forecasting, and strategic recommendations',
    defaultPermissions: ['view_finance', 'view_analytics', 'view_reports', 'export_data'],
  },
  BILLING_MANAGER: {
    role: 'BILLING_MANAGER',
    department: 'FINANCE',
    label: 'Billing Manager',
    description: 'Invoice management, payment processing, billing operations',
    defaultPermissions: ['view_finance', 'manage_billing', 'view_payments'],
  },
  REVENUE_MANAGER: {
    role: 'REVENUE_MANAGER',
    department: 'FINANCE',
    label: 'Revenue Manager',
    description: 'Revenue analysis, commission tracking, VAT management',
    defaultPermissions: ['view_finance', 'view_revenue', 'manage_tax', 'view_commissions'],
  },
  PAYROLL_SPECIALIST: {
    role: 'PAYROLL_SPECIALIST',
    department: 'FINANCE',
    label: 'Payroll Specialist',
    description: 'Staff payroll, commission payouts, salary management',
    defaultPermissions: ['view_finance', 'manage_payroll', 'view_staff'],
  },

  // Operations Department
  OPERATIONS_MANAGER: {
    role: 'OPERATIONS_MANAGER',
    department: 'OPERATIONS',
    label: 'Operations Manager',
    description: 'Overall operations oversight, process optimization',
    defaultPermissions: ['view_operations', 'manage_operations', 'view_trips', 'view_companies'],
  },
  DISPATCH_COORDINATOR: {
    role: 'DISPATCH_COORDINATOR',
    department: 'OPERATIONS',
    label: 'Dispatch Coordinator',
    description: 'Monitor trips, coordinate with bus companies, real-time operations',
    defaultPermissions: ['view_operations', 'view_trips', 'manage_dispatch'],
  },
  SYSTEM_ADMINISTRATOR: {
    role: 'SYSTEM_ADMINISTRATOR',
    department: 'OPERATIONS',
    label: 'System Administrator',
    description: 'Platform configuration, system settings, user management',
    defaultPermissions: ['view_operations', 'manage_system', 'view_users', 'manage_settings'],
  },
  QA_SPECIALIST: {
    role: 'QA_SPECIALIST',
    department: 'OPERATIONS',
    label: 'QA Specialist',
    description: 'Quality assurance, testing, bug reporting, platform quality',
    defaultPermissions: ['view_operations', 'manage_qa', 'view_reports'],
  },

  // Customer Support Department
  SUPPORT_AGENT: {
    role: 'SUPPORT_AGENT',
    department: 'SUPPORT',
    label: 'Customer Support Agent',
    description: 'Handle customer inquiries, support tickets, issue resolution',
    defaultPermissions: ['view_support', 'manage_tickets', 'view_users'],
  },
  SUPPORT_TEAM_LEAD: {
    role: 'SUPPORT_TEAM_LEAD',
    department: 'SUPPORT',
    label: 'Support Team Lead',
    description: 'Manage support team, handle escalations, team coordination',
    defaultPermissions: ['view_support', 'manage_tickets', 'manage_team', 'view_analytics'],
  },
  CUSTOMER_SUCCESS_MANAGER: {
    role: 'CUSTOMER_SUCCESS_MANAGER',
    department: 'SUPPORT',
    label: 'Customer Success Manager',
    description: 'Onboard bus companies, relationship management, retention',
    defaultPermissions: ['view_support', 'manage_companies', 'view_analytics', 'manage_onboarding'],
  },
  TECHNICAL_SUPPORT: {
    role: 'TECHNICAL_SUPPORT',
    department: 'SUPPORT',
    label: 'Technical Support Engineer',
    description: 'Technical troubleshooting, integration help, API support',
    defaultPermissions: ['view_support', 'manage_tickets', 'view_technical', 'manage_integrations'],
  },

  // Marketing & Business
  MARKETING_MANAGER: {
    role: 'MARKETING_MANAGER',
    department: 'MARKETING',
    label: 'Marketing Manager',
    description: 'Marketing strategy, campaigns, brand management',
    defaultPermissions: ['view_marketing', 'manage_campaigns', 'view_analytics'],
  },
  CONTENT_MANAGER: {
    role: 'CONTENT_MANAGER',
    department: 'MARKETING',
    label: 'Content Manager',
    description: 'Content creation, social media, communications',
    defaultPermissions: ['view_marketing', 'manage_content', 'manage_social'],
  },
  BUSINESS_ANALYST: {
    role: 'BUSINESS_ANALYST',
    department: 'MARKETING',
    label: 'Business Analyst',
    description: 'Data analysis, business insights, reporting',
    defaultPermissions: ['view_marketing', 'view_analytics', 'view_reports', 'export_data'],
  },
  PARTNERSHIP_MANAGER: {
    role: 'PARTNERSHIP_MANAGER',
    department: 'MARKETING',
    label: 'Partnership Manager',
    description: 'Bus company partnerships, business development',
    defaultPermissions: ['view_marketing', 'manage_companies', 'view_analytics'],
  },

  // Technical Department
  PLATFORM_ADMIN: {
    role: 'PLATFORM_ADMIN',
    department: 'TECHNICAL',
    label: 'Platform Administrator',
    description: 'IT administration, user management, technical operations',
    defaultPermissions: ['view_technical', 'manage_system', 'manage_users', 'view_all'],
  },
  DATABASE_ADMIN: {
    role: 'DATABASE_ADMIN',
    department: 'TECHNICAL',
    label: 'Database Administrator',
    description: 'Database maintenance, backups, optimization',
    defaultPermissions: ['view_technical', 'manage_database', 'view_reports'],
  },
  DEVOPS_ENGINEER: {
    role: 'DEVOPS_ENGINEER',
    department: 'TECHNICAL',
    label: 'DevOps Engineer',
    description: 'Deployment, monitoring, infrastructure management',
    defaultPermissions: ['view_technical', 'manage_infrastructure', 'view_monitoring'],
  },
  SECURITY_ANALYST: {
    role: 'SECURITY_ANALYST',
    department: 'TECHNICAL',
    label: 'Security Analyst',
    description: 'Security audits, vulnerability management, compliance',
    defaultPermissions: ['view_technical', 'manage_security', 'view_audit_logs'],
  },

  // Compliance & Legal
  COMPLIANCE_OFFICER: {
    role: 'COMPLIANCE_OFFICER',
    department: 'COMPLIANCE',
    label: 'Compliance Officer',
    description: 'Regulatory compliance, ERA reporting, policy enforcement',
    defaultPermissions: ['view_compliance', 'manage_compliance', 'view_reports', 'manage_tax'],
  },
  LEGAL_ADVISOR: {
    role: 'LEGAL_ADVISOR',
    department: 'COMPLIANCE',
    label: 'Legal Advisor',
    description: 'Legal matters, contracts, terms & conditions',
    defaultPermissions: ['view_compliance', 'manage_legal', 'view_contracts'],
  },
  DATA_PROTECTION_OFFICER: {
    role: 'DATA_PROTECTION_OFFICER',
    department: 'COMPLIANCE',
    label: 'Data Protection Officer',
    description: 'GDPR/data privacy compliance, data security',
    defaultPermissions: ['view_compliance', 'manage_privacy', 'view_audit_logs'],
  },

  // Management
  CEO: {
    role: 'CEO',
    department: 'MANAGEMENT',
    label: 'CEO / Founder',
    description: 'Chief Executive Officer - full platform access',
    defaultPermissions: ['*'], // Full access
  },
  GENERAL_MANAGER: {
    role: 'GENERAL_MANAGER',
    department: 'MANAGEMENT',
    label: 'General Manager',
    description: 'Day-to-day operations, overall management',
    defaultPermissions: ['view_all', 'manage_operations', 'view_finance', 'view_reports'],
  },
  DEPARTMENT_HEAD: {
    role: 'DEPARTMENT_HEAD',
    department: 'MANAGEMENT',
    label: 'Department Head',
    description: 'Department leadership, team management',
    defaultPermissions: ['view_all', 'manage_team', 'view_reports'],
  },
}

export const STAFF_STATUS = {
  ACTIVE: 'ACTIVE',
  ON_LEAVE: 'ON_LEAVE',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED',
} as const

export type StaffStatus = typeof STAFF_STATUS[keyof typeof STAFF_STATUS]

// Helper function to get roles by department
export function getRolesByDepartment(department: Department): RoleDefinition[] {
  return Object.values(ROLE_DEFINITIONS).filter(def => def.department === department)
}

// Helper function to check if a staff member has a specific permission
export function hasPermission(permissions: string[], required: string): boolean {
  if (permissions.includes('*')) return true // Full access
  return permissions.includes(required)
}

// Get role definition
export function getRoleDefinition(role: PlatformStaffRole): RoleDefinition {
  return ROLE_DEFINITIONS[role]
}

// Get department label
export function getDepartmentLabel(department: Department): string {
  const labels: Record<Department, string> = {
    FINANCE: 'Finance',
    OPERATIONS: 'Operations',
    SUPPORT: 'Customer Support',
    MARKETING: 'Marketing & Business',
    TECHNICAL: 'Technical',
    COMPLIANCE: 'Compliance & Legal',
    MANAGEMENT: 'Management',
  }
  return labels[department]
}
