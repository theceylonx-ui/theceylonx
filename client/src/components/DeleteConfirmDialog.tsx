import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  itemType?: 'comment' | 'question' | 'trip';
  itemTitle?: string;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  description,
  itemType = 'comment',
  itemTitle
}: DeleteConfirmDialogProps) {
  const getDefaultTitle = () => {
    if (title) return title;
    return `Delete ${itemType}?`;
  };

  const getDefaultDescription = () => {
    if (description) return description;
    
    const itemName = itemTitle ? `"${itemTitle}"` : `this ${itemType}`;
    
    switch (itemType) {
      case 'comment':
        return `Are you sure you want to delete ${itemName}? This action cannot be undone and the comment will be permanently removed.`;
      case 'question':
        return `Are you sure you want to delete ${itemName}? This action cannot be undone and the question along with all its answers will be permanently removed.`;
      case 'trip':
        return `Are you sure you want to delete ${itemName}? This action cannot be undone and the trip will be permanently removed. Any users who have shown interest will be notified.`;
      default:
        return `Are you sure you want to delete ${itemName}? This action cannot be undone.`;
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent data-testid="dialog-delete-confirm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {getDefaultTitle()}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-600">
            {getDefaultDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={isLoading}
            data-testid="button-cancel-delete"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            data-testid="button-confirm-delete"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}