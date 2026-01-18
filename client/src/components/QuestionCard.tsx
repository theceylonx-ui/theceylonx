import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, Eye, Edit, Trash2, Clock, User } from "lucide-react";
import { UpvoteButton } from '@/components/UpvoteButton';
import { formatDistanceToNow } from "date-fns";
import { UserDisplay } from "@/components/ui/user-display";
import type { QuestionWithDetails } from "@shared/schema";
import { NeonBadge } from "@/components/ui/neon-badge";

interface QuestionCardProps {
  question: QuestionWithDetails;
  onEdit?: (questionId: string) => void;
  onDelete?: (questionId: string) => void;
  currentUserId?: string;
  showPreview?: boolean;
}

export function QuestionCard({ question, onEdit, onDelete, currentUserId, showPreview = false }: QuestionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const isAuthor = currentUserId === question.userId;
  
  // Prepare user data for UserDisplay component
  const displayUser = question.isAnonymous 
    ? { id: "anonymous", displayName: "Anonymous", username: null, avatarUrl: null, initials: "A" }
    : question.user ? {
        id: question.user.id || 'unknown',
        displayName: question.user.displayName,
        username: question.user.username,
        avatarUrl: question.user.profileImageUrl,
        initials: question.user.initials || 'U'
      } : null;
  
  // Truncate body for preview (2 lines ~ 120 characters)
  const bodyPreview = question.body.length > 120 
    ? question.body.substring(0, 120) + "..." 
    : question.body;

  return (
    <Link href={`/question/${question.id}`} className="block">
      <Card 
        className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-brand cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-6">
          {/* Question Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-text-primary hover:text-brand transition-colors line-clamp-2 mb-2">
                {question.title}
              </h3>
              
              {/* Sample badge for system-generated content */}
              {(question.id.startsWith('sample-') || question.userId === 'system-user') && (
                <div className="mb-2">
                  <NeonBadge text="🎯 Sample Q&A" className="mb-1" />
                </div>
              )}
            </div>
          
            {/* Action buttons for author */}
            {isAuthor && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      onEdit(question.id);
                    }}
                    className="h-11 w-11 p-0 min-h-[44px] min-w-[44px] text-text-muted hover:text-brand"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(question.id);
                    }}
                    className="h-11 w-11 p-0 min-h-[44px] min-w-[44px] text-text-muted hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Question Body Preview */}
          <p className="body text-text-secondary mb-4 leading-relaxed">
            {bodyPreview.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()}
          </p>

          {/* Tags and Topic */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {question.topic && (
              <Badge variant="secondary" className="text-xs bg-brand-subtle text-brand border-brand/20">
                {question.topic.name}
              </Badge>
            )}
          </div>

          {/* Meta Information */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-text-muted">
              {/* Author */}
              <UserDisplay 
                user={displayUser}
                showAvatar={true}
                avatarSize="sm"
                className="gap-2"
                nameClassName="caption"
                clickable={!question.isAnonymous && !!question.user?.id}
              />
              
              {/* Time */}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="caption">
                  {question.createdAt && !isNaN(new Date(question.createdAt).getTime()) ? formatDistanceToNow(new Date(question.createdAt), { addSuffix: true }) : 'Recently'}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-text-muted">
              {/* Upvotes */}
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                <span className="caption font-medium">{question.votesCount || 0}</span>
              </div>
              
              {/* Answers */}
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span className="caption font-medium">{question.answersCount || 0}</span>
              </div>

              {/* Views */}
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span className="caption font-medium">{0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}