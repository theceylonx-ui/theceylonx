import { PreferencesForm } from "@/components/preferences/PreferencesForm";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Settings } from "lucide-react";

export default function PreferencesPage() {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/me" className="inline-flex items-center text-orange-600 hover:text-orange-700 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
            
            <div className="flex items-center gap-2 text-gray-600">
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </div>
          </div>
          
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Travel Preferences
            </h1>
            <p className="text-lg text-gray-600">
              Tell us about your travel style to get personalized trip recommendations 
              tailored just for you.
            </p>
          </div>
        </div>

        {/* Preferences Form */}
        <div className="mb-8">
          <PreferencesForm />
        </div>

      </div>
    </div>
  );
}