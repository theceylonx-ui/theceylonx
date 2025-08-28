import { Link } from "wouter";
import { Mountain } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Link href="/">
              <div className="flex items-center space-x-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity">
                <Mountain className="text-ceylon-green h-6 w-6" />
                <span className="text-xl font-bold">Ceylon Expand</span>
              </div>
            </Link>
            <p className="text-gray-300 mb-4">Connect with fellow travelers and explore the beauty of Sri Lanka together.</p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/browse"><span className="hover:text-ceylon-green transition-colors cursor-pointer">Browse Trips</span></Link></li>
              <li><Link href="/post"><span className="hover:text-ceylon-green transition-colors cursor-pointer">Post a Trip</span></Link></li>
              <li><Link href="/community"><span className="hover:text-ceylon-green transition-colors cursor-pointer">CeylonX Tribes</span></Link></li>
              <li><Link href="/faq"><span className="hover:text-ceylon-green transition-colors cursor-pointer">Help Center</span></Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Popular Destinations</h4>
            <ul className="space-y-2 text-gray-300">
              <li><span className="hover:text-ceylon-green transition-colors cursor-pointer">Colombo</span></li>
              <li><span className="hover:text-ceylon-green transition-colors cursor-pointer">Kandy</span></li>
              <li><span className="hover:text-ceylon-green transition-colors cursor-pointer">Galle</span></li>
              <li><span className="hover:text-ceylon-green transition-colors cursor-pointer">Nuwara Eliya</span></li>
              <li><span className="hover:text-ceylon-green transition-colors cursor-pointer">Sigiriya</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/safety-guidelines"><span className="hover:text-ceylon-green transition-colors cursor-pointer">Safety Guidelines</span></Link></li>
              <li><Link href="/terms-of-service"><span className="hover:text-ceylon-green transition-colors cursor-pointer">Terms of Service</span></Link></li>
              <li><Link href="/privacy-policy"><span className="hover:text-ceylon-green transition-colors cursor-pointer">Privacy Policy</span></Link></li>
              <li><Link href="/contact-us"><span className="hover:text-ceylon-green transition-colors cursor-pointer">Contact Us</span></Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">© 2025 Ceylon Expand. All rights reserved. Made with ❤️ for the tourist visiting Sri Lanka.</p>
        </div>
      </div>
    </footer>
  );
}