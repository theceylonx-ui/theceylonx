import { useEffect, useState } from "react";
import logoImage from "@assets/5_1756417819316.png";

export function SriLankanLoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);

  const loadingMessages = [
    "Welcome to Ceylon Expand...",
    "Connecting travelers across Sri Lanka...",
    "Discovering beautiful destinations...",
    "Building travel communities...",
    "Almost ready for your journey..."
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % loadingMessages.length);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-ceylon-green/5 via-white to-ceylon-orange/5 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Lotus Petals */}
        <div className="absolute top-20 left-10 animate-float-slow">
          <div className="w-8 h-8 bg-ceylon-orange/20 rounded-full blur-sm"></div>
        </div>
        <div className="absolute top-40 right-16 animate-float-medium">
          <div className="w-6 h-6 bg-ceylon-green/30 rounded-full blur-sm"></div>
        </div>
        <div className="absolute bottom-32 left-20 animate-float-fast">
          <div className="w-10 h-10 bg-ceylon-blue/20 rounded-full blur-sm"></div>
        </div>
        <div className="absolute bottom-20 right-10 animate-float-slow">
          <div className="w-4 h-4 bg-ceylon-orange/25 rounded-full blur-sm"></div>
        </div>

        {/* Geometric Pattern Overlays */}
        <div className="absolute top-1/4 left-1/4 animate-pulse">
          <svg width="60" height="60" viewBox="0 0 60 60" className="text-ceylon-green/10">
            <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute bottom-1/4 right-1/4 animate-pulse delay-1000">
          <svg width="40" height="40" viewBox="0 0 40 40" className="text-ceylon-orange/15">
            <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="20" cy="20" r="10" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* Main Loading Content */}
      <div className="text-center z-10 max-w-md mx-auto px-6">
        {/* Animated Logo */}
        <div className="mb-8 relative">
          <div className="animate-bounce-gentle">
            <img 
              src={logoImage} 
              alt="Ceylon Expand" 
              className="h-16 w-16 mx-auto mb-4 drop-shadow-lg"
              data-testid="loading-logo"
            />
          </div>
          
          {/* Rotating Ring Around Logo */}
          <div className="absolute inset-0 -m-4">
            <div className="w-24 h-24 mx-auto border-2 border-ceylon-green/30 rounded-full animate-spin-slow border-dashed"></div>
          </div>
        </div>

        {/* App Title with Animation */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-ceylon-dark mb-2 animate-fade-in">
            Ceylon Expand
          </h1>
          <p className="text-lg text-ceylon-green font-medium animate-slide-up">
            Travel Together. Share the Journey.
          </p>
        </div>

        {/* Animated Loading Messages */}
        <div className="mb-8 h-6">
          <p 
            key={currentMessage}
            className="text-gray-600 text-sm animate-message-fade"
            data-testid="loading-message"
          >
            {loadingMessages[currentMessage]}
          </p>
        </div>

        {/* Progress Bar with Sri Lankan Colors */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-ceylon-green via-ceylon-orange to-ceylon-blue transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
              data-testid="loading-progress"
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{progress}% complete</p>
        </div>

        {/* Cultural Elements - Animated Peacock Feather Pattern */}
        <div className="flex justify-center space-x-2 opacity-30">
          <div className="w-2 h-2 bg-ceylon-blue rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-ceylon-green rounded-full animate-pulse delay-200"></div>
          <div className="w-2 h-2 bg-ceylon-orange rounded-full animate-pulse delay-400"></div>
          <div className="w-2 h-2 bg-ceylon-blue rounded-full animate-pulse delay-600"></div>
          <div className="w-2 h-2 bg-ceylon-green rounded-full animate-pulse delay-800"></div>
        </div>
      </div>

      {/* Bottom Wave Pattern */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" className="w-full h-16 text-ceylon-green/5">
          <path 
            d="M0,60 C150,100 350,0 600,60 C850,120 1050,20 1200,60 L1200,120 L0,120 Z" 
            fill="currentColor" 
            className="animate-wave"
          />
        </svg>
      </div>
    </div>
  );
}