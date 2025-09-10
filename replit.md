# Ceylon Expand - Travel Buddy Platform

## Overview

Ceylon Expand is a travel buddy and trip-sharing platform specifically designed for travelers visiting Sri Lanka. The application allows users to post trips, find travel companions, and share journeys across the beautiful island nation. Built as a full-stack web application with modern technologies, it provides a seamless experience for connecting travelers and facilitating shared transportation and experiences.

## Recent Changes

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