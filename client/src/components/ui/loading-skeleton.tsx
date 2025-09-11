import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-ui-line/40",
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
}

// Pre-built skeleton components for common use cases

export function TripCardSkeleton() {
  return (
    <div className="card-base space-y-4" data-testid="trip-card-skeleton">
      <div className="flex items-start space-x-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
}

export function UserProfileSkeleton() {
  return (
    <div className="space-y-4" data-testid="user-profile-skeleton">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export function QuestionCardSkeleton() {
  return (
    <div className="card-base space-y-4" data-testid="question-card-skeleton">
      <div className="flex items-start space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      
      <div className="flex items-center space-x-4">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-4" data-testid="page-header-skeleton">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
      <div className="flex space-x-2">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function NavigationSkeleton() {
  return (
    <div className="flex items-center justify-between p-4" data-testid="navigation-skeleton">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-6 w-32" />
      </div>
      
      <div className="hidden md:flex items-center space-x-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
      
      <div className="flex items-center space-x-2">
        <Skeleton className="h-9 w-16 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" data-testid="list-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card-base">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6" data-testid="form-skeleton">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-18" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Skeleton className="h-11 w-24 rounded-lg" />
        <Skeleton className="h-11 w-20 rounded-lg" />
      </div>
    </div>
  );
}