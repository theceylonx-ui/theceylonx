// 🚀 PERFORMANCE: Optimized lazy loading image component
import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallback?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean; // For above-the-fold images
  quality?: number; // For future image optimization service
  sizes?: string; // Responsive sizes
  loading?: 'lazy' | 'eager';
}

export function LazyImage({
  src,
  alt,
  className,
  width,
  height,
  fallback = '/assets/placeholder.jpg',
  placeholder,
  onLoad,
  onError,
  priority = false,
  quality = 75,
  sizes,
  loading = 'lazy'
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Preload critical images
  useEffect(() => {
    if (priority) {
      setImageSrc(src);
      return;
    }

    // Use Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observerRef.current?.disconnect();
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '50px' // Start loading 50px before image comes into view
        }
      );

      if (imgRef.current) {
        observerRef.current.observe(imgRef.current);
      }
    } else {
      // Fallback for browsers without IntersectionObserver
      setImageSrc(src);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, priority]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setIsLoaded(true);
    setIsError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setIsError(true);
    setIsLoaded(false);
    if (fallback && imageSrc !== fallback) {
      setImageSrc(fallback);
    }
    onError?.();
  }, [fallback, imageSrc, onError]);

  // Generate responsive srcSet for future optimization
  const generateSrcSet = (baseSrc: string): string => {
    // This could be enhanced to work with an image optimization service
    const extensions = ['webp', 'jpg'];
    const sizes = [320, 640, 960, 1280];
    
    return sizes
      .map(size => `${baseSrc}?w=${size}&q=${quality} ${size}w`)
      .join(', ');
  };

  return (
    <div 
      ref={imgRef}
      className={cn(
        'relative overflow-hidden',
        className
      )}
      style={{ width, height }}
    >
      {/* Placeholder while loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          {placeholder || (
            <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse" />
          )}
        </div>
      )}

      {/* Main image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            isError && 'opacity-50',
            className
          )}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
          Failed to load image
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && imageSrc && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
    </div>
  );
}

// Optimized image component for trip cards
export function TripImage({ trip, className, ...props }: {
  trip: { id: string; imageUrl?: string; title: string; category?: string };
  className?: string;
} & Omit<LazyImageProps, 'src' | 'alt'>) {
  // Generate optimized image URL based on category
  const getOptimizedImageUrl = (trip: typeof trip): string => {
    if (trip.imageUrl) {
      return trip.imageUrl;
    }
    
    // Use category-based fallback images
    const categoryImages = {
      'beach': '/assets/category/beach-default.jpg',
      'hiking': '/assets/category/hiking-default.jpg',
      'culture': '/assets/category/culture-default.jpg',
      'roadtrip': '/assets/category/roadtrip-default.jpg',
      'wellness': '/assets/category/wellness-default.jpg',
      'adventure_sport': '/assets/category/adventure-default.jpg',
      'wildlife': '/assets/category/wildlife-default.jpg',
      'food': '/assets/category/food-default.jpg',
      'festival': '/assets/category/festival-default.jpg',
      'workshop': '/assets/category/workshop-default.jpg'
    };
    
    return categoryImages[trip.category as keyof typeof categoryImages] || '/assets/category/default-trip.jpg';
  };

  return (
    <LazyImage
      src={getOptimizedImageUrl(trip)}
      alt={trip.title}
      className={cn('aspect-video rounded-lg', className)}
      fallback="/assets/category/default-trip.jpg"
      {...props}
    />
  );
}

// Performance: Preload critical images
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url => 
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = url;
      })
    )
  );
}

// Hook for managing image loading performance
export function useImagePerformance() {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const markImageLoaded = useCallback((src: string) => {
    setLoadedImages(prev => new Set([...prev, src]));
  }, []);

  const markImageFailed = useCallback((src: string) => {
    setFailedImages(prev => new Set([...prev, src]));
  }, []);

  const isImageLoaded = useCallback((src: string) => {
    return loadedImages.has(src);
  }, [loadedImages]);

  const isImageFailed = useCallback((src: string) => {
    return failedImages.has(src);
  }, [failedImages]);

  return {
    markImageLoaded,
    markImageFailed,
    isImageLoaded,
    isImageFailed,
    loadedImagesCount: loadedImages.size,
    failedImagesCount: failedImages.size
  };
}