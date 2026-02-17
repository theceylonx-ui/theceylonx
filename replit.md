# Ceylon Expand - Travel Buddy Platform

## Overview

Ceylon Expand is a travel buddy and trip-sharing platform specifically designed for travelers visiting Sri Lanka. The application allows users to post trips, find travel companions, and share journeys across the beautiful island nation. Built as a full-stack web application with modern technologies, it provides a seamless experience for connecting travelers and facilitating shared transportation and experiences.

## Recent Changes

- **Phase 8: Quick Trip Feature (Feb 17, 2026)**:
  - ✅ **Quick Trip Posting**: 3-step wizard for spontaneous/last-minute trips
    - Step 1: Where & When (from/to locations, date, time)
    - Step 2: Trip Details (title, description, category, seats)
    - Step 3: Review & Post with summary
  - ✅ **Separate Database Table**: `quick_trips` table with minimal schema
    - Auto-expiry via `expiresAt` timestamp (3 days after creation)
    - No pricing, duration, difficulty, or media fields
    - Essential fields only: title, description, category, locations, date, time, seats
  - ✅ **Browse Integration**: Quick trips merged with detailed trips on browse page
    - Discriminator field (`tripType: 'quick' | 'detailed'`) for unified card rendering
    - Quick Trip badge with countdown timer showing hours until deletion
    - Defensive filtering: `expiresAt > now` prevents expired trips from showing
  - ✅ **Auto-Cleanup**: Hybrid expiry approach
    - Background scheduler deletes expired quick trips (runs daily at 2 AM + initial check)
    - Defensive lazy deletion via `expiresAt > now` filter in all queries
    - Integrated into existing TripArchiverService
  - ✅ **Trip Type Selector**: Post-trip page with Quick vs Detailed option cards
  - ✅ **Quick Trip Detail Page**: Dedicated detail view with countdown, category, organizer info
  - ✅ **API Routes**: POST create (auth + rate limited), GET by ID, DELETE by owner, GET user's quick trips
  - ✅ **Interest & Chat System**: Full interest request lifecycle for quick trips
    - "I'm Interested" button on quick trip cards (browse page) with loading/success states
    - Interest request with optional message sent to organizer
    - Real-time notification to organizer via WebSocket
    - Organizer accept/decline view on quick trip detail page
    - Chat thread auto-created when interest is accepted
    - Both users redirected to chat after acceptance
    - `quick_trip_interest_requests` table with duplicate prevention
  - ✅ **Date Restriction**: Quick trip dates limited to today through 5 days ahead (client + server validation)
  - 🎯 **Status**: Production-ready

- **Phase 7: Advanced Trip Filtering (Nov 12, 2025)**:
  - ✅ **Enhanced Filter System**: Comprehensive trip filtering with 8 new filter criteria
    - Duration filter (half-day, full-day, multi-day options)
    - Difficulty level multi-select (easy, moderate, challenging)
    - Interests/activities multi-select (8 curated options: wildlife, cultural, adventure, beach, hiking, food, photography, spiritual)
    - Group size range filter (min/max with validation)
    - Quick date range presets (this weekend, next week, next 2 weeks, next month)
  - ✅ **Collapsible UI Design**: Space-efficient Advanced Filters section with smooth animations
    - Mobile-first design with Framer Motion transitions
    - Color-coded difficulty chips (green/amber/red visual indicators)
    - Icon-enhanced interest chips for better UX
    - Inline validation with error feedback
  - ✅ **Backend Optimization**: SQL performance enhancements
    - GIN index on interests array for fast text[] queries
    - B-tree indexes on difficulty, duration, group size fields
    - Array overlap logic using `= ANY($1::text[])` pattern
    - Group size range overlap (finds trips matching user's preferred size)
  - ✅ **Input Validation**: Comprehensive client-side validation
    - NaN and negative value prevention
    - Range validation (1-100 for group size, 1-365 for days)
    - Cross-field validation (min ≤ max for group size)
    - Visual feedback with red borders and error messages
  - ✅ **State Management**: URL synchronization and persistence
    - All filters encode/decode to URL query params
    - Zustand store with proper defaults
    - TanStack Query integration with cache invalidation
  - 🎯 **Status**: Architect-approved, production-ready
  - 📝 **Future Enhancements**: URL hydration validation for tampered links, unit tests for validation logic

- **Phase 6: Trip Lifecycle Management (Nov 12, 2025)**:
  - ✅ **Auto-Archive System**: Daily cron job auto-archives trips past their date+time
    - Combines date and time columns using SQL for accurate archival timing
    - Only archives 'active' and 'inactive' trips, preserves completed/cancelled/deleted
    - Archived trips visible only to trip creator on dashboard
    - Manual archive endpoint for organizers
  - ✅ **Trip Completion & Notifications**: Organizers can mark trips as completed/occupied
    - Real-time WebSocket notifications to all interested users (pending/accepted status)
    - Reopen functionality to make completed trips active again
    - Uses existing tripInterestRequests table for notification targeting
    - Added 'trip_completed' notification type with category and priority
  - ✅ **Database Schema Updates**: Added 'archived' status, archivedAt timestamp field
  - ✅ **Service Architecture**: TripArchiverService and TripCompletionService with cron scheduler
  - 🎯 **Status**: Architect-approved, production-ready

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