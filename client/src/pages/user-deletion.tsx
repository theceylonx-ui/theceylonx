import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, AlertTriangle, Shield, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function UserDeletion() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmations, setConfirmations] = useState({
    understand: false,
    permanent: false,
    noRecovery: false,
  });

  const canDelete = confirmations.understand && confirmations.permanent && confirmations.noRecovery;

  const handleDeleteAccount = async () => {
    if (!canDelete || !user) return;
    
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", "/api/user/delete");
      
      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted.",
      });
      
      // Redirect to home page after deletion
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Deletion Failed",
        description: "There was an error deleting your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ceylon-sand to-ceylon-cream flex items-center justify-center">
        <div className="text-ceylon-brown">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ceylon-sand to-ceylon-cream flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-ceylon-brown">Authentication Required</CardTitle>
            <CardDescription>You must be logged in to delete your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/auth")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ceylon-sand to-ceylon-cream py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-700">Delete Your Account</CardTitle>
            <CardDescription className="text-lg">
              Permanently remove your HiBowan account and all associated data
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-ceylon-green mt-0.5" />
                <div>
                  <h3 className="font-semibold text-ceylon-brown">What gets deleted:</h3>
                  <ul className="text-sm text-ceylon-brown/80 mt-2 space-y-1 list-disc list-inside">
                    <li>Your profile information and account details</li>
                    <li>All trips you've organized or joined</li>
                    <li>Your comments, ratings, and reviews</li>
                    <li>Chat messages and conversations</li>
                    <li>Preferences and personalization settings</li>
                    <li>Notification history</li>
                    <li>All activity and interaction data</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-ceylon-brown">Before you delete:</h3>
                  <ul className="text-sm text-ceylon-brown/80 mt-2 space-y-1 list-disc list-inside">
                    <li>Download any data you want to keep</li>
                    <li>Cancel any active trip bookings</li>
                    <li>Transfer any trip ownership if needed</li>
                    <li>Save important contact information</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <h3 className="font-semibold text-ceylon-brown">Confirmation Required</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="understand"
                    checked={confirmations.understand}
                    onCheckedChange={(checked) =>
                      setConfirmations(prev => ({ ...prev, understand: checked as boolean }))
                    }
                    data-testid="checkbox-understand"
                  />
                  <label htmlFor="understand" className="text-sm text-ceylon-brown/80 cursor-pointer">
                    I understand that deleting my account will remove all my data from HiBowan
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="permanent"
                    checked={confirmations.permanent}
                    onCheckedChange={(checked) =>
                      setConfirmations(prev => ({ ...prev, permanent: checked as boolean }))
                    }
                    data-testid="checkbox-permanent"
                  />
                  <label htmlFor="permanent" className="text-sm text-ceylon-brown/80 cursor-pointer">
                    I understand this action is permanent and cannot be reversed
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="noRecovery"
                    checked={confirmations.noRecovery}
                    onCheckedChange={(checked) =>
                      setConfirmations(prev => ({ ...prev, noRecovery: checked as boolean }))
                    }
                    data-testid="checkbox-no-recovery"
                  />
                  <label htmlFor="noRecovery" className="text-sm text-ceylon-brown/80 cursor-pointer">
                    I understand that deleted data cannot be recovered
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation("/preferences")}
                className="sm:flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={!canDelete || isDeleting}
                className="sm:flex-1"
                data-testid="button-delete-account"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting Account...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete My Account
                  </>
                )}
              </Button>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <Info className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Need help or have questions? Contact our support team at{" "}
                <a href="mailto:support@hibowan.srilanka.com" className="underline font-medium">
                  support@hibowan.srilanka.com
                </a>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}