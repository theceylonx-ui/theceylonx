import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { UserPlus, MapPin, Handshake, PiggyBank, Users, Compass, Heart, Shield, Flag, Star, UserCheck, Route } from "lucide-react";
import logoImage from "@assets/5_1756417819316.png";
import backgroundImage from "@assets/11_1756417976014.png";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/auth/signin';
  };

  const handleSignUp = () => {
    window.location.href = '/auth/signin';
  };

  const handleBrowseTrips = () => {
    window.location.href = '/browse-trips';
  };

  const handlePostTrip = () => {
    window.location.href = '/post';
  };

  return (
    <div className="min-h-screen bg-ui-bg">
      {/* Navigation Header */}
      <nav className="bg-ui-bg shadow-sm sticky top-0 z-50 border-b border-ui-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src={logoImage} alt="Ceylon Expand Logo" className="h-8 w-8" data-testid="logo-icon" />
              <span className="text-xl font-bold text-text-primary" data-testid="logo-text">Ceylon Expand</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/browse-trips">
                <span className="text-text-secondary hover:text-brand transition-colors font-medium cursor-pointer" data-testid="nav-browse">Browse Trips</span>
              </Link>
              <Link href="/post">
                <span className="text-text-secondary hover:text-brand transition-colors font-medium cursor-pointer" data-testid="nav-post">Post a Trip</span>
              </Link>
              <Link href="/community">
                <span className="text-text-secondary hover:text-brand transition-colors font-medium cursor-pointer" data-testid="nav-community">CeylonX Tribes</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                onClick={handleLogin} 
                className="text-text-secondary hover:text-brand transition-colors"
                data-testid="button-signin"
              >
                Sign In
              </Button>
              <Button 
                onClick={handleSignUp} 
                className="bg-brand text-white hover:bg-brand-hover shadow-sm"
                data-testid="button-signup"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand to-info min-h-[500px] flex items-center">
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center text-white">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 mt-4 drop-shadow-2xl" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8), 1px 1px 4px rgba(0,0,0,0.6)' }} data-testid="hero-title">
            Travel Together.<br />Share the Journey.
          </h1>
          
          {/* Free to Use Badge */}
          <div className="mb-6 flex justify-center">
            <Badge 
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 text-sm font-semibold shadow-lg border-0 hover:from-green-600 hover:to-emerald-700 transition-all duration-200" 
              data-testid="free-badge"
            >
              Create your account — enjoy every feature, at zero cost.
            </Badge>
          </div>
          
          <p className="text-lg sm:text-xl md:text-2xl mb-8 max-w-3xl mx-auto px-4 drop-shadow-lg" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8), 0px 0px 2px rgba(0,0,0,0.6)' }} data-testid="hero-subtitle">
            Find rides, buddies, and unique experiences across Sri Lanka. Post your trip or join one today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Link href="/browse-trips">
              <Button 
                size="lg"
                className="bg-brand text-white hover:bg-brand-hover text-base sm:text-lg font-semibold transition-all duration-300 hover:shadow-2xl hover:scale-105 px-6 py-3"
                data-testid="button-browse-trips"
              >
                Browse Trips
              </Button>
            </Link>
            <Link href="/post">
              <Button 
                size="lg"
                className="bg-info text-white hover:bg-info/90 text-base sm:text-lg font-semibold transition-all duration-300 hover:shadow-2xl hover:scale-105 px-6 py-3"
                data-testid="button-post-trip"
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
              Get started with Ceylon Expand in just three simple steps.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center" data-testid="step-signup">
              <div className="bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <UserCheck className="text-green-600 h-12 w-12 stroke-2" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">1. Sign Up</h3>
              <p className="text-gray-600">Create your account with basic details and complete your profile to get started.</p>
            </div>
            
            <div className="text-center" data-testid="step-post-find">
              <div className="bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Route className="text-blue-600 h-12 w-12 stroke-2" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">2. Post/Find a Trip</h3>
              <p className="text-gray-600">Browse existing trips or create your own adventure and invite others to join.</p>
            </div>
            
            <div className="text-center" data-testid="step-travel">
              <div className="bg-ceylon-sand bg-opacity-30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Heart className="text-orange-600 h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">3. Travel Together</h3>
              <p className="text-gray-600">Connect with fellow travelers, share costs, and create unforgettable memories.</p>
            </div>
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
                <p className="text-gray-600">Discover hidden gems and local insights from experienced travelers and locals.</p>
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
      <Footer />
    </div>
  );
}
