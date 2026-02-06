import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const cspReportUri = 'https://i-ticket.et/api/csp-report'

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https://api.qrserver.com;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' https://api.telebirr.com https://api.webirr.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    object-src 'none';
    upgrade-insecure-requests;
    report-to csp-endpoint;
    report-uri ${cspReportUri};
  `

  const cspHeaderValue = cspHeader.replace(/\s{2,}/g, ' ').trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeaderValue)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

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
