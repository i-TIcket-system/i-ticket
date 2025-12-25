import Link from "next/link"
import Image from "next/image"
import { Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="i-Ticket"
                width={40}
                height={40}
                className="h-10 w-10 brightness-0 invert"
              />
              <span className="text-xl font-bold">
                <span className="text-primary">i</span>-Ticket
              </span>
            </Link>
            <p className="text-slate-400 text-sm">
              AI-driven ticketing platform providing seamless travel booking across Ethiopia.
            </p>
            <div className="flex gap-2">
              <div className="h-1 w-8 bg-green-500 rounded" />
              <div className="h-1 w-8 bg-yellow-500 rounded" />
              <div className="h-1 w-8 bg-red-500 rounded" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/search" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Find Trips
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-slate-400 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Bus Companies */}
          <div>
            <h3 className="font-semibold mb-4">Our Partners</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>Selam Bus</li>
              <li>Sky Bus</li>
              <li>Abay Bus</li>
              <li>Ghion Bus</li>
              <li>Awash Bus</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-slate-400 text-sm">
                <Phone className="h-4 w-4" />
                <span>+251 911 234 567</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400 text-sm">
                <Mail className="h-4 w-4" />
                <span>support@i-ticket.et</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400 text-sm">
                <MapPin className="h-4 w-4" />
                <span>Addis Ababa, Ethiopia</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} i-Ticket. All rights reserved.</p>
          <p className="mt-2">Built with love by Ethiopian entrepreneurs</p>
        </div>
      </div>
    </footer>
  )
}
