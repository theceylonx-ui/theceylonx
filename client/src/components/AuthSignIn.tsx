import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FaGoogle, FaMicrosoft, FaApple } from "react-icons/fa";

interface AuthSignInProps {
  onSuccess?: () => void;
}

export function AuthSignIn({ onSuccess }: AuthSignInProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();





  const handleOAuthProvider = (provider: 'google' | 'microsoft' | 'apple') => {
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
            onClick={() => handleOAuthProvider('microsoft')}
            variant="outline" 
            className="w-full"
            data-testid="button-microsoft-signin"
          >
            <FaMicrosoft className="h-4 w-4 mr-2" />
            Continue with Microsoft
          </Button>

          <Button 
            onClick={() => handleOAuthProvider('apple')}
            variant="outline" 
            className="w-full"
            data-testid="button-apple-signin"
          >
            <FaApple className="h-4 w-4 mr-2" />
            Continue with Apple
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}