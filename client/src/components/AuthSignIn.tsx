import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { phoneStartSchema, phoneVerifySchema, type PhoneStart, type PhoneVerify } from "@shared/schema";
import { Phone, Smartphone } from "lucide-react";
import { FaGoogle, FaMicrosoft, FaApple } from "react-icons/fa";

interface AuthSignInProps {
  onSuccess?: () => void;
}

export function AuthSignIn({ onSuccess }: AuthSignInProps) {
  const [authMethod, setAuthMethod] = useState<'phone' | null>(null);
  const [phoneStep, setPhoneStep] = useState<'enter' | 'verify'>('enter');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();


  // Phone forms
  const phoneForm = useForm<PhoneStart>({
    resolver: zodResolver(phoneStartSchema),
    defaultValues: { phone: "" },
  });

  const verifyForm = useForm<PhoneVerify>({
    resolver: zodResolver(phoneVerifySchema),
    defaultValues: { phone: "", code: "" },
  });


  const handlePhoneStart = async (data: PhoneStart) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send code');
      }

      verifyForm.setValue('phone', data.phone);
      setPhoneStep('verify');
      toast({
        title: "Code sent!",
        description: "Check your phone for a verification code.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneVerify = async (data: PhoneVerify) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid code');
      }

      toast({
        title: "Success!",
        description: "Phone verification successful. You are now signed in.",
      });
      
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Verification failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthProvider = (provider: 'google' | 'microsoft' | 'apple') => {
    window.location.href = `/api/auth/${provider}`;
  };


  if (authMethod === 'phone') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Sign in with Phone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {phoneStep === 'enter' ? (
            <form onSubmit={phoneForm.handleSubmit(handlePhoneStart)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  {...phoneForm.register("phone")}
                  data-testid="input-phone"
                />
                <p className="text-xs text-gray-500">Include country code (e.g., +1 for US)</p>
                {phoneForm.formState.errors.phone && (
                  <p className="text-sm text-red-600">{phoneForm.formState.errors.phone.message}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-send-code"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                {isLoading ? "Sending..." : "Send Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyForm.handleSubmit(handlePhoneVerify)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  {...verifyForm.register("code")}
                  data-testid="input-verification-code"
                />
                <p className="text-xs text-gray-500">
                  Code sent to {verifyForm.getValues('phone')}
                </p>
                {verifyForm.formState.errors.code && (
                  <p className="text-sm text-red-600">{verifyForm.formState.errors.code.message}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-verify-code"
              >
                <Phone className="h-4 w-4 mr-2" />
                {isLoading ? "Verifying..." : "Verify & Continue"}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setPhoneStep('enter')}
                className="w-full"
                data-testid="button-back-to-phone"
              >
                Back to phone number
              </Button>
            </form>
          )}
          
          <Button 
            variant="ghost" 
            onClick={() => setAuthMethod(null)}
            className="w-full text-sm"
            data-testid="button-back-to-signin"
          >
            Back to sign in options
          </Button>
        </CardContent>
      </Card>
    );
  }

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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Phone Option */}
        <div className="space-y-3">
          <Button 
            onClick={() => setAuthMethod('phone')}
            variant="outline" 
            className="w-full"
            data-testid="button-phone-signin"
          >
            <Phone className="h-4 w-4 mr-2" />
            Continue with Phone
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}