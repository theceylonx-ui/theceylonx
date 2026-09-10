// 🚀 PHASE 4: SEO and meta tags optimization
import { useEffect } from 'react';

interface SEOProps {
  // Basic meta tags
  title: string;
  description: string;
  keywords?: string;
  
  // Open Graph tags
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article' | 'profile';
  
  // Twitter/X card tags
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  
  // Additional meta tags
  canonical?: string;
  robots?: string;
  author?: string;
  
  // Structured data
  structuredData?: object;
}

export function SEO({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  twitterSite = '@hibowan.srilanka',
  twitterCreator,
  canonical,
  robots = 'index, follow',
  author,
  structuredData,
}: SEOProps) {
  useEffect(() => {
    // Set document title
    document.title = title;
    
    // Helper function to update meta tag
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        if (property) {
          element.setAttribute('property', name);
        } else {
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };
    
    // Update basic meta tags
    updateMetaTag('description', description);
    if (keywords) updateMetaTag('keywords', keywords);
    if (author) updateMetaTag('author', author);
    updateMetaTag('robots', robots);
    
    // Update Open Graph tags
    updateMetaTag('og:title', ogTitle || title, true);
    updateMetaTag('og:description', ogDescription || description, true);
    updateMetaTag('og:type', ogType, true);
    
    if (ogImage) {
      updateMetaTag('og:image', ogImage, true);
      updateMetaTag('og:image:alt', ogTitle || title, true);
    }
    
    if (ogUrl) {
      updateMetaTag('og:url', ogUrl, true);
    }
    
    // Update Twitter/X card tags
    updateMetaTag('twitter:card', twitterCard);
    updateMetaTag('twitter:site', twitterSite);
    if (twitterCreator) updateMetaTag('twitter:creator', twitterCreator);
    updateMetaTag('twitter:title', ogTitle || title);
    updateMetaTag('twitter:description', ogDescription || description);
    if (ogImage) updateMetaTag('twitter:image', ogImage);
    
    // Set canonical URL
    if (canonical) {
      let linkElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'canonical');
        document.head.appendChild(linkElement);
      }
      
      linkElement.setAttribute('href', canonical);
    }
    
    // Add structured data
    if (structuredData) {
      const jsonLdId = 'structured-data-script';
      let scriptElement = document.getElementById(jsonLdId) as HTMLScriptElement;
      
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.id = jsonLdId;
        scriptElement.type = 'application/ld+json';
        document.head.appendChild(scriptElement);
      }
      
      scriptElement.textContent = JSON.stringify(structuredData);
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Note: We don't remove meta tags on unmount as they should persist
      // until the next page loads and replaces them
    };
  }, [
    title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl, ogType,
    twitterCard, twitterSite, twitterCreator, canonical, robots, author, structuredData
  ]);
  
  return null; // This component renders nothing visible
}

// Predefined SEO configurations for common pages
export const SEOConfigs = {
  home: {
    title: 'HiBowan - Connect with Travel Buddies in Sri Lanka',
    description: 'Find travel companions and share amazing journeys across Sri Lanka. Connect with like-minded travelers, split costs, and explore the pearl of the Indian Ocean together.',
    keywords: 'sri lanka travel, travel buddies, travel companions, car sharing, trip sharing, ceylon travel, sri lanka tourism',
    ogImage: 'https://www.hibowan.com/hibowan-hero-share.jpg',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'HiBowan',
      'description': 'Travel buddy and trip sharing platform for Sri Lanka',
      'url': 'https://www.hibowan.com',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': 'https://www.hibowan.com/search?q={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }
    }
  },
  
  browse: {
    title: 'Browse Travel Opportunities - HiBowan',
    description: 'Discover amazing travel opportunities across Sri Lanka. From Colombo to Kandy, beach trips to mountain adventures - find your perfect travel match.',
    keywords: 'browse trips sri lanka, travel opportunities, kandy trips, colombo travel, beach trips sri lanka',
    ogImage: 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=1200&q=80',
  },
  
  profile: (username: string) => ({
    title: `${username}'s Profile - HiBowan`,
    description: `View ${username}'s travel profile, ratings, and upcoming trips on HiBowan. Connect with fellow travelers across Sri Lanka.`,
    keywords: `${username} travel profile, sri lanka traveler, travel reviews`,
    ogType: 'profile' as const,
  }),
  
  trip: (tripTitle: string, destination: string) => ({
    title: `${tripTitle} - Travel to ${destination} | HiBowan`,
    description: `Join this amazing trip to ${destination}. Connect with fellow travelers, share costs, and create unforgettable memories in Sri Lanka.`,
    keywords: `${destination} trip, ${destination} travel, sri lanka ${destination.toLowerCase()}, travel buddies ${destination}`,
    ogType: 'article' as const,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'TouristTrip',
      'name': tripTitle,
      'description': `Travel to ${destination} with HiBowan`,
      'touristType': 'SharedTrip',
      'itinerary': {
        '@type': 'TouristDestination',
        'name': destination
      }
    }
  }),
};