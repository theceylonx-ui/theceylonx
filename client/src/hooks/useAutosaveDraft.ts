import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { TripFormData } from "@shared/schema";

interface AutosaveOptions {
  draftId?: string;
  onSave?: (savedDraft: any) => void;
  interval?: number; // in milliseconds
}

export function useAutosaveDraft(data: Partial<TripFormData>, options: AutosaveOptions = {}) {
  const { draftId, onSave, interval = 5000 } = options;
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<string>("");
  
  const saveDraftMutation = useMutation({
    mutationFn: async (draftData: Partial<TripFormData> & { id?: string }) => {
      const endpoint = draftData.id ? `/api/trips/draft/${draftData.id}` : "/api/trips/draft";
      const method = draftData.id ? "PATCH" : "POST";
      
      return apiRequest(method, endpoint, draftData);
    },
    onSuccess: (savedDraft) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips/drafts"] });
      onSave?.(savedDraft);
    },
  });
  
  const triggerSave = useCallback(() => {
    const currentDataString = JSON.stringify(data);
    
    // Don't save if data hasn't changed
    if (currentDataString === lastSavedDataRef.current) {
      return;
    }
    
    // Don't save if data is empty
    if (!data || Object.keys(data).length === 0) {
      return;
    }
    
    lastSavedDataRef.current = currentDataString;
    
    const draftData = {
      ...data,
      ...(draftId && { id: draftId }),
    };
    
    saveDraftMutation.mutate(draftData);
  }, [data, draftId, saveDraftMutation]);
  
  // Manual save function
  const saveDraft = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    triggerSave();
  }, [triggerSave]);
  
  // Auto-save on interval
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      triggerSave();
    }, interval);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, triggerSave, interval]);
  
  // Save on blur events
  useEffect(() => {
    const handleBlur = () => {
      triggerSave();
    };
    
    window.addEventListener("blur", handleBlur);
    
    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, [triggerSave]);
  
  return {
    saveDraft,
    isSaving: saveDraftMutation.isPending,
    lastSaveError: saveDraftMutation.error,
    isSuccess: saveDraftMutation.isSuccess,
  };
}