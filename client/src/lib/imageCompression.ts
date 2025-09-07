/**
 * Image compression utilities for optimizing file uploads
 * Reduces file size while maintaining visual quality
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  maxSizeKB?: number; // Target file size in KB
  format?: 'jpeg' | 'webp' | 'png';
}

export interface CompressionResult {
  compressedFile: string; // base64 data URL
  originalSize: number; // bytes
  compressedSize: number; // bytes
  compressionRatio: number; // percentage reduction
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * Compresses an image file using canvas-based compression
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    maxSizeKB = 500, // 500KB default
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        const { width: newWidth, height: newHeight } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Enable better image quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw resized image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert to base64 with compression
        const mimeType = `image/${format}`;
        let compressedDataUrl = canvas.toDataURL(mimeType, quality);
        
        // If still too large, reduce quality further
        let currentQuality = quality;
        const targetBytes = maxSizeKB * 1024;
        
        while (getBase64Size(compressedDataUrl) > targetBytes && currentQuality > 0.1) {
          currentQuality -= 0.1;
          compressedDataUrl = canvas.toDataURL(mimeType, currentQuality);
        }

        const originalSize = file.size;
        const compressedSize = getBase64Size(compressedDataUrl);
        const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

        resolve({
          compressedFile: compressedDataUrl,
          originalSize,
          compressedSize,
          compressionRatio,
          dimensions: {
            width: newWidth,
            height: newHeight
          }
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // If image is smaller than max dimensions, don't upscale
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  // Calculate scaling factor to fit within max dimensions
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const scalingFactor = Math.min(widthRatio, heightRatio);

  return {
    width: Math.round(width * scalingFactor),
    height: Math.round(height * scalingFactor)
  };
}

/**
 * Calculate the size of a base64 string in bytes
 */
function getBase64Size(base64String: string): number {
  // Remove data URL prefix if present
  const base64Data = base64String.split(',')[1] || base64String;
  
  // Calculate size: base64 is ~4/3 the size of original data
  const padding = (base64Data.match(/=/g) || []).length;
  return Math.round((base64Data.length * 3) / 4 - padding);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get compression settings based on image type and size
 */
export function getOptimalCompressionSettings(file: File): CompressionOptions {
  const fileSizeKB = file.size / 1024;
  
  // High resolution images need more aggressive compression
  if (fileSizeKB > 2000) { // > 2MB
    return {
      maxWidth: 1600,
      maxHeight: 1200,
      quality: 0.7,
      maxSizeKB: 400,
      format: 'jpeg'
    };
  } else if (fileSizeKB > 1000) { // > 1MB
    return {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      maxSizeKB: 500,
      format: 'jpeg'
    };
  } else {
    // Smaller files can use higher quality
    return {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85,
      maxSizeKB: 600,
      format: 'jpeg'
    };
  }
}