import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users, MessageSquare, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import type { TripWithOrganizer, QuestionWithDetails } from "@shared/schema";

export default function DestinationPage() {
  const [match, params] = useRoute("/destination/:city");
  const { user } = useAuth();
  const [showAllTrips, setShowAllTrips] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  
  const city = params?.city ? decodeURIComponent(params.city) : "";

  // Fetch trips related to this destination
  const { data: tripsResponse, isLoading: tripsLoading } = useQuery<{trips: TripWithOrganizer[], pagination: any}>({
    queryKey: ['/api/trips', 'destination', city],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('search', city);
      return fetch(`/api/trips?${params.toString()}`).then(res => res.json());
    },
    enabled: !!city,
  });
  
  const trips = tripsResponse?.trips || [];

  // Fetch community questions related to this destination
  const { data: questionsResponse, isLoading: questionsLoading } = useQuery<{questions: QuestionWithDetails[], total: number}>({
    queryKey: ['/api/questions', 'destination', city],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('q', city);
      return fetch(`/api/questions?${params.toString()}`).then(res => res.json());
    },
    enabled: !!city,
  });
  
  const questions = questionsResponse?.questions || [];

  const handleSeeMoreTrips = () => {
    if (user) {
      setShowAllTrips(true);
    } else {
      window.location.href = '/auth/signin';
    }
  };

  const handleSeeMoreQuestions = () => {
    if (user) {
      setShowAllQuestions(true);
    } else {
      window.location.href = '/auth/signin';
    }
  };

  if (!match) {
    return <div>Destination not found</div>;
  }

  const displayedTrips = showAllTrips ? trips : trips.slice(0, 3);
  const displayedQuestions = showAllQuestions ? questions : questions.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-ceylon-green to-ceylon-blue rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <MapPin className="w-8 h-8" />
                <h1 className="text-3xl md:text-4xl font-bold">{city}</h1>
              </div>
              <p className="text-lg opacity-90">
                Discover trips and community discussions about {city}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Trips Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Available Trips
                </h2>
                <Badge variant="secondary" className="text-sm">
                  {trips.length} trip{trips.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {tripsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                          <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : displayedTrips.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No trips found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      No trips to {city} are currently available.
                    </p>
                    <Link href="/post">
                      <Button>Post a Trip to {city}</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {displayedTrips.map((trip) => (
                    <Card key={trip.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              {trip.title}
                            </h3>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-4">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {trip.fromLocation} → {trip.toLocation}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(trip.date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-ceylon-green">
                              LKR {trip.price}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Users className="w-4 h-4 mr-1" />
                              {trip.seatsAvailable} seats
                            </div>
                          </div>
                        </div>
                        
                        {trip.notes && (
                          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                            {trip.notes}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            by {trip.organizer?.firstName} {trip.organizer?.lastName}
                          </div>
                          <Link href={`/trips/${trip.id}`}>
                            <Button size="sm">
                              View Details
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {trips.length > 3 && !showAllTrips && (
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        onClick={handleSeeMoreTrips}
                        className="w-full"
                      >
                        See More Trips ({trips.length - 3} more)
                        {!user && " - Sign in required"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Community Questions Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Community Discussions
                </h2>
                <Badge variant="secondary" className="text-sm">
                  {questions.length} question{questions.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {questionsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                          <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : displayedQuestions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No discussions found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      No community discussions about {city} yet.
                    </p>
                    <Link href="/community">
                      <Button>Ask a Question about {city}</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {displayedQuestions.map((question) => (
                    <Card key={question.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {question.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                          {question.body.replace(/<[^>]*>/g, '')}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span>{question.user?.firstName || 'Anonymous'}</span>
                            <span>{formatDistanceToNow(new Date(question.createdAt || new Date()), { addSuffix: true })}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              {question.answersCount}
                            </div>
                            <div className="flex items-center">
                              <span className="text-ceylon-green">↑</span>
                              {question.votesCount}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {questions.length > 3 && !showAllQuestions && (
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        onClick={handleSeeMoreQuestions}
                        className="w-full"
                      >
                        See More Discussions ({questions.length - 3} more)
                        {!user && " - Sign in required"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}