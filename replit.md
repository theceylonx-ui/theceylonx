# Ceylon Expand - Travel Buddy Platform

## Overview

Ceylon Expand is a travel buddy and trip-sharing platform specifically designed for travelers visiting Sri Lanka. The application allows users to post trips, find travel companions, and share journeys across the beautiful island nation. Built as a full-stack web application with modern technologies, it provides a seamless experience for connecting travelers and facilitating shared transportation and experiences.

## Recent Changes

- **Phase 5: Performance Optimization (Oct 30, 2025)**:
  - ✅ **Font Optimization**: Async Google Fonts loading with DNS prefetch/preconnect, eliminates render-blocking CSS
  - ✅ **Logo Image Optimization**: 98% size reduction (~22KB → <1KB) with WebP/PNG formats, retina display support
  - ✅ **Code Splitting**: Verified all 30+ page components use React.lazy() for optimal bundle splitting
  - ✅ **Tailwind Purging**: Confirmed optimal configuration, 151KB purged CSS (only used utilities)
  - ✅ **Resource Hints**: DNS prefetch, preconnect for critical domains, Vite module preload
  - ✅ **Bundle Optimization**: Removed 8 unused dependencies (sharp, cloudinary, sendgrid, etc.)
  - ✅ **Security Updates**: Fixed axios and nodemailer vulnerabilities via npm audit
  - 📊 **Performance Targets**: PageSpeed 61→85+, FCP 6.3s→1.5-2.0s, LCP 6.9s→2.5s
  - 🎯 **Production Status**: Architect-approved, ready for deployment

- **Phase 4: Production Readiness (Sept 9, 2025)**:
  - ✅ Production environment configuration with validation and security settings
  - ✅ Comprehensive error monitoring and tracking system with automatic reporting
  - ✅ SEO optimization with meta tags, Open Graph, structured data, and dynamic sitemap
  - ✅ Enterprise-grade security hardening with rate limiting and input validation
  - ✅ Health check endpoints for production monitoring and reliability
  - ✅ Production middleware with compression, security headers, and caching
  - ✅ Structured logging system for production debugging and analysis
  - ✅ Rate limiting for different endpoint types (auth, uploads, search, chat)
  - ✅ SQL injection, XSS, and path traversal protection
  - ✅ Production-ready infrastructure for deployment

## User Preferences

Preferred communication style: Simple, everyday language.

**STRICT User Display Name Policy (Sept 10, 2025):**
- ONLY use `displayName` and `username` from user profile
- If both empty, use USER ID
- NEVER use OAuth names, firstName+lastName, or email fallbacks
- Ensures consistent user identification across all platform areas

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern component-based architecture using React 18 with full TypeScript support for type safety
- **Vite Build System**: Fast development server and optimized production builds
- **Wouter for Routing**: Lightweight client-side routing solution
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **shadcn/ui Components**: Pre-built, accessible UI component library using Radix UI primitives
- **React Hook Form**: Form handling with Zod schema validation for robust data validation
- **TanStack Query**: Server state management for API calls, caching, and synchronization

### Backend Architecture
- **Express.js Server**: RESTful API server with TypeScript support
- **Drizzle ORM**: Type-safe database queries and schema management
- **PostgreSQL Database**: Relational database for storing user data, trips, comments, and ratings
- **Session-based Authentication**: Secure user sessions with PostgreSQL session storage

### Database Design
The application uses a relational database structure with the following key entities:
- **Users**: Profile information, authentication data, and contact details
- **Trips**: Travel postings with origin, destination, pricing, and availability
- **Trip Participants**: Many-to-many relationship between users and trips
- **Comments**: User feedback and communication on trips
- **Ratings**: User rating system for trip organizers and participants
- **Reports**: Content moderation and safety reporting system

### Authentication and Authorization
- **Replit Auth Integration**: OAuth-based authentication using Replit's identity provider
- **Session Management**: Secure session storage using connect-pg-simple
- **Role-based Access**: User authentication required for posting trips and joining activities
- **Profile Completion Flow**: Multi-step user onboarding with required profile information

### Key Features Architecture
- **Trip Discovery**: Advanced filtering and search capabilities by location, date, price, and region
- **Mobile-first Design**: Responsive design optimized for mobile devices
- **Real-time Updates**: Query invalidation and refetching for live data updates
- **Contact Integration**: Direct WhatsApp and email integration for user communication
- **Regional Categorization**: Sri Lankan provinces and regions for better trip organization

### Code Organization
- **Monorepo Structure**: Client, server, and shared code in a single repository
- **Shared Schema**: Common TypeScript types and Zod schemas used across frontend and backend
- **Component Modularity**: Reusable UI components with proper separation of concerns
- **Custom Hooks**: Abstracted logic for authentication, API calls, and form handling

### Performance Optimizations
- **Image Assets**: Optimized logo with WebP/PNG formats, srcset for retina displays, explicit dimensions
  - Located in: `attached_assets/optimized/` (logo-56.png, logo-112.png, logo-56.webp, logo-112.webp)
  - Usage: Navigation, footer, auth pages, trip pages (8 files total)
- **Font Loading**: Async Google Fonts with DNS prefetch/preconnect, font-display swap
  - Inter font family (400, 500, 600, 700 weights) loaded non-blocking
  - System font fallbacks for instant text rendering
- **Code Splitting**: Route-based lazy loading via React.lazy() for all page components
  - Reduces initial bundle size, improves Time to Interactive
  - Suspense boundaries with custom loading states
- **CSS Optimization**: Tailwind CSS purging removes unused styles (151KB purged output)
  - Content paths: client/index.html, client/src/**/*.{js,jsx,ts,tsx}
- **Bundle Size**: 2.7MB total across all chunks (well-split), 357KB main bundle
  - Tree shaking enabled, unused dependencies removed

## External Dependencies

### Database and Infrastructure
- **Neon PostgreSQL**: Serverless PostgreSQL database for production deployment
- **WebSocket Support**: Real-time database connections using WebSocket constructor

### Authentication Services
- **Replit Auth**: OAuth identity provider integration
- **OpenID Connect**: Standards-compliant authentication flow

### UI and Component Libraries
- **Radix UI**: Headless, accessible component primitives
- **Lucide React**: SVG icon library for consistent iconography
- **date-fns**: Date manipulation and formatting utilities

### Development and Build Tools
- **ESBuild**: Fast JavaScript bundler for server-side code
- **PostCSS**: CSS processing with Tailwind CSS integration
- **TypeScript**: Static type checking across the entire codebase

### External Service Integrations
- **WhatsApp API**: Direct messaging integration for user communication
- **Email Services**: mailto links for contact functionality
- **Google Fonts**: Web font integration for typography
- **Unsplash**: High-quality travel imagery for destination representation

### Development Environment
- **Replit Platform**: Cloud-based development environment with live deployment
- **Hot Module Replacement**: Development-time code updates via Vite
- **Error Reporting**: Runtime error overlay for development debugging