import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Clock } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface DestructiveActionButtonProps {
  action: string;
  permission: string;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  buttonText: string;
  variant?: "destructive" | "outline" | "secondary";
  size?: "sm" | "default" | "lg";
  disabled?: boolean;
  requiresStepUp?: boolean;
  children?: React.ReactNode;
}

export function DestructiveActionButton({
  action,
  permission,
  onConfirm,
  title,
  description,
  buttonText,
  variant = "destructive",
  size = "default",
  disabled = false,
  requiresStepUp = true,
  children
}: DestructiveActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const { adminUser, hasPermission } = useAdminAuth();

  // Check if user has permission
  const canPerform = hasPermission(permission);
  
  // Check if step-up auth is needed (simulated - would integrate with actual step-up flow)
  const needsStepUp = requiresStepUp && adminUser?.lastAuthTime && 
    (Date.now() - new Date(adminUser.lastAuthTime).getTime()) > (5 * 60 * 1000); // 5 minutes

  const handleConfirm = async () => {
    if (!canPerform) return;
    
    setIsExecuting(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to execute destructive action:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  if (!canPerform) {
    return (
      <Button variant="ghost" size={size} disabled className="opacity-50">
        <Shield className="h-4 w-4 mr-2" />
        {buttonText}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        data-testid={`button-${action}`}
      >
        {children || (
          <>
            <AlertTriangle className="h-4 w-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{description}</p>
              
              {needsStepUp && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    This action requires fresh authentication. Please re-authenticate to continue.
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 h-auto ml-2"
                      onClick={() => {
                        // Trigger step-up auth flow
                        window.location.href = '/api/auth/stepup?returnTo=' + encodeURIComponent(window.location.pathname);
                      }}
                    >
                      Re-authenticate
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="text-sm text-muted-foreground">
                <strong>Action:</strong> {action}<br />
                <strong>Permission:</strong> {permission}<br />
                <strong>Your Role:</strong> {adminUser?.role}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isExecuting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isExecuting || Boolean(needsStepUp)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isExecuting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Executing...
                </>
              ) : (
                `Confirm ${action}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}