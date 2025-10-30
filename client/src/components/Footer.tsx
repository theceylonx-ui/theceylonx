import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import logoImage56 from "@assets/logo-56.png";
import logoImage112 from "@assets/logo-112.png";
import logoWebp56 from "@assets/logo-56.webp";
import logoWebp112 from "@assets/logo-112.webp";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { SiTiktok } from "react-icons/si";

export default function Footer() {
  const { data: popularDestinations = [] } = useQuery<Array<{ destination: string; count: number }>>({
    queryKey: ['/api/popular-destinations'],
    queryFn: () => fetch('/api/popular-destinations').then(res => res.json()),
  });

  return (
    <footer 
      className="bg-gray-800 text-white py-12" 
      role="contentinfo" 
      aria-label="Site footer"
      id="footer"
      data-testid="footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Link href="/">
              <div 
                className="flex items-center space-x-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded-md p-1"
                aria-label="Ceylon Expand homepage"
                data-testid="footer-logo-link"
              >
                <picture>
                  <source 
                    type="image/webp" 
                    srcSet={`${logoWebp56} 1x, ${logoWebp112} 2x`}
                  />
                  <img 
                    src={logoImage56} 
                    srcSet={`${logoImage56} 1x, ${logoImage112} 2x`}
                    alt="Ceylon Expand Logo" 
                    className="h-6 w-6"
                    width="24"
                    height="24"
                    loading="lazy"
                  />
                </picture>
                <span className="text-xl font-bold">Ceylon Expand</span>
              </div>
            </Link>
            <p className="text-gray-300 mb-4">Connect with fellow travelers and explore the beauty of Sri Lanka together.</p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4" id="quick-links-heading">Quick Links</h4>
            <nav aria-labelledby="quick-links-heading">
              <ul className="space-y-2 text-gray-300" role="list">
                <li>
                  <Link href="/browse-trips">
                    <span 
                      className="hover:text-ceylon-green transition-colors cursor-pointer focus:outline-none focus:underline focus:text-ceylon-green"
                      data-testid="footer-link-browse"
                      tabIndex={0}
                    >
                      Browse Trips
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/post">
                    <span 
                      className="hover:text-ceylon-green transition-colors cursor-pointer focus:outline-none focus:underline focus:text-ceylon-green"
                      data-testid="footer-link-post"
                      tabIndex={0}
                    >
                      Post a Trip
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/community">
                    <span 
                      className="hover:text-ceylon-green transition-colors cursor-pointer focus:outline-none focus:underline focus:text-ceylon-green"
                      data-testid="footer-link-community"
                      tabIndex={0}
                    >
                      CeylonX Tribes
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/faq">
                    <span 
                      className="hover:text-ceylon-green transition-colors cursor-pointer focus:outline-none focus:underline focus:text-ceylon-green"
                      data-testid="footer-link-help"
                      tabIndex={0}
                    >
                      Help Center
                    </span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4" id="destinations-heading">Popular Destinations</h4>
            <nav aria-labelledby="destinations-heading">
              <ul className="space-y-2 text-gray-300" role="list">
                {popularDestinations.length > 0 ? (
                  popularDestinations.slice(0, 5).map((dest, index) => (
                    <li key={index}>
                      <Link href={`/destination/${encodeURIComponent(dest.destination)}`}>
                        <span 
                          className="hover:text-ceylon-green transition-colors cursor-pointer focus:outline-none focus:underline focus:text-ceylon-green"
                          data-testid={`footer-destination-${dest.destination.toLowerCase().replace(/\s+/g, '-')}`}
                          tabIndex={0}
                          aria-label={`Browse trips to ${dest.destination}, ${dest.count} trips available`}
                        >
                          {dest.destination} ({dest.count})
                        </span>
                      </Link>
                    </li>
                  ))
                ) : (
                  // Fallback destinations if no data available
                  <>
                    <li><Link href="/destination/Colombo"><span className="hover:text-ceylon-green transition-colors cursor-pointer focus:outline-none focus:underline focus:text-ceylon-green" tabIndex={0} data-testid="footer-destination-colombo">Colombo</span></Link></li>
                    <li><Link href="/destination/Kandy"><span className="hover:text-ceylon-green transition-colors cursor-pointer focus:outline-none focus:underline focus:text-ceylon-green" tabIndex={0} data-testid="footer-destination-kandy">Kandy</span></Link></li>
                    <li><Link href="/destination/Galle"><span className="hover:text-ceylon-green transition-colors cursor-pointer focus:outline-none focus:underline focus:text-ceylon-green" tabIndex={0} data-testid="footer-destination-galle">Galle</span></Link></li>
                    <li><Link href="/destination/Nuwara%20Eliya"><span className="hover:text-ceylon-green transition-colors cursor-pointer focus:outline-none focus:underline focus:text-ceylon-green" tabIndex={0} data-testid="footer-destination-nuwara-eliya">Nuwara Eliya</span></Link></li>
                    <li><Link href="/destination/Sigiriya"><span className="hover:text-ceylon-green transition-colors cursor-pointer focus:outline-none focus:underline focus:text-ceylon-green" tabIndex={0} data-testid="footer-destination-sigiriya">Sigiriya</span></Link></li>
                  </>
                )}
              </ul>
              
              {/* View More Button */}
              <div className="mt-4">
                <Link href="/browse-trips">
                  <span 
                    className="text-sm text-gray-400 hover:text-ceylon-green transition-colors cursor-pointer border-b border-gray-400 hover:border-ceylon-green focus:outline-none focus:text-ceylon-green focus:border-ceylon-green"
                    data-testid="footer-view-more-destinations"
                    tabIndex={0}
                    aria-label="View more destinations and browse all trips"
                  >
                    View more destinations →
                  </span>
                </Link>
              </div>
            </nav>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4" id="support-heading">Support</h4>
            <nav aria-labelledby="support-heading">
              <ul className="space-y-2 text-gray-300" role="list">
                <li>
                  <Link href="/safety-guidelines">
                    <span 
                      className="hover:text-ceylon-green transition-colors cursor-pointer focus:outline-none focus:underline focus:text-ceylon-green"
                      data-testid="footer-link-safety"
                      tabIndex={0}
                    >
                      Safety Guidelines
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service">
                    <span 
                      className="hover:text-ceylon-green transition-colors cursor-pointer focus:outline-none focus:underline focus:text-ceylon-green"
                      data-testid="footer-link-terms"
                      tabIndex={0}
                    >
                      Terms of Service
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy">
                    <span 
                      className="hover:text-ceylon-green transition-colors cursor-pointer focus:outline-none focus:underline focus:text-ceylon-green"
                      data-testid="footer-link-privacy"
                      tabIndex={0}
                    >
                      Privacy Policy
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/contact-us">
                    <span 
                      className="hover:text-ceylon-green transition-colors cursor-pointer focus:outline-none focus:underline focus:text-ceylon-green"
                      data-testid="footer-link-contact"
                      tabIndex={0}
                    >
                      Contact Us
                    </span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-4">Follow us @theceylonx</p>
            <nav aria-label="Social media links">
              <div className="flex justify-center items-center space-x-6" role="list">
                <button 
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-700 touch-target"
                  aria-label="Follow Ceylon Expand on Facebook"
                  data-testid="social-facebook"
                  onClick={() => window.open('https://facebook.com/theceylonx', '_blank', 'noopener,noreferrer')}
                >
                  <Facebook className="h-5 w-5 text-gray-300 group-hover:text-blue-400" aria-hidden="true" />
                </button>
                <button 
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-700 touch-target"
                  aria-label="Follow Ceylon Expand on Instagram"
                  data-testid="social-instagram"
                  onClick={() => window.open('https://instagram.com/theceylonx', '_blank', 'noopener,noreferrer')}
                >
                  <Instagram className="h-5 w-5 text-gray-300 group-hover:text-pink-400" aria-hidden="true" />
                </button>
                <button 
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-700 touch-target"
                  aria-label="Follow Ceylon Expand on Twitter"
                  data-testid="social-twitter"
                  onClick={() => window.open('https://twitter.com/theceylonx', '_blank', 'noopener,noreferrer')}
                >
                  <Twitter className="h-5 w-5 text-gray-300 group-hover:text-blue-400" aria-hidden="true" />
                </button>
                <button 
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-700 touch-target"
                  aria-label="Follow Ceylon Expand on TikTok"
                  data-testid="social-tiktok"
                  onClick={() => window.open('https://tiktok.com/@theceylonx', '_blank', 'noopener,noreferrer')}
                >
                  <SiTiktok className="h-5 w-5 text-gray-300 group-hover:text-red-400" aria-hidden="true" />
                </button>
                <button 
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-700 touch-target"
                  aria-label="Follow Ceylon Expand on YouTube"
                  data-testid="social-youtube"
                  onClick={() => window.open('https://youtube.com/@theceylonx', '_blank', 'noopener,noreferrer')}
                >
                  <Youtube className="h-5 w-5 text-gray-300 group-hover:text-red-500" aria-hidden="true" />
                </button>
              </div>
            </nav>
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