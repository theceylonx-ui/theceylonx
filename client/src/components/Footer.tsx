import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import logoImage from "@assets/5_1756417819316.png";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { SiTiktok } from "react-icons/si";

export default function Footer() {
  const { data: popularDestinations = [] } = useQuery<Array<{ destination: string; count: number }>>({
    queryKey: ['/api/popular-destinations'],
    queryFn: () => fetch('/api/popular-destinations').then(res => res.json()),
  });

  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Link href="/">
              <div className="flex items-center space-x-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity">
                <img src={logoImage} alt="Ceylon Expand Logo" className="h-6 w-6" />
                <span className="text-xl font-bold">Ceylon Expand</span>
              </div>
            </Link>
            <p className="text-gray-300 mb-4">Connect with fellow travelers and explore the beauty of Sri Lanka together.</p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/browse-trips"><span className="hover:text-ceylon-green transition-colors cursor-pointer">Browse Trips</span></Link></li>
              <li><Link href="/post"><span className="hover:text-ceylon-green transition-colors cursor-pointer">Post a Trip</span></Link></li>
              <li><Link href="/community"><span className="hover:text-ceylon-green transition-colors cursor-pointer">CeylonX Tribes</span></Link></li>
              <li><Link href="/faq"><span className="hover:text-ceylon-green transition-colors cursor-pointer">Help Center</span></Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Popular Destinations</h4>
            <ul className="space-y-2 text-gray-300">
              {popularDestinations.length > 0 ? (
                popularDestinations.slice(0, 5).map((dest, index) => (
                  <li key={index}>
                    <Link href={`/destination/${encodeURIComponent(dest.destination)}`}>
                      <span className="hover:text-ceylon-green transition-colors cursor-pointer">
                        {dest.destination} ({dest.count})
                      </span>
                    </Link>
                  </li>
                ))
              ) : (
                // Fallback destinations if no data available
                <>
                  <li><Link href="/destination/Colombo"><span className="hover:text-ceylon-green transition-colors cursor-pointer">Colombo</span></Link></li>
                  <li><Link href="/destination/Kandy"><span className="hover:text-ceylon-green transition-colors cursor-pointer">Kandy</span></Link></li>
                  <li><Link href="/destination/Galle"><span className="hover:text-ceylon-green transition-colors cursor-pointer">Galle</span></Link></li>
                  <li><Link href="/destination/Nuwara%20Eliya"><span className="hover:text-ceylon-green transition-colors cursor-pointer">Nuwara Eliya</span></Link></li>
                  <li><Link href="/destination/Sigiriya"><span className="hover:text-ceylon-green transition-colors cursor-pointer">Sigiriya</span></Link></li>
                </>
              )}
            </ul>
            
            {/* View More Button */}
            <div className="mt-4">
              <Link href="/browse-trips">
                <span className="text-sm text-gray-400 hover:text-ceylon-green transition-colors cursor-pointer border-b border-gray-400 hover:border-ceylon-green">
                  View more destinations →
                </span>
              </Link>
            </div>
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

        {/* Social Media Section */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-4">Follow us @theceylonx</p>
            <div className="flex justify-center items-center space-x-6">
              <div className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer group">
                <Facebook className="h-5 w-5 text-gray-300 group-hover:text-blue-400" />
              </div>
              <div className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer group">
                <Instagram className="h-5 w-5 text-gray-300 group-hover:text-pink-400" />
              </div>
              <div className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer group">
                <Twitter className="h-5 w-5 text-gray-300 group-hover:text-blue-400" />
              </div>
              <div className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer group">
                <SiTiktok className="h-5 w-5 text-gray-300 group-hover:text-red-400" />
              </div>
              <div className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer group">
                <Youtube className="h-5 w-5 text-gray-300 group-hover:text-red-500" />
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="text-center">
            <p className="text-gray-300">© 2025 Ceylon Expand. All rights reserved. Made with ❤️ for the tourists visiting Sri Lanka.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}