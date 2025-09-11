# Ceylon Expand - Development Guidelines

## 🚀 Enterprise Code Quality Standards

This document outlines comprehensive development guidelines for maintaining enterprise-grade code quality in Ceylon Expand.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Quality Standards](#code-quality-standards)
- [Testing Guidelines](#testing-guidelines)
- [TypeScript Standards](#typescript-standards)
- [React Component Guidelines](#react-component-guidelines)
- [API Development](#api-development)
- [Database Guidelines](#database-guidelines)
- [Documentation Standards](#documentation-standards)
- [CI/CD Pipeline](#cicd-pipeline)

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database access
- Git configured with pre-commit hooks

### Initial Setup

```bash
# Install dependencies
npm install

# Setup pre-commit hooks
npx husky install

# Verify quality tools
npm run quality:check

# Start development
npm run dev
```

## Development Workflow

### 1. Branch Naming

```bash
# Feature branches
feature/user-authentication
feature/trip-booking-system

# Bug fixes
fix/trip-date-validation
fix/auth-token-expiry

# Refactoring
refactor/api-error-handling
refactor/component-structure
```

### 2. Commit Guidelines

```bash
# Conventional commits format
feat: add user authentication system
fix: resolve trip booking validation issue
docs: update API documentation
test: add integration tests for booking flow
refactor: improve error handling patterns
style: format code with prettier
```

### 3. Pre-commit Quality Gates

Every commit automatically runs:
- **TypeScript compilation** - Zero errors required
- **ESLint analysis** - All violations must be fixed
- **Prettier formatting** - Code is auto-formatted
- **Test execution** - Related tests must pass

## Code Quality Standards

### ESLint Configuration

Our strict ESLint setup enforces:

```typescript
// ✅ Good - Proper error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  logger.error('API call failed', { error, context: 'user-action' });
  throw new APIError('Failed to fetch data', { cause: error });
}

// ❌ Bad - Silent failures
const result = await apiCall().catch(() => null);
```

### Prettier Standards

```typescript
// ✅ Good - Consistent formatting
const config = {
  apiUrl: process.env.API_URL,
  timeout: 5000,
  retries: 3,
};

// ❌ Bad - Inconsistent formatting (auto-fixed)
const config={apiUrl:process.env.API_URL,timeout:5000,retries:3};
```

## Testing Guidelines

### 1. Test Structure

```typescript
describe('UserAuthentication', () => {
  describe('login', () => {
    it('should authenticate user with valid credentials', async () => {
      // Arrange
      const credentials = { email: 'test@test.com', password: 'valid' };
      
      // Act
      const result = await authService.login(credentials);
      
      // Assert
      expect(result).toMatchObject({
        user: expect.objectContaining({ email: credentials.email }),
        token: expect.any(String),
      });
    });
  });
});
```

### 2. Component Testing

```typescript
describe('TripCard Component', () => {
  it('should render trip information correctly', () => {
    // Arrange
    const trip = TEST_TRIP;
    
    // Act
    render(<TripCard trip={trip} />);
    
    // Assert
    expect(screen.getByText(trip.title)).toBeInTheDocument();
    expect(screen.getByTestId('trip-price')).toHaveTextContent('$5000');
  });
});
```

### 3. API Testing

```typescript
describe('POST /api/trips', () => {
  it('should create trip with valid data', async () => {
    const response = await request(app)
      .post('/api/trips')
      .send(validTripData)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      title: validTripData.title,
    });
  });
});
```

## TypeScript Standards

### 1. Strict Type Safety

```typescript
// ✅ Good - Explicit types and error handling
interface UserProfile {
  id: string;
  email: string;
  name: string;
  preferences?: TravelPreferences;
}

async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const user = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user.length) {
    throw new NotFoundError(`User ${userId} not found`);
  }
  
  return user[0];
}

// ❌ Bad - Any types and unclear return values
async function fetchUser(id: any): Promise<any> {
  return await db.query('SELECT * FROM users WHERE id = ?', [id]);
}
```

### 2. Union Types and Guards

```typescript
// ✅ Good - Proper union types with guards
type TripStatus = 'active' | 'cancelled' | 'completed';

function isTripActive(status: TripStatus): status is 'active' {
  return status === 'active';
}

// Usage with type safety
if (isTripActive(trip.status)) {
  // TypeScript knows status is 'active' here
  await processActiveTrip(trip);
}
```

## React Component Guidelines

### 1. Component Structure

```typescript
// ✅ Good - Well-structured component
interface TripCardProps {
  trip: Trip;
  onInterestClick?: (tripId: string) => void;
  showActions?: boolean;
}

/**
 * TripCard component for displaying trip information
 * 
 * @param trip - The trip data to display
 * @param onInterestClick - Callback when interest button is clicked
 * @param showActions - Whether to show action buttons
 */
export function TripCard({ 
  trip, 
  onInterestClick, 
  showActions = true 
}: TripCardProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleInterestClick = useCallback(async () => {
    if (!onInterestClick) return;
    
    setIsLoading(true);
    try {
      await onInterestClick(trip.id);
    } finally {
      setIsLoading(false);
    }
  }, [trip.id, onInterestClick]);
  
  return (
    <Card data-testid={`trip-card-${trip.id}`}>
      <CardHeader>
        <CardTitle>{trip.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <TripDetails trip={trip} />
        {showActions && (
          <TripActions 
            trip={trip}
            onInterestClick={handleInterestClick}
            isLoading={isLoading}
          />
        )}
      </CardContent>
    </Card>
  );
}
```

### 2. Custom Hooks

```typescript
// ✅ Good - Reusable custom hook with proper error handling
export function useTripActions(tripId: string) {
  const queryClient = useQueryClient();
  
  const { mutate: toggleInterest, isLoading } = useMutation({
    mutationFn: async (action: 'pin' | 'unpin') => {
      return await apiRequest(`/api/trips/${tripId}/save`, {
        method: action === 'pin' ? 'POST' : 'DELETE',
        body: JSON.stringify({ saveType: 'pinned' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trips', tripId]);
      queryClient.invalidateQueries(['saved-trips']);
    },
    onError: (error) => {
      console.error('Failed to toggle trip interest:', error);
      // Show user-friendly error message
    },
  });
  
  return { toggleInterest, isLoading };
}
```

## API Development

### 1. Route Structure

```typescript
// ✅ Good - Properly structured API route
/**
 * GET /api/trips - Fetch trips with filtering and pagination
 */
export async function getTrips(req: Request, res: Response) {
  try {
    // Validate query parameters
    const filters = tripFiltersSchema.parse(req.query);
    
    // Apply business logic
    const result = await tripService.getTrips(filters);
    
    // Return consistent response
    res.json({
      trips: result.trips,
      total: result.total,
      page: filters.page,
      limit: filters.limit,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors,
      });
    }
    
    logger.error('Failed to fetch trips', { error, query: req.query });
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 2. Validation Schemas

```typescript
// ✅ Good - Comprehensive validation
export const createTripSchema = z.object({
  title: z.string().min(5).max(200),
  fromLocation: z.string().min(2).max(100),
  toLocation: z.string().min(2).max(100),
  date: z.string().datetime(),
  seatsAvailable: z.number().int().min(1).max(20),
  price: z.number().optional(),
  region: z.enum(['western', 'central', 'southern', 'northern', 'eastern']),
  category: z.nativeEnum(TripCategory),
}).refine(
  (data) => new Date(data.date) > new Date(),
  { message: 'Trip date must be in the future' }
);
```

## Database Guidelines

### 1. Schema Design

```typescript
// ✅ Good - Well-designed schema with constraints
export const trips = pgTable('trips', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  title: varchar('title', { length: 200 }).notNull(),
  date: timestamp('date').notNull(),
  seatsAvailable: integer('seats_available').notNull(),
  organizerId: varchar('organizer_id').notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  sql`CONSTRAINT check_seats_positive CHECK (seats_available > 0)`,
  sql`CONSTRAINT check_future_date CHECK (date > NOW())`,
  index('trips_date_idx').on(table.date),
]);
```

### 2. Query Patterns

```typescript
// ✅ Good - Efficient, safe queries
export async function findTripsByRegion(region: string, limit = 20) {
  return await db
    .select()
    .from(trips)
    .where(
      and(
        eq(trips.region, region),
        eq(trips.status, 'active'),
        gte(trips.date, new Date())
      )
    )
    .orderBy(desc(trips.date))
    .limit(limit);
}
```

## Documentation Standards

### 1. JSDoc Comments

```typescript
/**
 * Calculates the distance between two coordinates using Haversine formula
 * 
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point  
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 * 
 * @example
 * ```typescript
 * const distance = calculateDistance(6.9271, 79.8612, 7.2906, 80.6337);
 * console.log(distance); // ~65.5 km
 * ```
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  // Implementation...
}
```

### 2. Component Documentation

```typescript
/**
 * TripBookingForm - Complete trip booking form with validation
 * 
 * Features:
 * - Real-time validation
 * - Payment integration
 * - Accessibility compliance
 * - Mobile responsive
 * 
 * @example
 * ```tsx
 * <TripBookingForm
 *   trip={trip}
 *   onSubmit={handleBooking}
 *   paymentMethods={['card', 'paypal']}
 * />
 * ```
 */
export function TripBookingForm(props: TripBookingFormProps) {
  // Implementation...
}
```

## CI/CD Pipeline

### Quality Gates

1. **Type Checking** - Zero TypeScript errors
2. **Code Linting** - ESLint rules passed
3. **Code Formatting** - Prettier consistency
4. **Unit Tests** - All tests passing
5. **Integration Tests** - API endpoints verified
6. **Security Scan** - Vulnerability assessment
7. **Performance Tests** - Lighthouse audit
8. **Build Verification** - Production build successful

### Deployment Checklist

- [ ] All quality gates passed
- [ ] Database migrations tested
- [ ] Environment variables updated
- [ ] Performance benchmarks met
- [ ] Security scan clean
- [ ] Documentation updated
- [ ] Monitoring configured

## Quality Metrics

### Code Coverage Targets

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: 70%+ coverage
- **Critical Paths**: 95%+ coverage

### Performance Targets

- **Page Load Time**: < 3 seconds
- **API Response Time**: < 500ms
- **Bundle Size**: < 500KB gzipped

### Quality Scores

- **ESLint**: Zero violations
- **TypeScript**: Zero errors
- **Accessibility**: 95%+ Lighthouse score
- **Best Practices**: 90%+ Lighthouse score

---

## Troubleshooting

### Common Issues

**TypeScript Errors**: Run `npm run type-check` for detailed analysis
**Test Failures**: Use `npm run test:watch` for real-time feedback  
**Build Issues**: Check `npm run build` output for specific errors
**Pre-commit Failures**: Review staged files with quality tools

For additional support, see our [FAQ](./FAQ.md) or contact the development team.