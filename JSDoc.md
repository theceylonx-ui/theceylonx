# Ceylon Expand - JSDoc Documentation Standards

## 📚 Comprehensive Documentation Guidelines

This document establishes JSDoc documentation standards for Ceylon Expand to ensure consistent, maintainable, and self-documenting code.

## Table of Contents

- [General Guidelines](#general-guidelines)
- [Function Documentation](#function-documentation)
- [Class Documentation](#class-documentation)
- [Interface Documentation](#interface-documentation)
- [React Component Documentation](#react-component-documentation)
- [API Route Documentation](#api-route-documentation)
- [Database Schema Documentation](#database-schema-documentation)
- [Examples and Best Practices](#examples-and-best-practices)

## General Guidelines

### Documentation Requirements

**MUST document:**
- All public functions and methods
- All React components and custom hooks
- All API routes and endpoints
- All database models and schemas
- All utility functions and helpers
- All complex business logic

**SHOULD document:**
- Private methods with complex logic
- Non-obvious code patterns
- Performance-critical sections
- Security-sensitive operations

**Tags to use:**
- `@param` - Function parameters
- `@returns` - Return values
- `@throws` - Possible exceptions
- `@example` - Usage examples
- `@since` - Version added
- `@deprecated` - Deprecated features
- `@todo` - Future improvements
- `@see` - Related documentation

## Function Documentation

### Standard Functions

```typescript
/**
 * Validates and formats a Sri Lankan phone number
 * 
 * Supports multiple formats:
 * - International: +94771234567
 * - National: 0771234567  
 * - Local: 771234567
 * 
 * @param phoneNumber - The phone number to validate and format
 * @param format - Output format preference
 * @returns Formatted phone number
 * @throws {ValidationError} When phone number format is invalid
 * 
 * @example
 * ```typescript
 * const formatted = formatPhoneNumber('771234567', 'international');
 * console.log(formatted); // '+94771234567'
 * 
 * const local = formatPhoneNumber('+94771234567', 'local');
 * console.log(local); // '771234567'
 * ```
 * 
 * @since 1.0.0
 */
export function formatPhoneNumber(
  phoneNumber: string,
  format: 'international' | 'national' | 'local' = 'national'
): string {
  // Implementation...
}
```

### Async Functions

```typescript
/**
 * Fetches trip details with organizer information and booking status
 * 
 * Includes comprehensive trip data with:
 * - Trip details and itinerary
 * - Organizer profile information
 * - Current booking status
 * - User-specific interaction history
 * 
 * @param tripId - Unique trip identifier
 * @param userId - Current user ID for personalized data
 * @param options - Additional fetch options
 * @param options.includePrivateData - Include sensitive organizer data (requires permission)
 * @param options.useCache - Use cached data if available
 * 
 * @returns Promise resolving to complete trip details
 * @throws {NotFoundError} When trip doesn't exist
 * @throws {ForbiddenError} When user lacks access permissions  
 * @throws {APIError} When external service calls fail
 * 
 * @example
 * ```typescript
 * try {
 *   const trip = await fetchTripDetails('trip-123', 'user-456', {
 *     includePrivateData: false,
 *     useCache: true
 *   });
 *   
 *   console.log(trip.title); // 'Adventure in Kandy'
 *   console.log(trip.organizer.name); // 'John Doe'
 * } catch (error) {
 *   if (error instanceof NotFoundError) {
 *     handleTripNotFound();
 *   } else {
 *     handleGenericError(error);
 *   }
 * }
 * ```
 * 
 * @since 1.2.0
 */
export async function fetchTripDetails(
  tripId: string,
  userId: string,
  options: {
    includePrivateData?: boolean;
    useCache?: boolean;
  } = {}
): Promise<TripDetails> {
  // Implementation...
}
```

## Class Documentation

### Service Classes

```typescript
/**
 * Handles all trip-related business logic and data operations
 * 
 * Provides comprehensive trip management including:
 * - Trip creation, updating, and deletion
 * - Search and filtering capabilities
 * - Booking and interest management
 * - Organizer notification system
 * - Trip recommendation engine integration
 * 
 * @example
 * ```typescript
 * const tripService = new TripService(db, notificationService);
 * 
 * // Create a new trip
 * const trip = await tripService.createTrip({
 *   title: 'Hiking in Ella',
 *   organizerId: 'user-123',
 *   date: new Date('2024-12-01'),
 *   seatsAvailable: 6
 * });
 * 
 * // Search for trips
 * const results = await tripService.searchTrips({
 *   region: 'uva',
 *   dateFrom: new Date(),
 *   maxPrice: 10000
 * });
 * ```
 * 
 * @since 1.0.0
 */
export class TripService {
  /**
   * Database connection instance
   * @private
   */
  private db: Database;

  /**
   * Notification service for trip updates
   * @private
   */
  private notificationService: NotificationService;

  /**
   * Creates a new TripService instance
   * 
   * @param db - Database connection
   * @param notificationService - Service for sending notifications
   */
  constructor(db: Database, notificationService: NotificationService) {
    this.db = db;
    this.notificationService = notificationService;
  }

  /**
   * Creates a new trip with comprehensive validation
   * 
   * Performs the following operations:
   * 1. Validates trip data against schema
   * 2. Checks organizer permissions
   * 3. Generates unique trip ID
   * 4. Saves to database with transaction
   * 5. Sends confirmation notification
   * 
   * @param tripData - Trip creation data
   * @param organizerId - ID of the trip organizer
   * @returns Promise resolving to created trip
   * @throws {ValidationError} When trip data is invalid
   * @throws {ForbiddenError} When organizer lacks permissions
   * 
   * @example
   * ```typescript
   * const trip = await tripService.createTrip({
   *   title: 'Sigiriya Day Tour',
   *   fromLocation: 'Colombo',
   *   toLocation: 'Sigiriya',
   *   date: new Date('2024-11-15'),
   *   seatsAvailable: 8,
   *   price: 7500
   * }, 'organizer-123');
   * ```
   */
  async createTrip(tripData: CreateTripInput, organizerId: string): Promise<Trip> {
    // Implementation...
  }
}
```

## Interface Documentation

```typescript
/**
 * Complete trip information with organizer and booking details
 * 
 * Represents a travel opportunity posted by an organizer, including
 * all necessary information for potential participants to make
 * informed decisions about joining the trip.
 * 
 * @interface TripDetails
 * @since 1.0.0
 */
export interface TripDetails {
  /** Unique trip identifier */
  id: string;
  
  /** Trip title/name (5-200 characters) */
  title: string;
  
  /** 
   * Departure location 
   * @example 'Colombo Fort Railway Station'
   */
  fromLocation: string;
  
  /** 
   * Destination location
   * @example 'Kandy City Center' 
   */
  toLocation: string;
  
  /** 
   * Trip date and time
   * Must be in the future when creating
   */
  date: Date;
  
  /** 
   * Available seats for participants
   * @minimum 1
   * @maximum 50
   */
  seatsAvailable: number;
  
  /** 
   * Trip price in LKR (optional for free trips)
   * @example 5000.00
   */
  price?: number;
  
  /** 
   * Geographic region for filtering
   * @see {@link SriLankaRegions}
   */
  region: SriLankaRegions;
  
  /** 
   * Trip category for classification
   * @see {@link TripCategory}
   */
  category: TripCategory;
  
  /**
   * Trip organizer information
   * Contains public profile data only
   */
  organizer: {
    /** Organizer user ID */
    id: string;
    
    /** Display name */
    name: string;
    
    /** Profile image URL */
    profileImage?: string;
    
    /** Verification status */
    isVerified: boolean;
    
    /** Trip organization history count */
    tripCount: number;
  };
  
  /**
   * Current booking status for the requesting user
   * Only populated when user is authenticated
   */
  userBookingStatus?: 'none' | 'interested' | 'pinned' | 'booked';
  
  /** Trip creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
}
```

## React Component Documentation

### Functional Components

```typescript
/**
 * Trip booking form with comprehensive validation and payment integration
 * 
 * Features:
 * - Real-time form validation with Zod schema
 * - Multiple payment method support (Credit Card, PayPal, Bank Transfer)  
 * - Accessibility-compliant form controls
 * - Mobile-responsive design
 * - Loading states and error handling
 * - Integration with booking confirmation system
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <TripBookingForm
 *   trip={tripDetails}
 *   onBookingComplete={handleBookingSuccess}
 * />
 * 
 * // With custom payment methods
 * <TripBookingForm
 *   trip={tripDetails}
 *   paymentMethods={['creditCard', 'paypal']}
 *   onBookingComplete={handleBookingSuccess}
 *   onError={handleBookingError}
 * />
 * 
 * // With pre-filled user data
 * <TripBookingForm
 *   trip={tripDetails}
 *   initialData={{
 *     name: user.name,
 *     email: user.email,
 *     phone: user.phone
 *   }}
 *   onBookingComplete={handleBookingSuccess}
 * />
 * ```
 * 
 * @since 1.1.0
 */
export function TripBookingForm({
  trip,
  onBookingComplete,
  onError,
  paymentMethods = ['creditCard', 'paypal', 'bankTransfer'],
  initialData = {},
  className,
}: TripBookingFormProps) {
  // Implementation...
}

/**
 * Props for TripBookingForm component
 * 
 * @interface TripBookingFormProps
 */
export interface TripBookingFormProps {
  /** Trip details for booking */
  trip: TripDetails;
  
  /** 
   * Callback triggered when booking is successfully completed
   * @param booking - Created booking details
   */
  onBookingComplete: (booking: BookingDetails) => void;
  
  /** 
   * Error handler for booking failures
   * @param error - Error that occurred during booking
   */
  onError?: (error: BookingError) => void;
  
  /** 
   * Available payment methods
   * @default ['creditCard', 'paypal', 'bankTransfer']
   */
  paymentMethods?: PaymentMethod[];
  
  /** 
   * Pre-filled form data
   * Useful for logged-in users
   */
  initialData?: Partial<BookingFormData>;
  
  /** Additional CSS classes */
  className?: string;
}
```

### Custom Hooks

```typescript
/**
 * Custom hook for managing trip interactions (pin, interest, booking)
 * 
 * Provides unified interface for all trip-related user actions with:
 * - Optimistic updates for better UX
 * - Error handling and rollback
 * - Loading states for each action
 * - Cache invalidation after mutations
 * - Toast notifications for user feedback
 * 
 * @param tripId - ID of the trip to interact with
 * @returns Object containing action functions and loading states
 * 
 * @example
 * ```tsx
 * function TripCard({ trip }) {
 *   const {
 *     togglePin,
 *     toggleInterest,
 *     isLoading,
 *     isPinned,
 *     hasInterest
 *   } = useTripActions(trip.id);
 * 
 *   return (
 *     <Card>
 *       <CardContent>
 *         <h3>{trip.title}</h3>
 *         <Button
 *           onClick={() => togglePin()}
 *           disabled={isLoading.pin}
 *         >
 *           {isPinned ? 'Unpin' : 'Pin'} Trip
 *         </Button>
 *         
 *         <Button
 *           onClick={() => toggleInterest()}
 *           disabled={isLoading.interest}
 *         >
 *           {hasInterest ? 'Remove Interest' : 'Show Interest'}
 *         </Button>
 *       </CardContent>
 *     </Card>
 *   );
 * }
 * ```
 * 
 * @hook
 * @since 1.2.0
 */
export function useTripActions(tripId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // ... implementation
  
  /**
   * Toggle trip pin status with optimistic updates
   * 
   * @returns Promise that resolves when the operation completes
   * @throws {APIError} When the API request fails
   */
  const togglePin = useCallback(async (): Promise<void> => {
    // Implementation...
  }, [tripId]);
  
  return {
    togglePin,
    toggleInterest,
    isLoading,
    isPinned,
    hasInterest,
  };
}
```

## API Route Documentation

```typescript
/**
 * @fileoverview Trip management API routes
 * 
 * Provides comprehensive trip CRUD operations with advanced filtering,
 * pagination, and search capabilities. All routes include proper
 * authentication, validation, and error handling.
 * 
 * Base path: `/api/trips`
 * 
 * @version 1.0.0
 * @author Ceylon Expand Team
 */

/**
 * GET /api/trips - Fetch trips with advanced filtering and pagination
 * 
 * Supports comprehensive filtering options:
 * - Region-based filtering
 * - Date range filtering  
 * - Price range filtering
 * - Category filtering
 * - Keyword search across title and locations
 * - Organizer filtering
 * 
 * @route GET /api/trips
 * @access Public
 * @param {Object} query - Query parameters
 * @param {string} [query.region] - Filter by Sri Lankan region
 * @param {string} [query.category] - Filter by trip category
 * @param {string} [query.dateFrom] - Start date for date range (ISO string)
 * @param {string} [query.dateTo] - End date for date range (ISO string)  
 * @param {number} [query.minPrice] - Minimum price filter
 * @param {number} [query.maxPrice] - Maximum price filter
 * @param {string} [query.search] - Search keyword for title/locations
 * @param {number} [query.page=1] - Page number for pagination
 * @param {number} [query.limit=20] - Items per page (max 100)
 * @param {string} [query.sortBy='date'] - Sort field (date, price, title)
 * @param {string} [query.sortOrder='asc'] - Sort order (asc, desc)
 * 
 * @returns {Object} Paginated trips response
 * @returns {Trip[]} returns.trips - Array of trip objects
 * @returns {number} returns.total - Total number of trips matching filter
 * @returns {number} returns.page - Current page number
 * @returns {number} returns.limit - Items per page
 * @returns {number} returns.totalPages - Total number of pages
 * 
 * @throws {400} Bad Request - Invalid query parameters
 * @throws {500} Internal Server Error - Database or server error
 * 
 * @example
 * ```bash
 * # Get all trips
 * GET /api/trips
 * 
 * # Get trips in Central province for next month
 * GET /api/trips?region=central&dateFrom=2024-11-01&dateTo=2024-11-30
 * 
 * # Search for hiking trips under 5000 LKR
 * GET /api/trips?search=hiking&maxPrice=5000&sortBy=price&sortOrder=asc
 * ```
 * 
 * @example
 * ```typescript
 * // Frontend usage
 * const response = await fetch('/api/trips?region=western&limit=10');
 * const data = await response.json();
 * 
 * if (response.ok) {
 *   console.log(`Found ${data.total} trips`);
 *   data.trips.forEach(trip => console.log(trip.title));
 * }
 * ```
 */
export async function getTrips(req: Request, res: Response): Promise<void> {
  // Implementation...
}

/**
 * POST /api/trips - Create a new trip
 * 
 * Creates a new trip with comprehensive validation. The trip organizer
 * is automatically set to the authenticated user. All required fields
 * must be provided and pass validation.
 * 
 * @route POST /api/trips
 * @access Private (requires authentication)
 * @param {CreateTripInput} body - Trip creation data
 * @param {string} body.title - Trip title (5-200 characters)
 * @param {string} body.fromLocation - Departure location
 * @param {string} body.toLocation - Destination location
 * @param {string} body.date - Trip date (ISO string, must be future)
 * @param {string} body.time - Trip time (HH:MM format)
 * @param {number} body.seatsAvailable - Available seats (1-50)
 * @param {number} [body.price] - Trip price in LKR
 * @param {string} body.region - Sri Lankan region
 * @param {string} body.category - Trip category
 * @param {string} [body.description] - Trip description
 * @param {string} body.organizerPhone - Contact phone number
 * @param {string} [body.organizerEmail] - Contact email (defaults to user email)
 * 
 * @returns {Trip} Created trip object with generated ID
 * 
 * @throws {400} Bad Request - Validation errors or invalid data
 * @throws {401} Unauthorized - Authentication required
 * @throws {409} Conflict - Trip with same details already exists
 * @throws {500} Internal Server Error - Database or server error
 * 
 * @example
 * ```bash
 * POST /api/trips
 * Content-Type: application/json
 * Authorization: Bearer <jwt-token>
 * 
 * {
 *   "title": "Kandy Day Trip",
 *   "fromLocation": "Colombo Fort",
 *   "toLocation": "Kandy City",
 *   "date": "2024-11-15T08:00:00.000Z",
 *   "time": "08:00",
 *   "seatsAvailable": 6,
 *   "price": 5000,
 *   "region": "central",
 *   "category": "culture",
 *   "organizerPhone": "0771234567"
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Frontend usage with error handling
 * try {
 *   const response = await fetch('/api/trips', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'Authorization': `Bearer ${token}`
 *     },
 *     body: JSON.stringify(tripData)
 *   });
 * 
 *   if (!response.ok) {
 *     const error = await response.json();
 *     throw new Error(error.message);
 *   }
 * 
 *   const newTrip = await response.json();
 *   console.log('Trip created:', newTrip.id);
 * } catch (error) {
 *   console.error('Failed to create trip:', error.message);
 * }
 * ```
 */
export async function createTrip(req: Request, res: Response): Promise<void> {
  // Implementation...
}
```

## Database Schema Documentation

```typescript
/**
 * @fileoverview Ceylon Expand Database Schema
 * 
 * Comprehensive database schema for the Ceylon Expand travel platform.
 * Includes all tables, relationships, indexes, and constraints with
 * detailed documentation for each field and business rule.
 * 
 * @version 3.0.0
 * @author Ceylon Expand Team
 */

/**
 * Trips table - Core trip information and travel opportunities
 * 
 * Stores all trip details posted by organizers. Includes comprehensive
 * validation constraints and performance-optimized indexes for search
 * and filtering operations.
 * 
 * Business Rules:
 * - Trip dates must be in the future
 * - Available seats must be positive and realistic (1-50)
 * - Price must be non-negative if specified
 * - Organizer contact information is required
 * - Soft deletion is used to preserve data integrity
 * 
 * Performance Considerations:
 * - Composite indexes for common search patterns
 * - Partial indexes for active trips only
 * - GIN indexes for array-based searches
 * 
 * @table trips
 * @since 1.0.0
 */
export const trips = pgTable("trips", {
  /** 
   * Unique trip identifier
   * Auto-generated UUID for security and distribution
   */
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  /** 
   * Trip title/name
   * User-facing trip name that appears in listings
   * @constraint 5-200 characters required
   * @example "Weekend Hiking in Ella"
   */
  title: varchar("title", { length: 200 }).notNull(),
  
  /** 
   * Departure location
   * Starting point for the trip journey
   * @constraint 2-100 characters required
   * @example "Colombo Fort Railway Station"
   */
  fromLocation: varchar("from_location", { length: 100 }).notNull(),
  
  /** 
   * Destination location  
   * Primary destination or endpoint of trip
   * @constraint 2-100 characters required
   * @example "Ella Rock Viewpoint"
   */
  toLocation: varchar("to_location", { length: 100 }).notNull(),
  
  /** 
   * Trip date
   * Scheduled date for the trip
   * @constraint Must be in the future when creating
   * @indexed For date range filtering
   */
  date: timestamp("date").notNull(),
  
  /** 
   * Trip start time
   * Time of departure in HH:MM format
   * @constraint Valid time format (00:00-23:59)
   * @example "08:30"
   */
  time: varchar("time", { length: 10 }).notNull(),
  
  /** 
   * Available seats for participants
   * Number of people who can join this trip
   * @constraint 1-50 seats allowed
   * @indexed For availability filtering
   */
  seatsAvailable: integer("seats_available").notNull(),
  
  /** 
   * Trip price in Sri Lankan Rupees (LKR)
   * Cost per person to join the trip
   * @constraint Non-negative value, null for free trips
   * @precision 10 digits, 2 decimal places
   * @indexed For price range filtering
   * @example 5500.00 (5,500 LKR)
   */
  price: decimal("price", { precision: 10, scale: 2 }),
  
  /** 
   * Geographic region in Sri Lanka
   * Used for location-based filtering and recommendations
   * @constraint Must be valid Sri Lankan province/region
   * @indexed Primary filter for location searches
   * @see {@link SriLankaRegions}
   */
  region: varchar("region", { length: 50 }).notNull(),
  
  /** 
   * Trip category/type
   * Classifies the type of travel experience
   * @constraint Must be from predefined category enum
   * @indexed For category-based filtering
   * @see {@link TripCategory}
   */
  category: tripCategoryEnum("category").default("unknown").notNull(),
  
  /** 
   * Trip organizer user ID
   * References the user who created and manages this trip
   * @relation users(id) ON DELETE CASCADE
   * @indexed For organizer-based queries
   */
  organizerId: varchar("organizer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  /** 
   * Organizer phone number
   * Contact number for trip coordination (Sri Lankan format)
   * @constraint 9-digit local format (771234567)
   * @example "771234567"
   */
  organizerPhone: varchar("organizer_phone", { length: 20 }),
  
  /** 
   * Organizer email address
   * Alternative contact method for trip coordination
   * @constraint Valid email format if provided
   * @default User's primary email
   */
  organizerEmail: varchar("organizer_email", { length: 255 }),
  
  /** 
   * Trip status
   * Current state of the trip listing
   * @constraint 'active' | 'inactive' | 'cancelled' | 'completed'
   * @default 'active'
   * @indexed Primary filter for active trips
   */
  status: varchar("status", { length: 20 }).default("active").notNull(),
  
  /** 
   * Trip creation timestamp
   * When the trip was first posted
   * @indexed For chronological sorting
   */
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  /** 
   * Last update timestamp
   * When trip details were last modified
   * @indexed For tracking recent changes
   */
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  /** 
   * Soft deletion flag
   * Marks trip as deleted without removing data
   * @default false
   * @indexed Used in WHERE clauses to exclude deleted trips
   */
  isDeleted: boolean("is_deleted").default(false).notNull(),
  
  /** 
   * Deletion timestamp
   * When the trip was marked as deleted
   * @nullable Only set when isDeleted = true
   */
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  // Business logic constraints
  sql`CONSTRAINT check_seats_positive CHECK (seats_available > 0 AND seats_available <= 50)`,
  sql`CONSTRAINT check_price_positive CHECK (price IS NULL OR price >= 0)`,
  sql`CONSTRAINT check_trip_date_future CHECK (date > NOW() - INTERVAL '1 day')`,
  sql`CONSTRAINT check_time_format CHECK (time ~* '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')`,
  sql`CONSTRAINT check_status_valid CHECK (status IN ('active', 'inactive', 'cancelled', 'completed'))`,
  sql`CONSTRAINT check_contact_required CHECK (organizer_phone IS NOT NULL OR organizer_email IS NOT NULL)`,
  
  // Performance indexes for common query patterns
  index("trips_region_date_idx").on(table.region, table.date),
  index("trips_status_idx").on(table.status),
  index("trips_organizer_idx").on(table.organizerId),
  index("trips_date_idx").on(table.date),
  index("trips_price_range_idx").on(table.price),
  
  // Composite index for most common search pattern
  index("trips_active_listing_idx").on(table.status, table.isDeleted, table.region, table.date),
]);

/**
 * Type definitions for trips table
 * 
 * @typedef Trip - Complete trip record from database
 * @typedef InsertTrip - Data structure for creating new trips  
 * @typedef UpdateTrip - Data structure for updating existing trips
 */
export type Trip = typeof trips.$inferSelect;
export type InsertTrip = typeof trips.$inferInsert;
export type UpdateTrip = Partial<InsertTrip>;

/**
 * Validation schemas for trip operations
 * Generated from Drizzle schema with additional business rules
 */
export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
  deletedAt: true,
}).extend({
  // Additional validation rules
  date: z.string().datetime().refine(
    (date) => new Date(date) > new Date(),
    { message: "Trip date must be in the future" }
  ),
  organizerPhone: z.string().regex(/^[0-9]{9}$/, {
    message: "Phone number must be 9 digits in local format"
  }),
});

export type InsertTripInput = z.infer<typeof insertTripSchema>;
export type TripValidationError = z.ZodError<InsertTripInput>;
```

---

## Best Practices Summary

### 1. Documentation Completeness
- **Public APIs**: 100% documentation coverage
- **Components**: Include props, usage examples, accessibility notes
- **Functions**: Parameter validation, error conditions, examples
- **Classes**: Constructor params, method documentation, usage patterns

### 2. Code Examples
- **Realistic Examples**: Use actual project data and patterns
- **Error Handling**: Show proper error handling in examples
- **TypeScript**: Include type information in examples
- **Multiple Scenarios**: Show basic and advanced usage

### 3. Maintenance
- **Version Tags**: Use `@since` for new features
- **Deprecation**: Mark deprecated features with `@deprecated`
- **Updates**: Keep examples current with API changes
- **Review**: Regular documentation review cycles

### 4. Automation
- **Generate Docs**: Use JSDoc tools for automatic generation
- **Validation**: Ensure examples compile and run
- **Integration**: Link documentation with CI/CD pipeline
- **Publishing**: Automate documentation deployment

This comprehensive JSDoc standard ensures Ceylon Expand maintains high-quality, self-documenting code that scales with team growth and facilitates long-term maintenance.