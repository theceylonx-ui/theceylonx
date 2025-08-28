import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageSquare, ThumbsUp, ThumbsDown, Plus, Search, Calendar, User, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { QuestionWithDetails, Topic, User as UserType } from "@shared/schema";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";

const questionSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  body: z.string().min(20, "Description must be at least 20 characters"),
  topicId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"top" | "new" | "unanswered">("top");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Queries
  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ['/api/topics'],
  });

  const { data: questions = [], isLoading } = useQuery<QuestionWithDetails[]>({
    queryKey: ['/api/questions', searchQuery, selectedTopic, sortBy],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedTopic !== "all") params.append('topic', selectedTopic);
      params.append('sort', sortBy);
      return fetch(`/api/questions?${params.toString()}`).then(res => res.json());
    }
  });

  const { data: user } = useQuery<UserType>({
    queryKey: ['/api/auth/user'],
  });

  // Form
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: "",
      body: "",
      topicId: "",
      tags: [],
    },
  });

  // Mutations
  const createQuestionMutation = useMutation({
    mutationFn: (data: QuestionFormData) => apiRequest('/api/questions', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({ title: "Question posted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to post question", variant: "destructive" });
    },
  });

  const voteMutation = useMutation({
    mutationFn: ({ questionId, answerId, voteType }: { questionId?: string; answerId?: string; voteType: 'up' | 'down' }) =>
      apiRequest('/api/vote', 'POST', { questionId, answerId, voteType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
    },
  });

  const onSubmit = (data: QuestionFormData) => {
    createQuestionMutation.mutate(data);
  };

  const handleVote = (questionId: string, voteType: 'up' | 'down') => {
    voteMutation.mutate({ questionId, voteType });
  };

  const filteredQuestions = questions.filter(question => 
    selectedTopic === "all" || question.topic?.slug === selectedTopic
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-ceylon-green to-ceylon-blue rounded-xl p-8 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Ceylon Expand Community</h1>
            <p className="text-lg opacity-90 mb-4">
              Ask questions, share knowledge, and connect with fellow travelers exploring Sri Lanka
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="lg"
                  disabled={!user}
                  data-testid="button-ask-question"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Ask a Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ask a Question</DialogTitle>
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
                              {topics.map((topic) => (
                                <SelectItem key={topic.id} value={topic.id}>
                                  {topic.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                        data-testid="button-cancel-question"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createQuestionMutation.isPending}
                        data-testid="button-submit-question"
                      >
                        {createQuestionMutation.isPending ? "Posting..." : "Post Question"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
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
            ) : filteredQuestions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No questions found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchQuery || selectedTopic !== "all"
                      ? "Try adjusting your search or filters"
                      : "Be the first to ask a question about traveling in Sri Lanka!"}
                  </p>
                  {!user && (
                    <p className="text-sm text-gray-500">
                      Sign in to ask questions and participate in the community
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <Card key={question.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {question.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                            {question.body}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {question.user?.firstName || question.user?.first_name || 'Anonymous'}
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
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVote(question.id, 'up')}
                              disabled={!user || voteMutation.isPending}
                              data-testid={`button-upvote-${question.id}`}
                            >
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              {question.votesCount}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVote(question.id, 'down')}
                              disabled={!user || voteMutation.isPending}
                              data-testid={`button-downvote-${question.id}`}
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {question.answersCount} {question.answersCount === 1 ? 'answer' : 'answers'}
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-view-question-${question.id}`}
                        >
                          View Question
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}