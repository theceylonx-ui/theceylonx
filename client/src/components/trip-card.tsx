import { Link } from "wouter";
import { MapPin, Calendar, Users, DollarSign, Mail, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import type { TripWithOrganizer } from "@shared/schema";

interface TripCardProps {
  trip: TripWithOrganizer;
}

export default function TripCard({ trip }: TripCardProps) {
  const { user } = useAuth();

  const handleContact = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      window.location.href = '/auth/signin';
      return;
    }
    
    if (trip.contactInfo.includes("@")) {
      window.open(`mailto:${trip.contactInfo}`, "_blank");
    } else {
      // Remove all non-digits and open WhatsApp
      const phoneNumber = trip.contactInfo.replace(/\D/g, "");
      window.open(`https://wa.me/${phoneNumber}`, "_blank");
    }
  };

  const getRegionColor = (region: string) => {
    const colors: Record<string, string> = {
      'western': 'bg-ceylon-green',
      'southern': 'bg-ceylon-blue', 
      'central': 'bg-orange-500',
      'northern': 'bg-purple-500',
      'eastern': 'bg-pink-500',
      'northwestern': 'bg-indigo-500',
      'north-central': 'bg-yellow-500',
      'sabaragamuwa': 'bg-red-500',
      'uva': 'bg-teal-500',
    };
    return colors[region] || 'bg-gray-500';
  };

  const getDestinationImage = (region: string, fromLocation: string, toLocation: string) => {
    // Generate appropriate images based on destination
    if (region === 'southern' || toLocation.toLowerCase().includes('galle') || toLocation.toLowerCase().includes('mirissa')) {
      return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200';
    } else if (region === 'central' || toLocation.toLowerCase().includes('kandy') || toLocation.toLowerCase().includes('nuwara')) {
      return 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200';
    } else if (toLocation.toLowerCase().includes('sigiriya') || region === 'north-central') {
      return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200';
    } else {
      return 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200';
    }
  };

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group" data-testid={`trip-card-${trip.id}`}>
        <div className="relative">
          <img 
            src={getDestinationImage(trip.region, trip.fromLocation, trip.toLocation)}
            alt={`${trip.fromLocation} to ${trip.toLocation}`}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200';
            }}
          />
          <div className="absolute top-3 right-3">
            <Badge 
              className={`${getRegionColor(trip.region)} text-white border-0`}
              data-testid={`trip-region-${trip.id}`}
            >
              {trip.region.charAt(0).toUpperCase() + trip.region.slice(1)}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2" data-testid={`trip-title-${trip.id}`}>
              {trip.title}
            </h3>
          </div>
          
          <div className="space-y-3 mb-4 text-gray-600 text-sm">
            <div className="flex items-center" data-testid={`trip-route-${trip.id}`}>
              <MapPin className="h-4 w-4 mr-2 text-ceylon-blue flex-shrink-0" />
              <span className="truncate">{trip.fromLocation} → {trip.toLocation}</span>
            </div>
            
            <div className="flex items-center" data-testid={`trip-datetime-${trip.id}`}>
              <Calendar className="h-4 w-4 mr-2 text-ceylon-blue flex-shrink-0" />
              <span>{new Date(trip.date).toLocaleDateString()} • {trip.time}</span>
            </div>
            
            <div className="flex items-center" data-testid={`trip-seats-${trip.id}`}>
              <Users className="h-4 w-4 mr-2 text-ceylon-blue flex-shrink-0" />
              <span>{trip.seatsAvailable} seats available</span>
            </div>
            
            <div className="flex items-center" data-testid={`trip-price-${trip.id}`}>
              <DollarSign className="h-4 w-4 mr-2 text-ceylon-blue flex-shrink-0" />
              <span className="font-semibold text-ceylon-green">LKR {trip.price}/person</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-2" data-testid={`trip-organizer-${trip.id}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={trip.organizer?.profileImageUrl || ""} />
                <AvatarFallback className="text-xs">
                  {trip.organizer?.firstName?.[0] || 'U'}{trip.organizer?.lastName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600 truncate max-w-[120px]">
                {trip.organizer?.firstName || 'Unknown'} {trip.organizer?.lastName?.[0] || ''}.
              </span>
            </div>
            
            <Button 
              size="sm"
              className={`text-xs px-3 py-1 ${user 
                ? 'bg-ceylon-green text-white hover:bg-ceylon-green/90' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              onClick={handleContact}
              data-testid={`button-contact-${trip.id}`}
            >
              {user ? (
                <>
                  <Mail className="h-3 w-3 mr-1" />
                  Contact
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Sign in to Contact
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
