import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Cookie, Shield, Settings, BarChart3 } from "lucide-react"

export const metadata = {
  title: "Cookie Policy - i-Ticket",
  description: "Learn how i-Ticket uses cookies and similar technologies to improve your experience",
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to home
        </Link>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-4xl font-bold">Cookie Policy</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: February 4, 2026 | Effective Date: January 1, 2024
            </p>
            <p className="text-xs text-muted-foreground mt-1 italic">
              This policy explains how we use cookies and similar technologies on our platform.
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none pt-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-sm font-semibold text-blue-900 mb-2">About Cookies</p>
              <p className="text-sm text-blue-800">
                Cookies are small text files stored on your device when you visit our website. They help us provide
                you with a better experience by remembering your preferences, keeping you logged in, and understanding
                how you use our platform.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">1. What Are Cookies?</h2>
            <p>
              Cookies are small pieces of data stored on your device (computer, tablet, or mobile phone) when you
              visit a website. They are widely used to make websites work more efficiently and to provide information
              to website owners.
            </p>
            <p className="mt-3">
              Cookies can be "persistent" (remaining on your device until deleted or until they expire) or "session"
              cookies (deleted when you close your browser).
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">2. Types of Cookies We Use</h2>

            <div className="grid gap-4 my-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-900 m-0">Essential Cookies (Required)</h3>
                </div>
                <p className="text-sm text-green-800 mb-3">
                  These cookies are necessary for the platform to function properly. Without them, you would not be
                  able to use basic features like logging in, making bookings, or processing payments.
                </p>
                <div className="bg-white/50 rounded p-3">
                  <p className="text-xs font-semibold text-green-900 mb-2">Examples:</p>
                  <ul className="text-xs text-green-800 space-y-1 m-0 list-none p-0">
                    <li>• <strong>Session cookies:</strong> Keep you logged in while browsing</li>
                    <li>• <strong>Authentication tokens:</strong> Verify your identity securely</li>
                    <li>• <strong>Security cookies:</strong> Protect against fraud and unauthorized access</li>
                    <li>• <strong>Load balancing:</strong> Distribute traffic for optimal performance</li>
                  </ul>
                </div>
                <p className="text-xs text-green-700 mt-2 italic">
                  You cannot disable essential cookies as they are required for the platform to work.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900 m-0">Performance Cookies (Optional)</h3>
                </div>
                <p className="text-sm text-blue-800 mb-3">
                  These cookies help us understand how visitors use our platform by collecting anonymous statistical
                  data. This helps us improve performance and user experience.
                </p>
                <div className="bg-white/50 rounded p-3">
                  <p className="text-xs font-semibold text-blue-900 mb-2">Examples:</p>
                  <ul className="text-xs text-blue-800 space-y-1 m-0 list-none p-0">
                    <li>• <strong>Page visit tracking:</strong> Which pages are most popular</li>
                    <li>• <strong>Error monitoring:</strong> Identify and fix technical issues</li>
                    <li>• <strong>Load time analysis:</strong> Optimize page loading speed</li>
                    <li>• <strong>Feature usage:</strong> Understand which features are most used</li>
                  </ul>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-purple-900 m-0">Functional Cookies (Optional)</h3>
                </div>
                <p className="text-sm text-purple-800 mb-3">
                  These cookies remember your preferences and choices to provide enhanced, personalized features.
                </p>
                <div className="bg-white/50 rounded p-3">
                  <p className="text-xs font-semibold text-purple-900 mb-2">Examples:</p>
                  <ul className="text-xs text-purple-800 space-y-1 m-0 list-none p-0">
                    <li>• <strong>Language preference:</strong> Remember your language choice (English/Amharic)</li>
                    <li>• <strong>Recent searches:</strong> Show your recently searched routes</li>
                    <li>• <strong>Theme preference:</strong> Remember dark/light mode setting</li>
                    <li>• <strong>Form data:</strong> Pre-fill frequently used information</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 my-6">
              <p className="text-sm font-semibold text-green-900 mb-2">No Advertising Cookies</p>
              <p className="text-sm text-green-800">
                <strong>i-Ticket does NOT use advertising or tracking cookies.</strong> We do not track you across
                other websites, sell your data to advertisers, or display targeted advertisements based on your
                browsing history. Your privacy is important to us.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">3. Specific Cookies We Use</h2>
            <div className="bg-gray-50 p-4 rounded-md my-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Cookie Name</th>
                    <th className="text-left py-2 pr-4">Purpose</th>
                    <th className="text-left py-2 pr-4">Type</th>
                    <th className="text-left py-2">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono text-xs">next-auth.session-token</td>
                    <td className="py-2 pr-4">Keeps you logged in securely</td>
                    <td className="py-2 pr-4"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Essential</span></td>
                    <td className="py-2">30 days</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono text-xs">next-auth.csrf-token</td>
                    <td className="py-2 pr-4">Security protection against CSRF attacks</td>
                    <td className="py-2 pr-4"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Essential</span></td>
                    <td className="py-2">Session</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono text-xs">next-auth.callback-url</td>
                    <td className="py-2 pr-4">Redirects you after login</td>
                    <td className="py-2 pr-4"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Essential</span></td>
                    <td className="py-2">Session</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono text-xs">theme</td>
                    <td className="py-2 pr-4">Remembers dark/light mode preference</td>
                    <td className="py-2 pr-4"><span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">Functional</span></td>
                    <td className="py-2">1 year</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono text-xs">locale</td>
                    <td className="py-2 pr-4">Remembers language preference</td>
                    <td className="py-2 pr-4"><span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">Functional</span></td>
                    <td className="py-2">1 year</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">recent_searches</td>
                    <td className="py-2 pr-4">Shows your recent route searches</td>
                    <td className="py-2 pr-4"><span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">Functional</span></td>
                    <td className="py-2">30 days</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">4. How to Manage Cookies</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Browser Settings</h3>
            <p>
              Most web browsers allow you to control cookies through their settings. You can typically:
            </p>
            <ul>
              <li>View all cookies stored on your device</li>
              <li>Delete some or all cookies</li>
              <li>Block all cookies or only third-party cookies</li>
              <li>Set preferences for specific websites</li>
              <li>Receive alerts before cookies are set</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Browser-Specific Instructions</h3>
            <div className="bg-gray-50 p-4 rounded-md my-4">
              <ul className="space-y-2">
                <li><strong>Google Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
                <li><strong>Mozilla Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                <li><strong>Microsoft Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
                <li><strong>Mobile browsers:</strong> Settings → Privacy → Clear browsing data / Cookies</li>
              </ul>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-4">
              <p className="text-sm font-semibold text-amber-900 mb-2">Warning</p>
              <p className="text-sm text-amber-800">
                Disabling essential cookies will prevent you from using core features of i-Ticket such as logging in,
                making bookings, and processing payments. We recommend keeping essential cookies enabled.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">5. Local Storage and Similar Technologies</h2>
            <p>
              In addition to cookies, we may use other technologies to store data on your device:
            </p>
            <ul>
              <li><strong>Local Storage:</strong> Stores larger amounts of data (like cached trip data) that persists until cleared</li>
              <li><strong>Session Storage:</strong> Stores temporary data that is deleted when you close your browser tab</li>
              <li><strong>IndexedDB:</strong> Stores offline data for our Progressive Web App (PWA) functionality</li>
            </ul>
            <p className="mt-3">
              These technologies are used to improve performance, enable offline functionality, and enhance your user experience.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">6. Third-Party Cookies</h2>
            <p>
              We minimize the use of third-party cookies. Currently, the only third-party services that may set cookies are:
            </p>
            <ul>
              <li><strong>TeleBirr Payment:</strong> May set cookies during the payment process (governed by TeleBirr's cookie policy)</li>
            </ul>
            <p className="mt-3">
              We do NOT use:
            </p>
            <ul>
              <li>Google Analytics or similar tracking services</li>
              <li>Social media tracking pixels</li>
              <li>Advertising networks or retargeting services</li>
              <li>Cross-site tracking technologies</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">7. Updates to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other
              operational, legal, or regulatory reasons. We will notify you of significant changes by:
            </p>
            <ul>
              <li>Posting a notice on our website</li>
              <li>Updating the "Last Updated" date at the top of this policy</li>
              <li>Sending you an email notification (for significant changes)</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">8. Contact Us</h2>
            <p>
              If you have any questions about our use of cookies, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg my-4">
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-700">Email:</p>
                  <p className="text-primary">privacy@i-ticket.et</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Phone:</p>
                  <p>+251-91-123-4567</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Address:</p>
                  <p>i-Ticket Platform Services</p>
                  <p>Bole Road, Addis Ababa, Ethiopia</p>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-lg mt-8">
              <div className="flex items-center gap-2 mb-3">
                <Cookie className="h-5 w-5 text-primary" />
                <p className="font-semibold text-lg m-0">Your Cookie Choices</p>
              </div>
              <p className="text-sm">
                By continuing to use our platform, you consent to our use of essential cookies. You can manage
                optional cookies through your browser settings at any time. We respect your choices and are
                committed to providing a transparent experience.
              </p>
            </div>

            <div className="text-center text-xs text-muted-foreground mt-8 pt-6 border-t">
              <p>© 2024-2026 i-Ticket Platform Services. All rights reserved.</p>
              <p className="mt-2">Cookie Policy Version 1.0 | Effective Date: January 1, 2024 | Last Updated: February 4, 2026</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
