import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import newLogo from "@assets/Copy of CEY  X Letter Digital Company Logo.png";

export default function AuthMagicPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyMagicLink = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const email = urlParams.get('email');

      if (!token || !email) {
        setStatus('error');
        setErrorMessage('Invalid magic link');
        return;
      }

      try {
        const response = await fetch(`/api/auth/email/verify?token=${token}&email=${encodeURIComponent(email)}`, {
          method: 'GET',
          credentials: 'include'
        });

        if (response.redirected) {
          // If backend redirects to success page, follow the redirect
          window.location.href = response.url;
          return;
        }

        if (response.ok) {
          setStatus('success');
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          const error = await response.json().catch(() => ({ error: 'Verification failed' }));
          setStatus('error');
          setErrorMessage(error.error || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage('Network error occurred');
      }
    };

    verifyMagicLink();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-ceylon-green/10 to-ceylon-orange/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={newLogo} 
            alt="Ceylon Expand" 
            className="h-16 w-auto mx-auto mb-4"
            width="64"
            height="64"
            loading="eager"
          />
          <h1 className="text-3xl font-bold text-gray-900">Ceylon Expand</h1>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle>Email Verification</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === 'verifying' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-ceylon-green" />
                <p className="text-gray-600">Verifying your email...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <div>
                  <p className="font-medium text-green-700">Email verified successfully!</p>
                  <p className="text-sm text-gray-600 mt-1">You are now signed in. Redirecting to home page...</p>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 mx-auto text-red-500" />
                <div>
                  <p className="font-medium text-red-700">Verification failed</p>
                  <p className="text-sm text-gray-600 mt-1">{errorMessage}</p>
                </div>
                <Button 
                  onClick={() => navigate('/auth/signin')}
                  className="w-full"
                  data-testid="button-back-to-signin"
                >
                  Back to Sign In
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}