import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Palette } from 'lucide-react';
import { getAvatarOptions, generateProfilePicture, type AvatarStyle } from '@/lib/profileUtils';

interface AvatarSelectorProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onAvatarSelect: (avatarUrl: string, style: AvatarStyle) => void;
  disabled?: boolean;
}

export function AvatarSelector({ userId, currentAvatarUrl, onAvatarSelect, disabled }: AvatarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle | null>(null);
  
  const avatarOptions = getAvatarOptions(userId);
  
  const handleAvatarSelect = (style: AvatarStyle) => {
    const avatarUrl = generateProfilePicture(userId, style);
    setSelectedStyle(style);
    onAvatarSelect(avatarUrl, style);
    setIsOpen(false);
  };

  // Determine if an avatar option is currently selected
  const isCurrentAvatar = (url: string) => {
    return currentAvatarUrl === url;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled}
          className="flex items-center gap-2"
          data-testid="button-change-avatar"
        >
          <Palette className="h-4 w-4" />
          Choose Avatar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="grid grid-cols-4 gap-4 p-1">
            {avatarOptions.map((option) => (
              <div
                key={option.style}
                className={`relative cursor-pointer group transition-all duration-200 hover:scale-105 ${
                  isCurrentAvatar(option.url) ? 'ring-2 ring-ceylon-green shadow-lg' : ''
                }`}
                onClick={() => handleAvatarSelect(option.style)}
                data-testid={`avatar-option-${option.style}`}
              >
                <div className="flex flex-col items-center space-y-2 p-3 rounded-lg border hover:border-ceylon-green/50 hover:bg-gray-50">
                  <Avatar className="h-16 w-16 transition-transform group-hover:scale-110">
                    <AvatarImage src={option.url} alt={option.name} />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-700 truncate w-full">
                      {option.name}
                    </p>
                    {isCurrentAvatar(option.url) && (
                      <Badge variant="secondary" className="mt-1 text-xs bg-ceylon-green text-white">
                        <Check className="h-3 w-3 mr-1" />
                        Current
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}