import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Flag, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReportTripDialogProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tripReportReasons = [
  {
    value: "misleading_details",
    label: "Misleading Trip Details",
    description: "Dates, route, or costs don't match what's actually being offered",
  },
  {
    value: "inappropriate_content",
    label: "Inappropriate Content",
    description: "Trip title, description, or photos are inappropriate",
  },
  {
    value: "safety_concern",
    label: "Safety Concern",
    description: "Trip plan raises safety concerns for participants",
  },
  {
    value: "spam",
    label: "Spam or Scam",
    description: "This looks like spam, a scam, or isn't a genuine trip",
  },
  {
    value: "other",
    label: "Other",
    description: "Other reason not listed above",
  },
];

export function ReportTripDialog({ tripId, open, onOpenChange }: ReportTripDialogProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const reportMutation = useMutation({
    mutationFn: async ({ reason, description }: { reason: string; description: string }) => {
      await apiRequest("POST", "/api/reports", {
        context: "trip",
        tripId,
        reason,
        description,
      });
    },
    onSuccess: () => {
      setShowSuccess(true);
      setReason("");
      setDescription("");

      setTimeout(() => {
        onOpenChange(false);
        setShowSuccess(false);
      }, 3000);

      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep our community safe. We'll review this report promptly.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!reason) {
      toast({
        title: "Select a Reason",
        description: "Please select a reason for reporting this trip.",
        variant: "destructive",
      });
      return;
    }

    if (reason === "other" && !description.trim()) {
      toast({
        title: "Additional Details Required",
        description: "Please provide additional details for your report.",
        variant: "destructive",
      });
      return;
    }

    reportMutation.mutate({ reason, description });
  };

  const selectedReason = tripReportReasons.find((r) => r.value === reason);

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Shield className="h-5 w-5" />
              Report Submitted Successfully
            </DialogTitle>
          </DialogHeader>
          <Alert className="border-green-200 bg-green-50">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Thank you for helping keep our community safe. We take all reports seriously and will review this promptly.
            </AlertDescription>
          </Alert>
          <div className="text-sm text-gray-600 text-center">
            This dialog will close automatically...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-report-trip">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Report This Trip
          </DialogTitle>
          <DialogDescription>
            Help us maintain a safe community by reporting misleading, inappropriate, or unsafe trip listings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trip-report-reason">Reason for Report</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="trip-report-reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {tripReportReasons.map((reasonOption) => (
                  <SelectItem key={reasonOption.value} value={reasonOption.value}>
                    <div>
                      <div className="font-medium">{reasonOption.label}</div>
                      <div className="text-xs text-gray-500">{reasonOption.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReason && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>{selectedReason.label}:</strong> {selectedReason.description}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="trip-report-description">
              Additional Details {reason === "other" && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="trip-report-description"
              placeholder="Please provide any additional context that would help our moderation team..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 text-right">
              {description.length}/1000 characters
            </div>
          </div>

          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Important:</strong> False reports may result in restrictions on your account.
              Please only report genuine concerns.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={reportMutation.isPending || !reason}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {reportMutation.isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
