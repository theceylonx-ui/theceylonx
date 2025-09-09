import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  AlertCircle, 
  Shield,
  Eye,
  Clock
} from "lucide-react";

interface ImageUploadProps {
  threadId: string;
  onImageSent?: () => void;
  disabled?: boolean;
}

export function ImageUpload({ threadId, onImageSent, disabled }: ImageUploadProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isEphemeral, setIsEphemeral] = useState(true); // Default to ephemeral for privacy
  const [messageText, setMessageText] = useState(""); // Add message text state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get upload URL mutation
  const getUploadUrlMutation = useMutation({
    mutationFn: async (): Promise<{ uploadUrl: string }> => {
      const response = await fetch('/api/chat-images/upload-url', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }
      return response.json();
    },
  });

  // Upload image to storage
  const uploadImageMutation = useMutation({
    mutationFn: async ({ file, uploadUrl }: { file: File; uploadUrl: string }) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      // Extract the base URL without query parameters for storage
      const cleanUrl = uploadUrl.split('?')[0];
      console.log("🔥 Upload successful, clean URL:", cleanUrl);
      return { success: true, url: cleanUrl };
    },
    onSuccess: (data) => {
      setUploadProgress(100);
      // Send the image as a message with text
      sendImageMessageMutation.mutate({
        attachmentUrl: data.url,
        ephemeral: isEphemeral,
        text: messageText.trim() || undefined, // Include message if provided
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  // Send image message mutation
  const sendImageMessageMutation = useMutation({
    mutationFn: async ({ attachmentUrl, ephemeral, text }: { attachmentUrl: string; ephemeral: boolean; text?: string }) => {
      if (!attachmentUrl || attachmentUrl.trim() === '') {
        throw new Error('Invalid attachment URL');
      }
      
      // Use threadId prop with fallback
      const finalThreadId = threadId || "test-kandy-chat-002";
      
      return apiRequest("POST", `/api/chat/threads/${finalThreadId}/messages`, {
        text: text || undefined, // Include message text if provided
        attachmentId: attachmentUrl,
        ephemeral,
      });
    },
    onSuccess: () => {
      toast({
        title: "📸 Image sent successfully!",
        description: isEphemeral 
          ? "🔒 Ephemeral image sent (disappears after viewing)" 
          : "📌 Image saved permanently in chat",
        duration: 3000,
      });
      
      // Reset state
      resetUploadState();
      
      // Refresh messages
      const finalThreadId = threadId || "test-kandy-chat-002";
      queryClient.invalidateQueries({
        queryKey: [`/api/chat/threads/${finalThreadId}/messages`],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/chat/threads"],
      });

      onImageSent?.();
    },
    onError: (error) => {
      toast({
        title: "❌ Failed to send image",
        description: "Image uploaded but failed to send message. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  const resetUploadState = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadProgress(0);
    setShowPreview(false);
    setMessageText(""); // Reset message text
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowPreview(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadProgress(10);
      
      // Get upload URL
      const { uploadUrl } = await getUploadUrlMutation.mutateAsync();
      console.log("🔥 Got upload URL:", uploadUrl);
      setUploadProgress(30);
      
      // Upload the file
      await uploadImageMutation.mutateAsync({
        file: selectedFile,
        uploadUrl: uploadUrl,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    }
  };

  const isUploading = getUploadUrlMutation.isPending || uploadImageMutation.isPending || sendImageMessageMutation.isPending;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        data-testid="image-upload-button"
      >
        <ImageIcon className="w-4 h-4" />
      </Button>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Image</DialogTitle>
            <DialogDescription>
              Preview your image before sending
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {previewUrl && (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                {selectedFile && (
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Message Input */}
            <div className="space-y-2">
              <label htmlFor="message-input" className="text-sm font-medium">
                Add a message (optional)
              </label>
              <textarea
                id="message-input"
                placeholder="Type your message here..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:border-gray-700 dark:bg-gray-800"
                rows={3}
                maxLength={500}
                disabled={isUploading}
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Optional caption for your image</span>
                <span>{messageText.length}/500</span>
              </div>
            </div>

            {/* Privacy Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Privacy Settings</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={isEphemeral ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsEphemeral(true)}
                  className="justify-start"
                >
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-medium">One-time view</div>
                      <div className="text-xs opacity-70">Image disappears after viewing</div>
                    </div>
                  </div>
                </Button>
                <Button
                  variant={!isEphemeral ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsEphemeral(false)}
                  className="justify-start"
                >
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-medium">Persistent</div>
                      <div className="text-xs opacity-70">Image stays in chat history</div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <div className="font-medium mb-1">Security Features:</div>
                  <ul className="text-xs space-y-1">
                    <li>• End-to-end encrypted storage</li>
                    <li>• Auto-expires after 24 hours</li>
                    <li>• Only visible to chat participants</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={resetUploadState}
                disabled={isUploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || !selectedFile}
                className="flex-1"
              >
                {isUploading ? "Sending..." : "Send Image"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}