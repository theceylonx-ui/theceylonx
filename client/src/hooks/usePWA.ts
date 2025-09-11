import { useState, useEffect, useCallback } from 'react';

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWACapabilities {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isServiceWorkerSupported: boolean;
  hasNotificationPermission: boolean;
  canShare: boolean;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check if app is installed
  useEffect(() => {
    const checkInstalled = () => {
      // Check for standalone display mode (iOS)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check for PWA installed flag
      const isInstalled = isStandalone || 
                         (window.navigator as any).standalone === true ||
                         document.referrer.includes('android-app://');
      setIsInstalled(isInstalled);
    };

    checkInstalled();
    window.addEventListener('appinstalled', checkInstalled);
    
    return () => {
      window.removeEventListener('appinstalled', checkInstalled);
    };
  }, []);

  // Handle network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          setServiceWorkerRegistration(registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, prompt user to refresh
                  if (window.confirm('New version available! Refresh to update?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });

      // Handle service worker controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error installing app:', error);
      return false;
    }
  }, [deferredPrompt]);

  const shareContent = useCallback(async (shareData: ShareData) => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (error) {
        console.error('Error sharing:', error);
        return false;
      }
    }
    return false;
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  const subscribeToNotifications = useCallback(async () => {
    if (!serviceWorkerRegistration) {
      return null;
    }

    try {
      const subscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY // You'll need to set this
      });
      
      // Send subscription to your server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      return null;
    }
  }, [serviceWorkerRegistration]);

  const getCapabilities = useCallback((): PWACapabilities => {
    return {
      isInstallable: !!deferredPrompt,
      isInstalled,
      isOnline,
      isServiceWorkerSupported: 'serviceWorker' in navigator,
      hasNotificationPermission: 'Notification' in window && Notification.permission === 'granted',
      canShare: 'share' in navigator
    };
  }, [deferredPrompt, isInstalled, isOnline]);

  return {
    capabilities: getCapabilities(),
    installApp,
    shareContent,
    requestNotificationPermission,
    subscribeToNotifications,
    serviceWorkerRegistration,
    isInstalled,
    isOnline,
    deferredPrompt
  };
}