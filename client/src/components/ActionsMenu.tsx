import React from 'react';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ActionsMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  isDeleting?: boolean;
  size?: 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ActionsMenu({
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  isDeleting = false,
  size = 'sm',
  className
}: ActionsMenuProps) {
  // Don't render if no actions are available
  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={className}
          data-testid="button-actions-menu"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {canEdit && onEdit && (
          <DropdownMenuItem onClick={onEdit} data-testid="button-edit">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        {canDelete && onDelete && (
          <DropdownMenuItem
            onClick={onDelete}
            disabled={isDeleting}
            className="text-red-600 focus:text-red-700"
            data-testid="button-delete"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}