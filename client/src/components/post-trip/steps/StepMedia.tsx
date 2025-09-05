import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MediaUploader } from "../MediaUploader";
import type { TripFormData } from "@shared/schema";

interface StepMediaProps {
  form: UseFormReturn<TripFormData>;
}

export function StepMedia({ form }: StepMediaProps) {
  const mediaUrls = form.watch("mediaUrls") || [];
  const coverImageIndex = form.watch("coverImageIndex") || 0;
  
  const handleMediaChange = (items: { url: string; alt?: string; caption?: string }[]) => {
    form.setValue("mediaUrls", items.map(item => item.url));
    form.setValue("mediaMetadata", items);
  };

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="mediaUrls"
        render={({ field }) => (
          <FormItem>
            <MediaUploader
              value={mediaUrls.map((url, index) => ({
                url,
                alt: form.watch("mediaMetadata")?.[index]?.alt || "",
                caption: form.watch("mediaMetadata")?.[index]?.caption || "",
              }))}
              onChange={handleMediaChange}
              coverImageIndex={coverImageIndex}
              onCoverImageChange={(index) => form.setValue("coverImageIndex", index)}
              error={form.formState.errors.mediaUrls?.message}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Media Tips */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">📸 Photo Tips</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Use high-quality, well-lit photos</li>
          <li>• Show the destination and activities clearly</li>
          <li>• Include both landscape and people photos</li>
          <li>• Make sure the cover photo represents your trip well</li>
          <li>• Add alt text for accessibility</li>
          <li>• Photos are optional but highly recommended</li>
        </ul>
      </div>
    </div>
  );
}