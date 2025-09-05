/**
 * TripBreadcrumbs component for Ceylon Expand trip detail pages
 * Displays breadcrumb navigation: Home / Trips / {Region} / {Destination} / {Title}
 */
import { Link } from "wouter";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { createBackToTripsLink } from "@/utils/searchParams";
import type { TripWithNormalizedOrganizer } from "@shared/schema";

interface TripBreadcrumbsProps {
  trip: TripWithNormalizedOrganizer;
  className?: string;
}

export function TripBreadcrumbs({ trip, className }: TripBreadcrumbsProps) {
  const tripsLink = createBackToTripsLink('/trips');
  
  // Helper to format region name for display
  const formatRegionName = (region: string) => {
    return region
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper to format destination for display
  const formatDestination = (destination: string) => {
    return destination
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Truncate title if too long for breadcrumbs
  const formatTitle = (title: string) => {
    return title.length > 30 ? `${title.substring(0, 27)}...` : title;
  };

  return (
    <div className={className}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={tripsLink}>Trips</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/trips?region=${trip.region}`}>
                {formatRegionName(trip.region)}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/trips?to=${encodeURIComponent(trip.toLocation)}`}>
                {formatDestination(trip.toLocation)}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {formatTitle(trip.title)}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}