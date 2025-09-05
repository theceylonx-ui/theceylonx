import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Lightbulb, 
  Shield, 
  MessageCircle, 
  Users, 
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Info,
  Heart
} from "lucide-react";

interface ChatTipsProps {
  userRole?: "organizer" | "traveler" | "both";
  className?: string;
}

export function ChatTips({ userRole = "both", className = "" }: ChatTipsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("safety");

  const tipCategories = {
    safety: {
      icon: Shield,
      title: "Safety First",
      color: "bg-red-50 border-red-200 text-red-700",
      tips: {
        organizer: [
          "Always verify traveler identity before sharing personal contact details",
          "Meet in public places for initial meetups or trip departures",
          "Keep emergency contacts informed about your trip plans",
          "Trust your instincts - if something feels off, it's okay to cancel",
          "Use the platform's chat system before moving to external communication"
        ],
        traveler: [
          "Research the organizer's profile and previous trip reviews",
          "Share your travel plans with trusted friends or family",
          "Confirm pickup locations and timing in advance", 
          "Have backup transportation options ready",
          "Report any inappropriate behavior immediately"
        ]
      }
    },
    communication: {
      icon: MessageCircle,
      title: "Clear Communication",
      color: "bg-blue-50 border-blue-200 text-blue-700",
      tips: {
        organizer: [
          "Respond to messages promptly to build trust",
          "Be clear about trip expectations, costs, and timing",
          "Share itinerary details and any changes immediately",
          "Use the contact sharing feature when both parties are comfortable",
          "Set boundaries about what you're comfortable sharing"
        ],
        traveler: [
          "Ask specific questions about the trip route and timing",
          "Confirm pickup and drop-off locations clearly",
          "Be upfront about any special requirements or concerns",
          "Respect the organizer's response time and boundaries",
          "Express appreciation for shared rides and experiences"
        ]
      }
    },
    etiquette: {
      icon: Heart,
      title: "Travel Etiquette",
      color: "bg-green-50 border-green-200 text-green-700",
      tips: {
        organizer: [
          "Welcome new travelers warmly and make introductions",
          "Be patient with questions about local customs or directions",
          "Share local insights and recommendations generously",
          "Respect different comfort levels and travel styles",
          "Create an inclusive environment for all participants"
        ],
        traveler: [
          "Be punctual for pickup times and meetups",
          "Come prepared with necessary items and local currency",
          "Show respect for local customs and the organizer's guidance",
          "Contribute positively to group dynamics and conversations",
          "Leave reviews to help future travelers and organizers"
        ]
      }
    },
    logistics: {
      icon: Clock,
      title: "Trip Logistics", 
      color: "bg-purple-50 border-purple-200 text-purple-700",
      tips: {
        organizer: [
          "Confirm final headcount 24 hours before departure",
          "Share weather updates and recommended clothing",
          "Provide clear vehicle description and license plate",
          "Have backup plans for weather or traffic delays",
          "Keep track of payments and provide receipts if needed"
        ],
        traveler: [
          "Confirm your participation 24 hours in advance",
          "Have exact change ready for trip contributions",
          "Check weather and dress appropriately for activities",
          "Save the organizer's contact info for emergency use",
          "Be flexible with minor schedule changes or delays"
        ]
      }
    }
  };

  const getAllTipsForRole = (role: "organizer" | "traveler") => {
    return Object.entries(tipCategories).map(([key, category]) => ({
      categoryKey: key,
      category: category.title,
      icon: category.icon,
      color: category.color,
      tips: category.tips[role] || []
    }));
  };

  const getDisplayTips = () => {
    if (userRole === "both") {
      return tipCategories;
    }
    return Object.fromEntries(
      Object.entries(tipCategories).map(([key, category]) => [
        key,
        {
          ...category,
          tips: {
            [userRole]: category.tips[userRole] || []
          }
        }
      ])
    );
  };

  const displayTips = getDisplayTips();

  return (
    <Card className={`${className}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                <CardTitle className="text-lg">Chat Buddy Tips</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  Travel Smart
                </Badge>
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Category Selection */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(displayTips).map(([key, category]) => {
                const IconComponent = category.icon;
                return (
                  <Button
                    key={key}
                    variant={activeCategory === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(key)}
                    className="flex items-center gap-2"
                  >
                    <IconComponent className="w-4 h-4" />
                    {category.title}
                  </Button>
                );
              })}
            </div>

            {/* Active Category Tips */}
            {activeCategory && displayTips[activeCategory as keyof typeof displayTips] && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${displayTips[activeCategory as keyof typeof displayTips].color}`}>
                  <div className="flex items-center gap-2 mb-3">
                    {React.createElement(displayTips[activeCategory as keyof typeof displayTips].icon, { 
                      className: "w-5 h-5" 
                    })}
                    <h3 className="font-semibold">
                      {displayTips[activeCategory as keyof typeof displayTips].title}
                    </h3>
                  </div>

                  {userRole === "both" ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          For Trip Organizers:
                        </h4>
                        <ul className="space-y-2">
                          {displayTips[activeCategory as keyof typeof displayTips].tips.organizer?.map((tip: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          For Travelers:
                        </h4>
                        <ul className="space-y-2">
                          {displayTips[activeCategory as keyof typeof displayTips].tips.traveler?.map((tip: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {displayTips[activeCategory as keyof typeof displayTips].tips[userRole]?.map((tip: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Quick Safety Reminder */}
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  <p className="font-medium mb-1">Remember:</p>
                  <p>
                    Always prioritize your safety and comfort. If something doesn't feel right, 
                    trust your instincts and don't hesitate to use the report feature or contact support.
                  </p>
                </div>
              </div>
            </div>

            {/* Help Information */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info className="w-3 h-3" />
                <span>
                  Need help? Contact our support team or check our safety guidelines.
                </span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}