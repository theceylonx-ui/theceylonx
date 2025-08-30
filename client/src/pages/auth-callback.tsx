import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import logoImage from "@assets/5_1756417819316.png";

export default function AuthCallbackPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === '1') {
      setStatus('success');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } else if (error) {
      setStatus('error');
      switch (error) {
        case 'oauth_failed':
          setErrorMessage('OAuth authentication failed');
          break;
        case 'callback_failed':
          setErrorMessage('Authentication callback failed');
          break;
        case 'invalid_link':
          setErrorMessage('Invalid or malformed authentication link');
          break;
        case 'invalid_or_expired':
          setErrorMessage('Authentication link has expired or is invalid');
          break;
        case 'verification_failed':
          setErrorMessage('Email verification failed');
          break;
        default:
          setErrorMessage('Authentication failed');
      }
    } else {
      // No success or error parameter, redirect to signin
      navigate('/auth/signin');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-ceylon-green/10 to-ceylon-orange/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={logoImage} 
            alt="Ceylon Expand" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900">Ceylon Expand</h1>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === 'processing' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-ceylon-green" />
                <p className="text-gray-600">Processing authentication...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <div>
                  <p className="font-medium text-green-700">Authentication successful!</p>
                  <p className="text-sm text-gray-600 mt-1">Welcome to Ceylon Expand. Redirecting to home page...</p>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 mx-auto text-red-500" />
                <div>
                  <p className="font-medium text-red-700">Authentication failed</p>
                  <p className="text-sm text-gray-600 mt-1">{errorMessage}</p>
                </div>
                <Button 
                  onClick={() => navigate('/auth/signin')}
                  className="w-full"
                  data-testid="button-retry-signin"
                >
                  Try Again
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}