import { useLocation, useRoute } from "wouter";
import { useCallback } from "react";

export function useReturn() {
  const [location, setLocation] = useLocation();
  const [, params] = useRoute("/post-trip");
  
  const getReturnPath = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const returnParam = urlParams.get("return");
    
    if (returnParam) {
      try {
        return decodeURIComponent(returnParam);
      } catch {
        return "/trips";
      }
    }
    
    return "/trips";
  }, []);
  
  const navigateBack = useCallback(() => {
    const returnPath = getReturnPath();
    setLocation(returnPath);
  }, [getReturnPath, setLocation]);
  
  const createReturnUrl = useCallback((basePath: string, currentPath?: string) => {
    const pathToEncode = currentPath || location;
    const encodedPath = encodeURIComponent(pathToEncode);
    return `${basePath}?return=${encodedPath}`;
  }, [location]);
  
  return {
    getReturnPath,
    navigateBack,
    createReturnUrl,
  };
}