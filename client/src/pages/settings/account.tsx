import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Download, Trash2, AlertTriangle } from "lucide-react";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function AccountSettingsPage() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  // States for actions
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Analytics helper
  const trackEvent = (event: string, data?: Record<string, any>) => {
    console.log(`Analytics: ${event}`, data);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    trackEvent('account.export_data.clicked');
    
    try {
      const response = await fetch('/api/me/export', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Handle download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `ceylon-expand-data-${user?.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      trackEvent('account.export_data.succeeded');
      toast({
        title: "Data export successful",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error) {
      trackEvent('account.export_data.failed');
      toast({
        title: "Export failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast({
        title: "Confirmation required",
        description: "Please type 'DELETE' to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    trackEvent('account.delete.confirmed');

    try {
      const response = await fetch('/api/me', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Check if reauth is needed
        if (response.status === 401) {
          toast({
            title: "Re-authentication required",
            description: "Please sign in again to delete your account.",
            variant: "destructive",
          });
          // In a real implementation, trigger reauth flow here
          return;
        }
        throw new Error('Delete failed');
      }

      trackEvent('account.delete.succeeded');
      
      // Logout and redirect
      await fetch('/api/auth/logout', { method: 'POST' });
      await logout();
      
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      
      setLocation('/');
    } catch (error) {
      trackEvent('account.delete.failed');
      toast({
        title: "Deletion failed",
        description: "There was an error deleting your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmText("");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">You must be signed in to access account settings.</p>
            <Button onClick={() => setLocation('/auth/signin')}>Sign In</Button>
          </div>
        </div>
      </div>
    );
  }

  const profileUrl = `/profile/${user.username || user.id}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Profile */}
        <Link href={profileUrl}>
          <Button variant="outline" className="mb-6" data-testid="back-to-profile">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Profile
          </Button>
        </Link>

        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Account Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your account data and privacy settings.
            </p>
          </div>

          {/* Download Your Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Your Data
              </CardTitle>
              <CardDescription>
                Export all your personal data from Ceylon Expand. This includes your profile information, 
                trip history, messages, and other activity data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleExportData}
                disabled={isExporting}
                data-testid="export-data-button"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                    Preparing Download...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Data
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                The download will include your data in JSON format. This may take a few moments for large datasets.
              </p>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your Ceylon Expand account and all associated data. 
                This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">This action is permanent</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Deleting your account will remove all your trips, messages, preferences, 
                      and other data permanently. You won't be able to recover this information.
                    </p>
                  </div>
                </div>
              </div>

              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      trackEvent('account.delete.clicked');
                      setShowDeleteDialog(true);
                    }}
                    data-testid="delete-account-button"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="delete-account-dialog">
                  <DialogHeader>
                    <DialogTitle>Confirm Account Deletion</DialogTitle>
                    <DialogDescription>
                      This will permanently delete your account and all associated data. 
                      This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="delete-confirm">
                        Type <strong>DELETE</strong> to confirm:
                      </Label>
                      <Input
                        id="delete-confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type DELETE to confirm"
                        data-testid="delete-confirm-input"
                      />
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteDialog(false);
                          setDeleteConfirmText("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                        data-testid="confirm-delete-button"
                      >
                        {isDeleting ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                            Deleting...
                          </>
                        ) : (
                          'Delete Account'
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}