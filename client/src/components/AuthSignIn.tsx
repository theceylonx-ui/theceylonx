import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { emailAuthSchema, phoneStartSchema, phoneVerifySchema, type EmailAuth, type PhoneStart, type PhoneVerify } from "@shared/schema";
import { Mail, Phone, Smartphone } from "lucide-react";
import { FaGoogle, FaMicrosoft, FaApple } from "react-icons/fa";

interface AuthSignInProps {
  onSuccess?: () => void;
}

export function AuthSignIn({ onSuccess }: AuthSignInProps) {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | null>(null);
  const [phoneStep, setPhoneStep] = useState<'enter' | 'verify'>('enter');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  // Email form
  const emailForm = useForm<EmailAuth>({
    resolver: zodResolver(emailAuthSchema),
    defaultValues: { email: "" },
  });

  // Phone forms
  const phoneForm = useForm<PhoneStart>({
    resolver: zodResolver(phoneStartSchema),
    defaultValues: { phone: "" },
  });

  const verifyForm = useForm<PhoneVerify>({
    resolver: zodResolver(phoneVerifySchema),
    defaultValues: { phone: "", code: "" },
  });

  const handleEmailAuth = async (data: EmailAuth) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/email/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      setEmailSent(true);
      toast({
        title: "Email sent!",
        description: "Check your email for a magic link to sign in.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  if (authMethod === 'email') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Sign in with Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!emailSent ? (
            <form onSubmit={emailForm.handleSubmit(handleEmailAuth)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...emailForm.register("email")}
                  data-testid="input-email"
                />
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-red-600">{emailForm.formState.errors.email.message}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-send-magic-link"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isLoading ? "Sending..." : "Continue with Email"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <Mail className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">Check your email!</p>
                <p className="text-sm text-gray-600">
                  We sent a magic link to {emailForm.getValues('email')}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => { setEmailSent(false); setAuthMethod(null); }}
                className="w-full"
                data-testid="button-back-to-signin"
              >
                Back to sign in options
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

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

        {/* Email and Phone Options */}
        <div className="space-y-3">
          <Button 
            onClick={() => setAuthMethod('email')}
            variant="outline" 
            className="w-full"
            data-testid="button-email-signin"
          >
            <Mail className="h-4 w-4 mr-2" />
            Continue with Email
          </Button>

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