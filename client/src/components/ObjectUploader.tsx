import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ObjectUploaderProps {
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (uploadUrl: string) => void;
  buttonClassName?: string;
  children: ReactNode;
  accept?: string;
}

/**
 * A file upload component that renders as a button and handles file upload to object storage.
 * 
 * Features:
 * - Renders as a customizable button that opens file picker
 * - Provides direct-to-storage upload using presigned URLs
 * - Shows upload progress and handles errors
 * - Supports custom file type restrictions
 * 
 * @param props - Component props
 * @param props.maxFileSize - Maximum file size in bytes (default: 5MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 * @param props.onComplete - Callback function called when upload is complete with the upload URL.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 * @param props.accept - File types to accept (e.g., "image/*", ".jpg,.png")
 */
export function ObjectUploader({
  maxFileSize = 5242880, // 5MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  accept = "image/*",
}: ObjectUploaderProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize) {
      toast({
        title: "File too large",
        description: `File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get upload parameters
      const { url, method } = await onGetUploadParameters();

      // Upload file directly to storage
      const uploadResponse = await fetch(url, {
        method,
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      toast({
        title: "Upload successful",
        description: "Your file has been uploaded successfully.",
      });

      // Call completion handler with the upload URL
      onComplete?.(url.split('?')[0]); // Remove query parameters from URL

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept={accept}
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      <Button
        type="button"
        onClick={() => document.getElementById('file-upload')?.click()}
        className={buttonClassName}
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : children}
      </Button>
    </>
  );
}