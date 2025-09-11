import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormValidationErrorProps {
  errors: string[];
  onDismiss?: () => void;
  title?: string;
}

export function FormValidationError({ 
  errors, 
  onDismiss, 
  title = "Please fix the following errors:" 
}: FormValidationErrorProps) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="relative" data-testid="form-validation-errors">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900"
            onClick={onDismiss}
            data-testid="button-dismiss-errors"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <div className="pr-8">
          <p className="font-medium mb-2">{title}</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {errors.map((error, index) => (
              <li key={index} data-testid={`error-item-${index}`}>
                {error}
              </li>
            ))}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default FormValidationError;