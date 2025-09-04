import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, Eye, Edit, Trash2, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getDisplayName, getInitials } from "@/lib/profileUtils";
import type { QuestionWithDetails } from "@shared/schema";

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
  const displayName = question.isAnonymous ? "Anonymous" : getDisplayName(question.user);
  const userInitials = question.isAnonymous ? "A" : getInitials(question.user);
  
  // Truncate body for preview (2 lines ~ 120 characters)
  const bodyPreview = question.body.length > 120 
    ? question.body.substring(0, 120) + "..." 
    : question.body;

  return (
    <Card 
      className="hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-ceylon-blue"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6">
        {/* Question Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <Link href={`/question/${question.id}`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-ceylon-blue cursor-pointer line-clamp-2">
                {question.title}
              </h3>
            </Link>
          </div>
          
          {/* Action buttons for author */}
          {isAuthor && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(question.id)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(question.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Question Body Preview */}
        <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          {bodyPreview.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()}
        </p>

        {/* Tags and Topic */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {question.topic && (
            <Badge variant="secondary" className="text-xs">
              {question.topic.name}
            </Badge>
          )}
          {question.tags?.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {question.tags && question.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{question.tags.length - 3} more
            </Badge>
          )}
        </div>

        {/* Question Footer */}
        <div className="flex items-center justify-between">
          {/* Author and timestamp */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {!question.isAnonymous && question.user?.profileImageUrl ? (
                <AvatarImage src={question.user.profileImageUrl} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-xs bg-ceylon-green/10 text-ceylon-green">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <div className="font-medium">{displayName}</div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(question.createdAt || new Date()), { addSuffix: true })}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              <span>{question.votesCount || 0}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{question.answersCount || 0}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>0</span>
            </div>
          </div>
        </div>

        {/* Show first answer preview on hover */}
        {isHovered && showPreview && question.answers && question.answers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Top Answer:</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {question.answers[0].body.length > 100 
                  ? question.answers[0].body.substring(0, 100) + "..."
                  : question.answers[0].body
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}