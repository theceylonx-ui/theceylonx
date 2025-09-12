import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { queryClient } from "@/lib/queryClient";

interface AuthSignInProps {
  onSuccess?: () => void;
}

export function AuthSignIn({ onSuccess }: AuthSignInProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();





  const handleOAuthProvider = (provider: 'google' | 'facebook') => {
    window.location.href = `/api/auth/${provider}`;
  };



  // Main sign-in screen
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sign in to Ceylon Expand</CardTitle>
        <p className="text-gray-600">Find travel companions and share journeys</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OAuth Providers */}
        <div className="space-y-3">
          {/* Development Login Buttons - Only show in dev mode */}
          {import.meta.env.DEV && (
            <div className="space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="text-sm font-semibold text-purple-700 text-center">🔧 Test Users (Dev Mode)</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const response = await fetch('/api/auth/dev-login', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userType: 'user1' })
                      });
                      if (response.ok) {
                        // Clear cache and force refresh user data
                        queryClient.removeQueries({ queryKey: ["/api/auth/me"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
                        toast({ title: "Logged in as Test User 1" });
                        if (onSuccess) onSuccess();
                        else window.location.href = '/';
                      } else {
                        toast({ title: "Login failed", variant: "destructive" });
                      }
                    } catch (error) {
                      toast({ title: "Login failed", variant: "destructive" });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                  disabled={isLoading}
                  data-testid="button-user1-signin"
                >
                  👤 User 1
                </Button>
                
                <Button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const response = await fetch('/api/auth/dev-login', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userType: 'user2' })
                      });
                      if (response.ok) {
                        // Clear cache and force refresh user data
                        queryClient.removeQueries({ queryKey: ["/api/auth/me"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
                        toast({ title: "Logged in as Test User 2" });
                        if (onSuccess) onSuccess();
                        else window.location.href = '/';
                      } else {
                        toast({ title: "Login failed", variant: "destructive" });
                      }
                    } catch (error) {
                      toast({ title: "Login failed", variant: "destructive" });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                  disabled={isLoading}
                  data-testid="button-user2-signin"
                >
                  👤 User 2
                </Button>
                
                <Button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const response = await fetch('/api/auth/dev-login', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userType: 'organizer' })
                      });
                      if (response.ok) {
                        // Clear cache and force refresh user data
                        queryClient.removeQueries({ queryKey: ["/api/auth/me"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
                        toast({ title: "Logged in as Trip Organizer" });
                        if (onSuccess) onSuccess();
                        else window.location.href = '/';
                      } else {
                        toast({ title: "Login failed", variant: "destructive" });
                      }
                    } catch (error) {
                      toast({ title: "Login failed", variant: "destructive" });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs"
                  disabled={isLoading}
                  data-testid="button-organizer-signin"
                >
                  🎯 Organizer
                </Button>
                
                <Button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const response = await fetch('/api/auth/dev-login', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userType: 'system-user' })
                      });
                      if (response.ok) {
                        // Clear cache and force refresh user data
                        queryClient.removeQueries({ queryKey: ["/api/auth/me"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
                        toast({ title: "Logged in as System User" });
                        if (onSuccess) onSuccess();
                        else window.location.href = '/';
                      } else {
                        toast({ title: "Login failed", variant: "destructive" });
                      }
                    } catch (error) {
                      toast({ title: "Login failed", variant: "destructive" });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-xs"
                  disabled={isLoading}
                  data-testid="button-system-signin"
                >
                  ⚙️ System
                </Button>
              </div>
            </div>
          )}
          
          <Button 
            onClick={() => handleOAuthProvider('google')}
            variant="outline" 
            className="w-full"
            data-testid="button-google-signin"
          >
            <FaGoogle className="h-4 w-4 mr-2" />
            Continue with Google
          </Button>

          <Button 
            onClick={() => handleOAuthProvider('facebook')}
            variant="outline" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            data-testid="button-facebook-signin"
          >
            <FaFacebook className="h-4 w-4 mr-2" />
            Continue with Facebook
          </Button>

        </div>

      </CardContent>
    </Card>
  );
}