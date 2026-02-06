/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Suppress useSearchParams() CSR bailout warnings for client components
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Hide X-Powered-By header (prevents server info disclosure)
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        pathname: '/v1/create-qr-code/**',
      },
    ],
  },
  async headers() {
    // CSP is handled by middleware.ts (nonce-based, per-request)
    // Only static headers that don't need per-request values go here
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=()'
          },
          {
            // Default Cache-Control for all pages
            key: 'Cache-Control',
            value: 'no-store'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          }
        ]
      },
      {
        // Cache-Control for sensitive pages (auth, account) - extra strict
        source: '/(login|register|account|admin|company|staff|cashier|mechanic|finance|sales)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      },
      {
        // Cache-Control for API routes (no caching of sensitive data)
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
