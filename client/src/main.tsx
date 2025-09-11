import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initPerformanceOptimizations } from "./utils/performance";
import { initBrowserCompatibility } from "./utils/browser-compatibility";

// Initialize performance and browser compatibility optimizations
async function initializeApp() {
  // Initialize performance optimizations
  initPerformanceOptimizations();
  
  // Initialize browser compatibility features
  await initBrowserCompatibility();
  
  // Render the application
  createRoot(document.getElementById("root")!).render(<App />);
}

// Start the application
initializeApp().catch(console.error);
