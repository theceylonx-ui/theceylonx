import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    wasOffline: false,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const wasOffline = !networkStatus.isOnline;
      const isOnline = navigator.onLine;
      
      // Get connection info if available
      const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

      const newStatus: NetworkStatus = {
        isOnline,
        wasOffline: wasOffline && isOnline, // Just came back online
        downlink: connection?.downlink,
        effectiveType: connection?.effectiveType,
        rtt: connection?.rtt,
      };

      setNetworkStatus(newStatus);

      // Show toast notifications for network changes
      if (wasOffline && isOnline) {
        toast({
          title: "Back Online",
          description: "Your connection has been restored.",
          duration: 3000,
        });
      } else if (!isOnline && networkStatus.isOnline) {
        toast({
          title: "Connection Lost",
          description: "You're now offline. Some features may not work.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to connection changes if supported
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    // Initial status update
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, [networkStatus.isOnline]);

  return networkStatus;
}

// Hook for detecting if the app should work in offline mode
export function useOfflineMode() {
  const networkStatus = useNetworkStatus();
  
  const isOfflineMode = !networkStatus.isOnline;
  const hasSlowConnection = networkStatus.effectiveType === 'slow-2g' || 
                          networkStatus.effectiveType === '2g';
  const shouldOptimizeForSpeed = hasSlowConnection || isOfflineMode;

  return {
    isOffline: isOfflineMode,
    hasSlowConnection,
    shouldOptimizeForSpeed,
    connectionType: networkStatus.effectiveType || 'unknown',
    networkQuality: networkStatus.downlink ? 
      (networkStatus.downlink > 10 ? 'high' : 
       networkStatus.downlink > 1 ? 'medium' : 'low') : 'unknown'
  };
}