import { NextResponse } from "next/server"

/**
 * Sanitize error messages to prevent information disclosure
 * Returns user-friendly message while logging technical details
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Map common error messages to user-friendly versions
    const errorMessage = error.message.toLowerCase()

    if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate')) {
      return "This record already exists. Please check your input."
    }

    if (errorMessage.includes('foreign key constraint')) {
      return "Related record not found. Please refresh and try again."
    }

    if (errorMessage.includes('not found')) {
      return "Resource not found."
    }

    if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
      return "Authentication required. Please log in."
    }

    if (errorMessage.includes('permission') || errorMessage.includes('access denied')) {
      return "Access denied. You don't have permission for this action."
    }

    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      // Return the actual validation error (safe)
      return error.message
    }

    // For unknown errors, return generic message
    return "An error occurred. Please try again later."
  }

  return "An error occurred. Please try again later."
}

/**
 * Generate request ID for error tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

/**
 * Create safe error response with request ID for support
 */
export function createErrorResponse(
  error: unknown,
  statusCode: number = 500,
  requestId?: string
): NextResponse {
  const reqId = requestId || generateRequestId()
  const userMessage = sanitizeErrorMessage(error)

  // Log full error server-side for debugging
  console.error(`[Error ${reqId}]`, error)

  return NextResponse.json(
    {
      error: userMessage,
      requestId: reqId,
      ...(process.env.NODE_ENV === 'development' && {
        _debug: error instanceof Error ? error.message : String(error)
      })
    },
    { status: statusCode }
  )
}

/**
 * Create safe success response
 */
export function createSuccessResponse(data: any, statusCode: number = 200): NextResponse {
  return NextResponse.json(data, { status: statusCode })
}
