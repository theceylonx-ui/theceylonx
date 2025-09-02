import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageSquare, ThumbsUp, ThumbsDown, Plus, Search, Calendar, User, CheckCircle, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import type { QuestionWithDetails, Topic, User as UserType } from "@shared/schema";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import communityBgImage from "@assets/2_1756418517711.png";

const questionSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  body: z.string().min(20, "Description must be at least 20 characters"),
  topicId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isAnonymous: z.boolean(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"top" | "new" | "unanswered">("top");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const questionsPerPage = 10;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Queries
  const { data: topicsData = [], isLoading: topicsLoading } = useQuery<Topic[]>({
    queryKey: ['/api/topics'],
  });

  // Sort topics with "Others" at the end
  const topics = topicsData.length > 0 ? [...topicsData].sort((a, b) => {
    if (a.name === "Others") return 1;
    if (b.name === "Others") return -1;
    return a.name.localeCompare(b.name);
  }) : [];

  const { data: questionsResponse, isLoading } = useQuery<{questions: QuestionWithDetails[], total: number}>({
    queryKey: ['/api/questions', searchQuery, selectedTopic, sortBy, currentPage],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedTopic !== "all") params.append('topic', selectedTopic);
      params.append('sort', sortBy);
      params.append('limit', '10');
      params.append('offset', ((currentPage - 1) * questionsPerPage).toString());
      return fetch(`/api/questions?${params.toString()}`).then(res => res.json());
    }
  });

  const questions = questionsResponse?.questions || [];
  const totalQuestions = questionsResponse?.total || 0;
  const totalPages = Math.ceil(totalQuestions / questionsPerPage);

  const { data: user } = useQuery<UserType>({
    queryKey: ['/api/user'],
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTopic, sortBy]);

  // Form
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: "",
      body: "",
      topicId: "",
      tags: [],
      isAnonymous: false,
    },
  });

  // Mutations
  const createQuestionMutation = useMutation({
    mutationFn: (data: QuestionFormData) => apiRequest('POST', '/api/questions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      setIsCreateDialogOpen(false);
      form.reset({
        title: "",
        body: "",
        topicId: "",
        tags: [],
        isAnonymous: false,
      });
      toast({ title: "Question posted successfully!" });
    },
    onError: (error) => {
      console.error("Question creation error:", error);
      // Check if it's an authorization error
      if (error.message.includes('401')) {
        toast({
          title: "Authentication required",
          description: "Please sign in to ask questions",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Failed to post question", description: error.message, variant: "destructive" });
    },
  });

  const editQuestionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: QuestionFormData }) => 
      apiRequest('PATCH', `/api/questions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      setIsCreateDialogOpen(false);
      setEditingQuestionId(null);
      form.reset({
        title: "",
        body: "",
        topicId: "",
        tags: [],
        isAnonymous: false,
      });
      toast({ title: "Question updated successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update question", description: error.message, variant: "destructive" });
    },
  });

  const voteMutation = useMutation({
    mutationFn: ({ questionId, answerId, voteType }: { questionId?: string; answerId?: string; voteType: 'up' | 'down' }) =>
      apiRequest('POST', '/api/vote', { questionId, answerId, voteType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
    },
  });

  const onSubmit = (data: QuestionFormData) => {
    console.log("🔍 Form submission data:", JSON.stringify(data, null, 2));
    if (editingQuestionId) {
      editQuestionMutation.mutate({ id: editingQuestionId, data });
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-8" data-testid="pagination">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="hover:bg-gray-50"
          data-testid="pagination-prev"
        >
          Previous
        </Button>
        
        {startPage > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              data-testid="pagination-page-1"
            >
              1
            </Button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(page)}
            className={currentPage === page ? "bg-ceylon-green hover:bg-ceylon-green/90 shadow-sm" : "hover:bg-gray-50"}
            data-testid={`pagination-page-${page}`}
          >
            {page}
          </Button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              data-testid={`pagination-page-${totalPages}`}
            >
              {totalPages}
            </Button>
          </>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="hover:bg-gray-50"
          data-testid="pagination-next"
        >
          Next
        </Button>
      </div>
    );
  };

  const handleVote = (questionId: string, voteType: 'up' | 'down') => {
    voteMutation.mutate({ questionId, voteType });
  };

  const toggleQuestionExpansion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  // Questions are already filtered on the server, no need for client-side filtering

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="relative bg-gradient-to-r from-ceylon-green to-ceylon-blue rounded-2xl p-6 sm:p-8 text-white shadow-xl overflow-hidden">
              {/* Background Image */}
              <div 
                className="absolute inset-0 rounded-2xl" 
                style={{
                  backgroundImage: `url(${communityBgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              ></div>
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-black opacity-50 rounded-2xl"></div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 drop-shadow-2xl" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8), 1px 1px 4px rgba(0,0,0,0.6)' }}>
                    Ceylon Expand Community
                  </h1>
                  <p className="text-lg max-w-2xl drop-shadow-lg" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8), 0px 0px 2px rgba(0,0,0,0.6)' }}>
                    Ask questions, share knowledge, and connect with fellow travelers exploring Sri Lanka
                  </p>
                </div>
              
              <div className="flex flex-col items-start">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    {user ? (
                      <Button 
                        size="lg"
                        className="bg-ceylon-green text-white hover:bg-ceylon-green/90 font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                        data-testid="button-ask-question"
                      >
                        <Plus className="w-6 h-6 mr-3" />
                        Ask a Question
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <Link href="/auth/signin">
                          <Button 
                            size="lg"
                            className="bg-ceylon-green text-white hover:bg-ceylon-green/90 font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                            data-testid="button-ask-question-signin"
                          >
                            <Plus className="w-6 h-6 mr-3" />
                            Ask a Question
                          </Button>
                        </Link>
                        <p className="text-sm opacity-80" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                          Sign in to ask questions and participate
                        </p>
                      </div>
                    )}
                  </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingQuestionId ? "Edit Question" : "Ask a Question"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="What would you like to know about Sri Lanka?" 
                              {...field}
                              data-testid="input-question-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="body"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide more details about your question..."
                              className="min-h-[120px]"
                              {...field}
                              data-testid="input-question-body"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="topicId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-question-topic">
                                <SelectValue placeholder="Select a topic" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {topicsLoading ? (
                                <SelectItem value="loading" disabled>Loading topics...</SelectItem>
                              ) : topicsData.length === 0 ? (
                                <SelectItem value="no-topics" disabled>No topics available</SelectItem>
                              ) : (
                                topics.map((topic) => (
                                  <SelectItem key={topic.id} value={topic.id}>
                                    {topic.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isAnonymous"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-anonymous"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Post anonymously
                            </FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Your name will be hidden and shown as "Anonymous" instead
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsCreateDialogOpen(false);
                          setEditingQuestionId(null);
                          form.reset({
                            title: "",
                            body: "",
                            topicId: "",
                            tags: [],
                            isAnonymous: false,
                          });
                        }}
                        data-testid="button-cancel-question"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createQuestionMutation.isPending || editQuestionMutation.isPending}
                        data-testid="button-submit-question"
                      >
                        {editingQuestionId 
                          ? (editQuestionMutation.isPending ? "Updating..." : "Update Question")
                          : (createQuestionMutation.isPending ? "Posting..." : "Post Question")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
              </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-questions"
                />
              </CardContent>
            </Card>

            {/* Sort Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sort By</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={sortBy === "top" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSortBy("top")}
                  data-testid="button-sort-top"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Top Questions
                </Button>
                <Button
                  variant={sortBy === "new" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSortBy("new")}
                  data-testid="button-sort-new"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Newest
                </Button>
                <Button
                  variant={sortBy === "unanswered" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSortBy("unanswered")}
                  data-testid="button-sort-unanswered"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Unanswered
                </Button>
              </CardContent>
            </Card>

            {/* Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedTopic === "all" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedTopic("all")}
                  data-testid="button-topic-all"
                >
                  All Topics
                </Button>
                {topics.map((topic) => (
                  <Button
                    key={topic.id}
                    variant={selectedTopic === topic.slug ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedTopic(topic.slug)}
                    data-testid={`button-topic-${topic.slug}`}
                  >
                    {topic.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : questions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No questions found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchQuery || selectedTopic !== "all"
                      ? "Try adjusting your search or filters."
                      : "Be the first to ask a question about traveling in Sri Lanka!"}
                  </p>
                  {!user && (
                    <p className="text-sm text-gray-500">
                      Sign in to ask questions and participate in the community.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
                  <Card key={question.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              {question.title}
                            </h3>
                            {user && question.user?.id === user.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  form.setValue('title', question.title);
                                  form.setValue('body', question.body);
                                  form.setValue('topicId', question.topic?.id || '');
                                  form.setValue('isAnonymous', question.isAnonymous || false);
                                  setEditingQuestionId(question.id);
                                  setIsCreateDialogOpen(true);
                                }}
                                data-testid={`button-edit-question-${question.id}`}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                            {question.body.replace(/<[^>]*>/g, '')}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {question.isAnonymous ? 'Anonymous' : (question.user?.firstName || 'Anonymous')}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDistanceToNow(new Date(question.createdAt || new Date()), { addSuffix: true })}
                            </div>
                            {question.topic && (
                              <Badge variant="secondary" data-testid={`badge-topic-${question.topic.slug}`}>
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

                          {/* Show answers if they exist */}
                          {question.answers && question.answers.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">
                                {question.answers.length} {question.answers.length === 1 ? 'Answer' : 'Answers'}
                              </h4>
                              <div className="space-y-3">
                                {question.answers
                                  .sort((a, b) => (b.votesCount || 0) - (a.votesCount || 0))
                                  .slice(0, expandedQuestions.has(question.id) ? question.answers.length : 2)
                                  .map((answer, index) => (
                                  <div key={answer.id} className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center space-x-2 mb-2 text-xs text-gray-500">
                                      <User className="w-3 h-3" />
                                      <span>{answer.user?.firstName || 'Anonymous'}</span>
                                      <Calendar className="w-3 h-3 ml-2" />
                                      <span>{formatDistanceToNow(new Date(answer.createdAt || new Date()), { addSuffix: true })}</span>
                                      {index === 0 && question.answers && question.answers.length > 1 && (answer.votesCount || 0) > 0 && (
                                        <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                          <CheckCircle className="w-2 h-2 mr-1" />
                                          Best Answer
                                        </Badge>
                                      )}
                                      {(answer.votesCount || 0) > 0 && (
                                        <Badge variant="outline" className="text-xs">
                                          <ThumbsUp className="w-2 h-2 mr-1" />
                                          {answer.votesCount}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-700">
                                      {answer.body.replace(/<[^>]*>/g, '')}
                                    </p>
                                  </div>
                                ))}
                                {question.answers.length > 2 && !expandedQuestions.has(question.id) && (
                                  <p className="text-xs text-gray-500 italic">
                                    ...and {question.answers.length - 2} more answers
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={user ? () => handleVote(question.id, 'up') : undefined}
                              disabled={!user || voteMutation.isPending}
                              title={!user ? "Sign in to vote" : ""}
                              data-testid={`button-upvote-${question.id}`}
                            >
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              {question.votesCount}
                            </Button>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {question.answersCount} {question.answersCount === 1 ? 'answer' : 'answers'}
                          </div>
                        </div>
                        
                        <Link href={`/question/${question.id}`}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            data-testid={`button-expand-${question.id}`}
                          >
                            View Question
                          </Button>
                        </Link>
                        
                        <Link href={`/question/${question.id}`}>
                          <Button 
                            variant="default" 
                            size="sm"
                            data-testid={`button-reply-${question.id}`}
                          >
                            {user ? 'Join Discussion' : 'View Answers'}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {renderPagination()}
          </div>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}