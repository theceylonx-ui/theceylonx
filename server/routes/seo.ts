import { Router, Request, Response } from 'express';
import { db } from '../db';
import { trips, users } from '@shared/schema';
import { sql } from 'drizzle-orm';

// 🚀 PHASE 4: SEO endpoints for sitemap and structured data
const router = Router();

// Generate XML sitemap
router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.hibowan.com' 
      : `http://${req.get('host')}`;
    
    // Static pages with priorities and frequencies
    const staticPages = [
      { url: '', changefreq: 'daily', priority: '1.0' },
      { url: '/browse-trips', changefreq: 'hourly', priority: '0.9' },
      { url: '/community', changefreq: 'daily', priority: '0.8' },
      { url: '/faq', changefreq: 'weekly', priority: '0.7' },
      { url: '/about', changefreq: 'monthly', priority: '0.6' },
      { url: '/privacy-policy', changefreq: 'monthly', priority: '0.5' },
      { url: '/terms-of-service', changefreq: 'monthly', priority: '0.5' },
    ];
    
    // Get recent active trips for dynamic content (simplified for now)
    let recentTrips = [];
    try {
      recentTrips = await db
        .select()
        .from(trips)
        .limit(100);
    } catch (error) {
      console.warn('Could not fetch trips for sitemap:', error);
      recentTrips = [];
    }
    
    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
    
    // Add static pages
    staticPages.forEach(page => {
      sitemap += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`;
    });
    
    // Add trip pages
    recentTrips.forEach(trip => {
      const lastmod = trip.createdAt ? trip.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      sitemap += `
  <url>
    <loc>${baseUrl}/trips/${trip.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    });
    
    sitemap += '\n</urlset>';
    
    res.set({
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400', // 24 hours cache
    });
    
    res.send(sitemap);
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Generate robots.txt dynamically (if needed for different environments)
router.get('/robots.txt', (req: Request, res: Response) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://www.hibowan.com' 
    : `http://${req.get('host')}`;
  
  const robotsTxt = `User-agent: *
Allow: /

# Important pages
Allow: /browse-trips
Allow: /community
Allow: /faq
Allow: /about
Allow: /privacy-policy
Allow: /terms-of-service

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Block sensitive areas
Disallow: /admin
Disallow: /api/
Disallow: /health
Disallow: /_*
Disallow: /node_modules
Disallow: /*.json$

# Crawl delay to be respectful
Crawl-delay: 1`;

  res.set({
    'Content-Type': 'text/plain',
    'Cache-Control': 'public, max-age=86400', // 24 hours cache
  });
  
  res.send(robotsTxt);
});

// Structured data for homepage
router.get('/api/structured-data/home', (req: Request, res: Response) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://www.hibowan.com' 
    : `http://${req.get('host')}`;
    
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'HiBowan',
    'description': 'Travel buddy and trip sharing platform for Sri Lanka. Connect with fellow travelers and explore the pearl of the Indian Ocean together.',
    'url': baseUrl,
    'logo': `${baseUrl}/logo.png`,
    'sameAs': [
      'https://www.facebook.com/hibowan.srilanka',
      'https://www.instagram.com/hibowan.srilanka',
      'https://www.twitter.com/hibowan.srilanka'
    ],
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${baseUrl}/browse-trips?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
  
  res.json(structuredData);
});

export { router as seoRouter };