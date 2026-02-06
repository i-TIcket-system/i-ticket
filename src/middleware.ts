import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const cspReportUri = 'https://i-ticket.et/api/csp-report'

  // Next.js 14 does NOT propagate nonces to its inline <script> tags,
  // so 'unsafe-inline' is required for script-src. 'unsafe-eval' is
  // removed (only needed in dev for hot reload, not production).
  // Full nonce-based CSP requires Next.js 15+.
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https://api.qrserver.com https://*.tile.openstreetmap.org https://unpkg.com;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' https://api.telebirr.com https://api.webirr.com https://*.tile.openstreetmap.org https://cloudflareinsights.com;
    media-src 'self' data: blob:;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    object-src 'none';
    upgrade-insecure-requests;
    report-to csp-endpoint;
    report-uri ${cspReportUri};
  `

  const cspHeaderValue = cspHeader.replace(/\s{2,}/g, ' ').trim()

  const response = NextResponse.next()

  response.headers.set('Content-Security-Policy', cspHeaderValue)
  response.headers.set(
    'Report-To',
    `{"group":"csp-endpoint","max_age":86400,"endpoints":[{"url":"${cspReportUri}"}]}`
  )
  response.headers.set('Reporting-Endpoints', `csp-endpoint="${cspReportUri}"`)

  return response
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!api|_next/static|_next/image|favicon\\.ico|my-favicon|manifest\\.json).*)',
  ],
}
