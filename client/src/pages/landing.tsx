import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { UserPlus, MapPin, Handshake, PiggyBank, Users, Compass, Heart, Shield, Flag, Star, UserCheck, Route, Menu, X } from "lucide-react";
import newLogo from "@assets/hibowan-pin-hi-mark.svg";
import { SEO, SEOConfigs } from "@/components/SEO";

export default function Landing() {
  // Fetch dynamic background image setting with fallback
  const { data: backgroundSetting } = useQuery({
    queryKey: ['/api/site-settings/landing_background_image'],
    queryFn: () => fetch('/api/site-settings/landing_background_image').then(res => 
      res.ok ? res.json() : null
    ).catch(() => null),
    retry: false, // Don't retry on failure
    refetchOnWindowFocus: false,
  });

  // Fallback to alternative background_image setting if primary setting fails
  const { data: fallbackBackgroundSetting } = useQuery({
    queryKey: ['/api/site-settings/background_image'],
    queryFn: () => fetch('/api/site-settings/background_image').then(res => 
      res.ok ? res.json() : null
    ).catch(() => null),
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !backgroundSetting?.value, // Only fetch if primary setting is not available
  });

  const FALLBACK_HERO = 'https://images.unsplash.com/photo-1562602833-0f4ab2fc46e3?w=1600&q=80';
  const backgroundImage = backgroundSetting?.value || fallbackBackgroundSetting?.value || FALLBACK_HERO;

  const handleLogin = () => {
    window.location.href = '/auth/signin';
  };

  const handleSignUp = () => {
    window.location.href = '/auth/signin';
  };

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <SEO 
        {...SEOConfigs.home}
        ogUrl={typeof window !== 'undefined' ? window.location.href : 'https://www.hibowan.com'}
        ogImage={backgroundImage || undefined}
      />
      <div className="min-h-screen bg-ui-bg">
      {/* Navigation Header */}
      <header role="banner">
        <nav 
          className="bg-ui-bg shadow-sm sticky top-0 z-50 border-b border-ui-line" 
          role="navigation" 
          aria-label="Main navigation"
          id="navigation"
          data-testid="main-navigation"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <Link href="/">
                  <div 
                    className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-ui-bg rounded-md p-1"
                    role="link"
                    aria-label="HiBowan homepage"
                    data-testid="header-logo-link"
                  >
                    <img 
                      src={newLogo} 
                      alt="HiBowan Logo"
                      className="h-8 w-8"
                      width="32"
                      height="32"
                      loading="eager"
                      data-testid="logo-icon"
                    />
                    <span className="text-xl font-bold text-text-primary" data-testid="logo-text">HiBowan</span>
                  </div>
                </Link>
              </div>
              <div className="hidden md:flex items-center space-x-6" role="menubar">
                <Link href="/browse-trips">
                  <span 
                    className="text-text-secondary hover:text-brand transition-colors font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-ui-bg rounded-md px-2 py-1" 
                    data-testid="nav-browse"
                    role="menuitem"
                    tabIndex={0}
                    aria-label="Browse available trips"
                  >
                    Browse Trips
                  </span>
                </Link>
                <Link href="/post">
                  <span 
                    className="text-text-secondary hover:text-brand transition-colors font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-ui-bg rounded-md px-2 py-1" 
                    data-testid="nav-post"
                    role="menuitem"
                    tabIndex={0}
                    aria-label="Post a new trip"
                  >
                    Post a Trip
                  </span>
                </Link>
                <Link href="/community">
                  <span 
                    className="text-text-secondary hover:text-brand transition-colors font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-ui-bg rounded-md px-2 py-1" 
                    data-testid="nav-community"
                    role="menuitem"
                    tabIndex={0}
                    aria-label="Join HiBowan travel community"
                  >
                    HiBowan Tribes
                  </span>
                </Link>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  onClick={handleLogin}
                  className="hidden md:inline-flex text-text-secondary hover:text-brand transition-colors touch-target"
                  data-testid="button-signin"
                  aria-label="Sign in to your account"
                >
                  Sign In
                </Button>
                <Button
                  onClick={handleSignUp}
                  className="hidden md:inline-flex bg-brand text-white hover:bg-brand-hover shadow-sm touch-target"
                  data-testid="button-signup"
                  aria-label="Create a new account"
                >
                  Sign Up
                </Button>
                <button
                  className="md:hidden p-2 text-text-secondary hover:text-brand transition-colors"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-label="Toggle mobile menu"
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden border-t border-ui-line bg-ui-bg px-4 py-4 space-y-3">
              <Link href="/browse-trips">
                <div className="block py-2 text-text-secondary hover:text-brand font-medium" onClick={() => setMobileOpen(false)}>Browse Trips</div>
              </Link>
              <Link href="/post">
                <div className="block py-2 text-text-secondary hover:text-brand font-medium" onClick={() => setMobileOpen(false)}>Post a Trip</div>
              </Link>
              <Link href="/community">
                <div className="block py-2 text-text-secondary hover:text-brand font-medium" onClick={() => setMobileOpen(false)}>HiBowan Tribes</div>
              </Link>
              <Link href="/about">
                <div className="block py-2 text-text-secondary hover:text-brand font-medium" onClick={() => setMobileOpen(false)}>About</div>
              </Link>
              <div className="pt-2 flex flex-col gap-2">
                <Button variant="ghost" onClick={handleLogin} className="w-full justify-start text-text-secondary hover:text-brand">Sign In</Button>
                <Button onClick={handleSignUp} className="w-full bg-brand text-white hover:bg-brand-hover">Sign Up</Button>
              </div>
            </div>
          )}
        </nav>
      </header>
      {/* Hero Section */}
      <main role="main" id="main-content" tabIndex={-1}>
        <section 
          className="relative bg-gradient-to-br from-brand to-info min-h-[500px] flex items-center"
          aria-label="Hero section - Find travel companions in Sri Lanka"
          data-testid="hero-section"
        >
          <div className="absolute inset-0 bg-black opacity-60" aria-hidden="true"></div>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            aria-hidden="true"
            role="img"
            aria-label="Beautiful landscape of Sri Lanka showing travel destinations"
          ></div>
          
          <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center text-white">
            <p
              className="italic font-medium text-xl sm:text-2xl mb-3 drop-shadow-lg"
              style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}
              data-testid="hero-kicker"
            >
              Explore Together.
            </p>
            <h1
              className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 drop-shadow-2xl"
              style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8), 1px 1px 4px rgba(0,0,0,0.6)' }}
              data-testid="hero-title"
              id="page-title"
            >
              Find fellow travellers<br />heading your way.
            </h1>

            <div className="mb-6 flex justify-center" role="banner" aria-label="Trust statement">
              <Badge
                className="bg-white/15 backdrop-blur-sm text-white px-4 py-2 text-sm font-semibold shadow-lg border border-white/20"
                data-testid="free-badge"
                role="status"
                aria-live="polite"
              >
                No bookings. No commissions. You arrange everything directly.
              </Badge>
            </div>

            <p
              className="sm:text-xl md:text-2xl mb-8 max-w-3xl mx-auto px-4 drop-shadow-lg text-[27px]"
              style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8), 0px 0px 2px rgba(0,0,0,0.6)' }}
              data-testid="hero-subtitle"
              role="text"
              aria-describedby="page-title"
            >Post the trip you're planning, or find one already forming.
            HiBowan connects foreigners exploring Sri Lanka at the same time.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4" role="group" aria-label="Main action buttons">
              <Link href="/browse-trips">
                <Button 
                  size="lg"
                  className="bg-brand text-white hover:bg-brand-hover text-base sm:text-lg font-semibold transition-all duration-300 hover:shadow-2xl hover:scale-105 px-6 py-3 touch-target"
                  data-testid="button-browse-trips"
                  aria-label="Browse available trips and find travel companions"
                >
                  Browse Trips
                </Button>
              </Link>
              <Link href="/post">
                <Button 
                  size="lg"
                  className="bg-info text-white hover:bg-info/90 text-base sm:text-lg font-semibold transition-all duration-300 hover:shadow-2xl hover:scale-105 px-6 py-3 touch-target"
                  data-testid="button-post-trip"
                  aria-label="Post your trip and find travel companions"
                >
                Post a Trip
              </Button>
            </Link>
          </div>
        </div>
      </section>
      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4" data-testid="text-how-it-works-title">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" data-testid="text-how-it-works-subtitle">
              Get started with HiBowan in just three simple steps.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center" data-testid="step-signup">
              <div className="bg-brand-subtle rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Route className="text-brand h-10 w-10 stroke-2" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">1. Post or browse a trip</h3>
              <p className="text-gray-600">Share where you're headed, or find a Quick Trip or Detailed Trip already forming near your route.</p>
            </div>

            <div className="text-center" data-testid="step-post-find">
              <div className="bg-accent-subtle rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <UserCheck className="text-accent h-12 w-12 stroke-2" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">2. Organizer accepts</h3>
              <p className="text-gray-600">Send a request to join. The trip organizer decides who joins — that's what keeps it safe.</p>
            </div>

            <div className="text-center" data-testid="step-travel">
              <div className="bg-brand-subtle rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Heart className="text-brand h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">3. Coordinate directly</h3>
              <p className="text-gray-600">Once accepted, chat unlocks. From there, you and your fellow travellers arrange everything yourselves.</p>
            </div>
          </div>
        </div>
      </section>
      {/* Launch Route Clusters */}
      <section className="py-16 bg-white" data-testid="section-route-clusters">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Where people are going first
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              HiBowan launches with three route clusters — the trips most travellers are already piecing together.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-accent hover:shadow-md transition-shadow" data-testid="card-route-galle">
              <CardContent className="p-8">
                <MapPin className="text-accent h-8 w-8 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Colombo → Galle → Ella</h3>
                <p className="text-gray-600 text-sm">Coast to hill country, the classic south-west loop.</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-brand hover:shadow-md transition-shadow" data-testid="card-route-arugam">
              <CardContent className="p-8">
                <MapPin className="text-brand h-8 w-8 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Ella → Arugam Bay</h3>
                <p className="text-gray-600 text-sm">Hill country down to the east coast surf season.</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent hover:shadow-md transition-shadow" data-testid="card-route-safari">
              <CardContent className="p-8">
                <MapPin className="text-accent h-8 w-8 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Yala → Udawalawe</h3>
                <p className="text-gray-600 text-sm">Two-park safari runs in the south.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4" data-testid="text-benefits-title">
              Why Join Us?
            </h2>
            <p className="text-lg text-gray-600" data-testid="text-benefits-subtitle">
              Discover the benefits of traveling together.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-md transition-shadow" data-testid="card-save-money">
              <CardContent className="p-8">
                <PiggyBank className="text-ceylon-green h-10 w-10 mb-6" />
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Save Money</h3>
                <p className="text-gray-600">Split transportation costs with fellow travelers and make your adventures more affordable.</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow" data-testid="card-meet-friends">
              <CardContent className="p-8">
                <Users className="text-ceylon-blue h-10 w-10 mb-6" />
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Meet New Friends</h3>
                <p className="text-gray-600">Connect with like-minded travelers and build lasting friendships through shared experiences.</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow" data-testid="card-explore-more">
              <CardContent className="p-8">
                <Compass className="text-orange-600 h-10 w-10 mb-6" />
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Explore More</h3>
                <p className="text-gray-600">Discover hidden gems and local insights shared by experienced fellow travelers.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* House Rules Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4" data-testid="text-house-rules-title">
              House Rules
            </h2>
            <p className="text-lg text-gray-600" data-testid="text-house-rules-subtitle">
              Let's keep our community safe and friendly
            </p>
          </div>

          <div className="bg-gradient-to-br from-ceylon-green/10 to-ceylon-blue/10 rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3" data-testid="rule-respectful">
                  <Heart className="text-ceylon-green mt-1 h-5 w-5 flex-shrink-0" />
                  <p className="text-gray-700"><strong>Be respectful to others</strong> - Treat everyone with kindness and courtesy.</p>
                </div>
                <div className="flex items-start space-x-3" data-testid="rule-public-places">
                  <MapPin className="text-ceylon-blue mt-1 h-5 w-5 flex-shrink-0" />
                  <p className="text-gray-700"><strong>Meet in public places</strong> - Always arrange meetups in safe, public locations.</p>
                </div>
                <div className="flex items-start space-x-3" data-testid="rule-no-advance-payment">
                  <Shield className="text-orange-600 mt-1 h-5 w-5 flex-shrink-0" />
                  <p className="text-gray-700"><strong>Don't pay strangers in advance</strong> - Keep payments secure and transparent.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3" data-testid="rule-report-suspicious">
                  <Flag className="text-red-500 mt-1 h-5 w-5 flex-shrink-0" />
                  <p className="text-gray-700"><strong>Report suspicious posts</strong> - Help us maintain a safe community.</p>
                </div>
                <div className="flex items-start space-x-3" data-testid="rule-honest-details">
                  <Star className="text-yellow-500 mt-1 h-5 w-5 flex-shrink-0" />
                  <p className="text-gray-700"><strong>Share honest trip details</strong> - Be accurate about costs, timing, and expectations.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
      <Footer />
      </div>
    </>
  );
}
