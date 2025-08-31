import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  User, 
  Calendar, 
  CheckCircle, 
  Share2,
  Facebook,
  Twitter,
  Copy,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import type { QuestionWithDetails, Answer, User as UserType } from "@shared/schema";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";

const answerSchema = z.object({
  body: z.string().min(10, "Answer must be at least 10 characters"),
});

type AnswerFormData = z.infer<typeof answerSchema>;

export default function QuestionDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get current user
  const { data: user } = useQuery<UserType>({
    queryKey: ['/api/user'],
  });

  // Get question details
  const { data: question, isLoading } = useQuery<QuestionWithDetails>({
    queryKey: [`/api/questions/${id}`],
    enabled: !!id,
  });

  // Form for new answers
  const form = useForm<AnswerFormData>({
    resolver: zodResolver(answerSchema),
    defaultValues: {
      body: "",
    },
  });

  // Mutations
  const voteMutation = useMutation({
    mutationFn: ({ questionId, answerId, voteType }: { questionId?: string; answerId?: string; voteType: 'up' | 'down' }) =>
      apiRequest('/api/vote', 'POST', { questionId, answerId, voteType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${id}`] });
      toast({ title: "Vote recorded successfully!" });
    },
  });

  const createAnswerMutation = useMutation({
    mutationFn: (data: AnswerFormData) => 
      apiRequest(`/api/questions/${id}/answers`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${id}`] });
      setShowAnswerForm(false);
      form.reset();
      toast({ title: "Answer posted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to post answer", variant: "destructive" });
    },
  });

  const handleVote = (voteType: 'up' | 'down', questionId?: string, answerId?: string) => {
    if (!user) {
      toast({ 
        title: "Sign in required", 
        description: "Please sign in to vote",
        variant: "destructive" 
      });
      return;
    }
    voteMutation.mutate({ questionId, answerId, voteType });
  };

  const onSubmitAnswer = (data: AnswerFormData) => {
    if (!user) {
      toast({ 
        title: "Sign in required", 
        description: "Please sign in to post an answer",
        variant: "destructive" 
      });
      return;
    }
    createAnswerMutation.mutate(data);
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = question?.title || "Question from Ceylon Expand";
    const text = `Check out this question: ${title}`;

    let shareUrl = "";
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({ title: "Link copied to clipboard!" });
        setShowShareDialog(false);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setShowShareDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Question not found</h1>
            <Link href="/community">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Community
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const sortedAnswers = question.answers?.sort((a, b) => {
    // Put accepted answer first
    if (a.id === question.acceptedAnswerId) return -1;
    if (b.id === question.acceptedAnswerId) return 1;
    // Then sort by votes
    return (b.votesCount || 0) - (a.votesCount || 0);
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/community">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Community
            </Button>
          </Link>
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-4">{question.title}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {question.user?.firstName || 'Anonymous'}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDistanceToNow(new Date(question.createdAt || new Date()), { addSuffix: true })}
                  </div>
                  {question.topic && (
                    <Badge variant="secondary">
                      {question.topic.name}
                    </Badge>
                  )}
                  {question.acceptedAnswerId && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Answered
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShareDialog(!showShareDialog)}
                  data-testid="button-share-question"
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 whitespace-pre-wrap">
                {question.body.replace(/<[^>]*>/g, '')}
              </p>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVote('up', question.id, undefined)}
                    disabled={!user || voteMutation.isPending}
                    title={!user ? "Sign in to vote" : ""}
                    data-testid="button-upvote-question"
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {question.votesCount || 0}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVote('down', question.id, undefined)}
                    disabled={!user || voteMutation.isPending}
                    title={!user ? "Sign in to vote" : ""}
                    data-testid="button-downvote-question"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  {question.answersCount || 0} {(question.answersCount || 0) === 1 ? 'answer' : 'answers'}
                </div>
              </div>
            </div>

            {/* Share Dialog */}
            {showShareDialog && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium mb-3">Share this question</h4>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="flex items-center"
                  >
                    <Facebook className="w-4 h-4 mr-1" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="flex items-center"
                  >
                    <Twitter className="w-4 h-4 mr-1" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('copy')}
                    className="flex items-center"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Link
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Answers Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {sortedAnswers.length} {sortedAnswers.length === 1 ? 'Answer' : 'Answers'}
              </span>
              {user && (
                <Button
                  variant="default"
                  onClick={() => setShowAnswerForm(!showAnswerForm)}
                  data-testid="button-add-answer"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Answer
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Answer Form */}
            {showAnswerForm && user && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitAnswer)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="body"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Answer</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Share your knowledge and help the community..."
                              className="min-h-[120px]"
                              {...field}
                              data-testid="input-answer-body"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowAnswerForm(false)}
                        data-testid="button-cancel-answer"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createAnswerMutation.isPending}
                        data-testid="button-submit-answer"
                      >
                        {createAnswerMutation.isPending ? "Posting..." : "Post Answer"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}

            {/* Sign in prompt for non-users */}
            {!user && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-gray-700 mb-2">Want to contribute an answer?</p>
                <Link href="/auth/signin">
                  <Button variant="default">
                    Sign In to Answer
                  </Button>
                </Link>
              </div>
            )}

            {/* Answers List */}
            <div className="space-y-6">
              {sortedAnswers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No answers yet. Be the first to help!</p>
                </div>
              ) : (
                sortedAnswers.map((answer) => (
                  <div key={answer.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {answer.user?.firstName || 'Anonymous'}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDistanceToNow(new Date(answer.createdAt || new Date()), { addSuffix: true })}
                        </div>
                        {answer.id === question.acceptedAnswerId && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Accepted Answer
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="prose max-w-none mb-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {answer.body.replace(/<[^>]*>/g, '')}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVote('up', undefined, answer.id)}
                        disabled={!user || voteMutation.isPending}
                        title={!user ? "Sign in to vote" : ""}
                        data-testid={`button-upvote-answer-${answer.id}`}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        {answer.votesCount || 0}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVote('down', undefined, answer.id)}
                        disabled={!user || voteMutation.isPending}
                        title={!user ? "Sign in to vote" : ""}
                        data-testid={`button-downvote-answer-${answer.id}`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}