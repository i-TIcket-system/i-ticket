import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { NextRequest } from "next/server";

export interface AuthSession {
  user: {
    id: string;
    name: string;
    email?: string;
    phone: string;
    role: string;
    companyId?: string;
  };
}

/**
 * Get authenticated session or throw 401 error
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  return session as AuthSession;
}

/**
 * Require specific role or throw 403 error
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthSession> {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

/**
 * Require company admin and return their companyId and userId
 */
export async function requireCompanyAdmin(): Promise<{ session: AuthSession; companyId: string; userId: string }> {
  const session = await requireRole(["COMPANY_ADMIN"]);

  if (!session.user.companyId) {
    throw new Error("FORBIDDEN");
  }

  return { session, companyId: session.user.companyId, userId: session.user.id };
}

/**
 * Require super admin
 */
export async function requireSuperAdmin(): Promise<AuthSession> {
  return requireRole(["SUPER_ADMIN"]);
}

/**
 * Require sales person
 */
export async function requireSalesPerson(): Promise<AuthSession> {
  return requireRole(["SALES_PERSON"]);
}

/**
 * Check if user owns a resource
 */
export async function requireOwnership(resourceUserId: string): Promise<AuthSession> {
  const session = await requireAuth();

  if (session.user.id !== resourceUserId && session.user.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN");
  }

  return session;
}

/**
 * Handle auth errors and return appropriate response
 */
export function handleAuthError(error: any) {
  if (error.message === "UNAUTHORIZED") {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  if (error.message === "FORBIDDEN") {
    return Response.json({ error: "Insufficient permissions" }, { status: 403 });
  }
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
