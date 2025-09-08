import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon, MoveUp, MoveDown, Star, Zap } from "lucide-react";
import { compressImage, getOptimalCompressionSettings, formatFileSize } from "@/lib/imageCompression";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface MediaItem {
  url: string;
  alt?: string;
  caption?: string;
}

interface MediaUploaderProps {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  coverImageIndex: number;
  onCoverImageChange: (index: number) => void;
  maxFiles?: number;
  error?: string;
  className?: string;
}

export function MediaUploader({
  value,
  onChange,
  coverImageIndex,
  onCoverImageChange,
  maxFiles = 12,
  error,
  className
}: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);
  
  const handleFiles = useCallback(async (files: File[]) => {
    if (value.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }
    
    setIsCompressing(true);
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    
    try {
      const compressedItems: MediaItem[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
          alert('Only image files are allowed');
          continue;
        }
        
        try {
          // Get optimal compression settings based on file size
          const compressionOptions = getOptimalCompressionSettings(file);
          
          // Compress the image
          const result = await compressImage(file, compressionOptions);
          
          totalOriginalSize += result.originalSize;
          totalCompressedSize += result.compressedSize;
          
          const newItem: MediaItem = {
            url: result.compressedFile,
            alt: '',
            caption: ''
          };
          
          compressedItems.push(newItem);
        } catch (error) {
          console.error('Error compressing image:', error);
          // Fallback to original file if compression fails
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const newItem: MediaItem = {
                url: e.target?.result as string,
                alt: '',
                caption: ''
              };
              compressedItems.push(newItem);
              resolve();
            };
            reader.onerror = () => {
              console.error('Error reading file:', file.name);
              resolve(); // Still resolve to continue with other files
            };
            reader.readAsDataURL(file);
          });
        }
      }
      
      // Update compression stats
      if (totalOriginalSize > 0) {
        const compressionRatio = ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100;
        setCompressionStats({
          originalSize: totalOriginalSize,
          compressedSize: totalCompressedSize,
          compressionRatio
        });
      }
      
      // Add compressed items to the current value
      const newValue = [...value, ...compressedItems];
      onChange(newValue);
    } finally {
      setIsCompressing(false);
    }
  }, [value, onChange, maxFiles]);
  
  const removeItem = useCallback((index: number) => {
    const newItems = value.filter((_, i) => i !== index);
    onChange(newItems);
    
    // Adjust cover image index if needed
    if (coverImageIndex === index) {
      onCoverImageChange(0);
    } else if (coverImageIndex > index) {
      onCoverImageChange(coverImageIndex - 1);
    }
  }, [value, onChange, coverImageIndex, onCoverImageChange]);
  
  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= value.length) return;
    
    const newItems = [...value];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    onChange(newItems);
    
    // Adjust cover image index
    if (coverImageIndex === fromIndex) {
      onCoverImageChange(toIndex);
    } else if (coverImageIndex === toIndex) {
      onCoverImageChange(fromIndex > toIndex ? coverImageIndex + 1 : coverImageIndex - 1);
    }
  }, [value, onChange, coverImageIndex, onCoverImageChange]);
  
  const updateItemMetadata = useCallback((index: number, field: 'alt' | 'caption', newValue: string) => {
    const newItems = [...value];
    newItems[index] = { ...newItems[index], [field]: newValue };
    onChange(newItems);
  }, [value, onChange]);
  
  return (
    <div className={className}>
      <Label className="text-sm font-medium mb-4 block">
        Trip Photos <span className="text-gray-500">({value.length}/{maxFiles})</span>
      </Label>
      
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-ceylon-blue bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="media-upload-area"
      >
        {isCompressing ? (
          <div className="space-y-4">
            <Zap className="mx-auto h-12 w-12 text-green-500 animate-pulse" />
            <div className="text-lg font-medium text-gray-900">
              Compressing Images...
            </div>
            <p className="text-sm text-gray-600">
              Optimizing your photos for faster uploads and better performance
            </p>
          </div>
        ) : (
          <>
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">
              {isDragging ? 'Drop images here' : 'Upload trip photos'}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop your images here, or click to browse
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={value.length >= maxFiles || isCompressing}
              data-testid="media-upload-button"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Maximum {maxFiles} images • Auto-compressed for optimal quality
            </p>
            {compressionStats && (
              <div className="mt-3 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2 inline-block">
                <Zap className="inline h-3 w-3 mr-1" />
                Last upload saved {formatFileSize(compressionStats.originalSize - compressionStats.compressedSize)} 
                ({compressionStats.compressionRatio.toFixed(0)}% smaller)
              </div>
            )}
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="media-file-input"
        />
      </div>
      
      {/* Media Grid */}
      {value.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {value.map((item, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-4">
                {/* Image Preview */}
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <img
                    src={item.url}
                    alt={item.alt || `Trip photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    data-testid={`media-item-${index}`}
                  />
                  
                  {/* Cover Badge */}
                  {coverImageIndex === index && (
                    <Badge 
                      className="absolute top-2 left-2 bg-ceylon-green"
                      data-testid={`media-cover-badge-${index}`}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Cover
                    </Badge>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {coverImageIndex !== index && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onCoverImageChange(index)}
                        className="h-7 w-7 p-0"
                        data-testid={`media-set-cover-${index}`}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeItem(index)}
                      className="h-7 w-7 p-0"
                      data-testid={`media-remove-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Move Buttons */}
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => moveItem(index, index - 1)}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                      data-testid={`media-move-up-${index}`}
                    >
                      <MoveUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => moveItem(index, index + 1)}
                      disabled={index === value.length - 1}
                      className="h-6 w-6 p-0"
                      data-testid={`media-move-down-${index}`}
                    >
                      <MoveDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Metadata Inputs */}
                <div className="space-y-2">
                  <Input
                    placeholder="Alt text (for accessibility)"
                    value={item.alt || ''}
                    onChange={(e) => updateItemMetadata(index, 'alt', e.target.value)}
                    className="text-sm"
                    data-testid={`media-alt-${index}`}
                  />
                  <Textarea
                    placeholder="Caption (optional)"
                    value={item.caption || ''}
                    onChange={(e) => updateItemMetadata(index, 'caption', e.target.value)}
                    className="text-sm resize-none"
                    rows={2}
                    data-testid={`media-caption-${index}`}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600 mt-2" data-testid="media-uploader-error">
          {error}
        </p>
      )}
    </div>
  );
}