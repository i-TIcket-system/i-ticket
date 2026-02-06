import { NextRequest, NextResponse } from 'next/server';

/**
 * CSP Violation Report Endpoint
 * Receives Content-Security-Policy violation reports from browsers
 *
 * Reports are logged for monitoring - in production, you might want to:
 * - Store in database for analysis
 * - Send to a logging service (e.g., Sentry, LogRocket)
 * - Alert on high-frequency violations
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let report: unknown;

    // Handle both JSON and CSP report content types
    if (contentType.includes('application/csp-report') || contentType.includes('application/json')) {
      report = await request.json();
    } else {
      // Some browsers send as text
      const text = await request.text();
      try {
        report = JSON.parse(text);
      } catch {
        report = { raw: text };
      }
    }

    // Extract the actual CSP report (browsers wrap it in csp-report object)
    const cspReport = (report as Record<string, unknown>)?.['csp-report'] || report;

    // Log the violation (in production, send to monitoring service)
    console.warn('[CSP Violation]', JSON.stringify(cspReport, null, 2));

    // Return 204 No Content (standard response for report endpoints)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[CSP Report Error]', error);
    // Still return 204 to not break browser reporting
    return new NextResponse(null, { status: 204 });
  }
}

// Also handle GET for health checks
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'csp-report' });
}
