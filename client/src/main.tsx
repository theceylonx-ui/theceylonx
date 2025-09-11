import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Simplified initialization - no async calls that might block
function initializeApp() {
  try {
    // Simple feature detection for critical needs only
    if (typeof window !== 'undefined') {
      // Add simple CSS classes for touch devices
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.documentElement.classList.add('touch-device');
      }
      
      // Add dark mode class if preferred
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark-preferred');
      }
    }
    
    // Render the application immediately
    createRoot(document.getElementById("root")!).render(<App />);
    
    // Optional: Load non-critical optimizations after app render
    setTimeout(() => {
      // Import and init performance optimizations in background (non-blocking)
      import("./utils/performance").then(({ initPerformanceOptimizations }) => {
        try {
          initPerformanceOptimizations();
        } catch (error) {
          console.warn('Performance optimizations failed:', error);
        }
      }).catch(() => {
        // Silently fail if performance utils don't load
      });
    }, 100);
    
  } catch (error) {
    console.error('App initialization error:', error);
    // Still try to render the app even if initialization fails
    createRoot(document.getElementById("root")!).render(<App />);
  }
}

// Start the application immediately
initializeApp();