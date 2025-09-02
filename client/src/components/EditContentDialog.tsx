import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: { title?: string; body?: string; content?: string }) => void;
  isLoading?: boolean;
  title?: string;
  initialContent?: {
    title?: string;
    body?: string;
    content?: string;
  };
  fields: {
    title?: boolean;
    body?: boolean;
    content?: boolean;
  };
  contentType?: 'comment' | 'question' | 'trip';
}

export function EditContentDialog({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  title = 'Edit Content',
  initialContent = {},
  fields,
  contentType = 'comment'
}: EditContentDialogProps) {
  const [formData, setFormData] = useState({
    title: initialContent.title || '',
    body: initialContent.body || '',
    content: initialContent.content || ''
  });

  // Reset form when dialog opens or initial content changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: initialContent.title || '',
        body: initialContent.body || '',
        content: initialContent.content || ''
      });
    }
  }, [isOpen, initialContent]);

  const handleSave = () => {
    const updatedContent: any = {};
    if (fields.title && formData.title.trim()) updatedContent.title = formData.title.trim();
    if (fields.body && formData.body.trim()) updatedContent.body = formData.body.trim();
    if (fields.content && formData.content.trim()) updatedContent.content = formData.content.trim();
    
    onSave(updatedContent);
  };

  const isValid = () => {
    if (fields.title && !formData.title.trim()) return false;
    if (fields.body && !formData.body.trim()) return false;
    if (fields.content && !formData.content.trim()) return false;
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-edit-content">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {fields.title && (
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title..."
                data-testid="input-edit-title"
              />
            </div>
          )}
          
          {fields.body && (
            <div className="space-y-2">
              <Label htmlFor="body">Description</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Enter description..."
                rows={6}
                data-testid="input-edit-body"
              />
            </div>
          )}
          
          {fields.content && (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter your message..."
                rows={4}
                data-testid="input-edit-content"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            data-testid="button-cancel-edit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !isValid()}
            data-testid="button-save-edit"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}