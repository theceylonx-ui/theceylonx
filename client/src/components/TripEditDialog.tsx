import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { TripWithOrganizer } from "@shared/schema";
import { MapPin, Calendar, Users, DollarSign, Camera, Upload, Zap } from "lucide-react";
import { compressImage, getOptimalCompressionSettings, formatFileSize } from "@/lib/imageCompression";

interface TripEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripWithOrganizer;
}

interface CategoryOption {
  value: string;
  label: string;
}


export function TripEditDialog({ isOpen, onClose, trip }: TripEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState(trip.imageUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [newUploadedImage, setNewUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: trip.title,
    fromLocation: trip.fromLocation,
    toLocation: trip.toLocation,
    date: trip.date ? new Date(trip.date).toISOString().split('T')[0] : "",
    time: trip.time,
    seatsAvailable: trip.seatsAvailable,
    price: trip.price?.toString() || "",
    region: trip.region,
    category: (trip as any).category || "roadtrip",
    notes: (trip as any).notes || "",
  });

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const compressionOptions = getOptimalCompressionSettings(file);
      const result = await compressImage(file, compressionOptions);
      
      // Automatically remove existing image when uploading new one
      setNewUploadedImage(result.compressedFile);
      setSelectedImage(""); // Clear existing selected image
      
      toast({
        title: "Image uploaded!",
        description: `Image compressed by ${result.compressionRatio.toFixed(0)}% (${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)})`,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: trip.title,
        fromLocation: trip.fromLocation,
        toLocation: trip.toLocation,
        date: trip.date ? new Date(trip.date).toISOString().split('T')[0] : "",
        time: trip.time,
        seatsAvailable: trip.seatsAvailable,
        price: trip.price?.toString() || "",
        region: trip.region,
        category: (trip as any).category || "roadtrip",
        notes: (trip as any).notes || "",
      });
      setSelectedImage(trip.imageUrl || "");
      setNewUploadedImage(null);
    }
  }, [isOpen, trip]);

  // Fetch categories
  const { data: categoriesData } = useQuery<{ categories: CategoryOption[] }>({
    queryKey: ["/api/categories"],
    enabled: isOpen,
  });


  const updateTripMutation = useMutation({
    mutationFn: async (data: any) => {
      const updateData = {
        ...data,
      };
      
      // Handle image updates
      if (newUploadedImage) {
        // New image uploaded - use it and clear any existing image
        updateData.mediaUrls = [newUploadedImage];
        updateData.coverImageIndex = 0;
        updateData.selectedCategoryImage = ""; // Clear existing image
      } else if (selectedImage) {
        // Keep existing selected image
        updateData.selectedCategoryImage = selectedImage;
      } else {
        // No image selected - clear both
        updateData.selectedCategoryImage = "";
        updateData.mediaUrls = [];
      }
      
      return await apiRequest("PATCH", `/api/trips/${trip.id}`, updateData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trip updated successfully!",
      });
      onClose();
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/trips"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update trip. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only include fields that have actually changed to avoid date conversion issues
    const updatedData: any = {};
    
    if (formData.title !== trip.title) updatedData.title = formData.title;
    if (formData.fromLocation !== trip.fromLocation) updatedData.fromLocation = formData.fromLocation;
    if (formData.toLocation !== trip.toLocation) updatedData.toLocation = formData.toLocation;
    if (formData.time !== trip.time) updatedData.time = formData.time;
    if (formData.seatsAvailable !== trip.seatsAvailable) updatedData.seatsAvailable = formData.seatsAvailable;
    if (formData.price !== trip.price?.toString()) updatedData.price = parseFloat(formData.price) || 0;
    if (formData.region !== trip.region) updatedData.region = formData.region;
    if (formData.category !== (trip as any).category) updatedData.category = formData.category;
    if (formData.notes !== (trip as any).notes) updatedData.notes = formData.notes;
    
    // Handle date separately to avoid conversion issues
    const currentDate = trip.date ? new Date(trip.date).toISOString().split('T')[0] : "";
    if (formData.date !== currentDate) {
      updatedData.date = formData.date;
    }
    
    updateTripMutation.mutate(updatedData);
  };

  const regions = [
    "western", "southern", "central", "northern", "eastern", 
    "northwestern", "north central", "sabaragamuwa", "uva"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trip Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Trip Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter trip title..."
              required
              data-testid="input-edit-title"
            />
          </div>

          {/* Route */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromLocation">
                <MapPin className="inline h-4 w-4 mr-1" />
                From Location
              </Label>
              <Input
                id="fromLocation"
                value={formData.fromLocation}
                onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
                placeholder="Departure location"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toLocation">
                <MapPin className="inline h-4 w-4 mr-1" />
                To Location
              </Label>
              <Input
                id="toLocation"
                value={formData.toLocation}
                onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                placeholder="Destination location"
                required
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Seats & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seats">
                <Users className="inline h-4 w-4 mr-1" />
                Available Seats
              </Label>
              <Input
                id="seats"
                type="number"
                min="1"
                max="20"
                value={formData.seatsAvailable}
                onChange={(e) => setFormData({ ...formData, seatsAvailable: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Price (LKR)
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Region & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select
                value={formData.region}
                onValueChange={(value) => setFormData({ ...formData, region: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region.charAt(0).toUpperCase() + region.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">
                <Camera className="inline h-4 w-4 mr-1" />
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesData?.categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image Options */}
          <div className="space-y-3">
            <Label>Trip Image</Label>
            <div className="space-y-3">
              {/* Remove existing image option */}
              {trip.imageUrl && (
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <img 
                    src={trip.imageUrl} 
                    alt="Current trip image" 
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Current Image</p>
                    <p className="text-xs text-gray-500">Currently used for this trip</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedImage("")}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              )}
              
              {/* New upload option */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg border-dashed hover:border-ceylon-green cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}>
                {newUploadedImage ? (
                  <img 
                    src={newUploadedImage} 
                    alt="New uploaded image" 
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : isUploading ? (
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                    <Zap className="w-8 h-8 text-green-500 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {newUploadedImage ? "New Image Selected" : isUploading ? "Compressing..." : "Upload New Image"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isUploading ? "Optimizing for best quality" : "Click to select an image file"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  {isUploading ? "Processing..." : newUploadedImage ? "Change" : "Browse"}
                </Button>
              </div>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information about your trip..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateTripMutation.isPending}
              className="bg-ceylon-green hover:bg-ceylon-green/90"
            >
              {updateTripMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}