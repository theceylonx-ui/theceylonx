import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import type { QuestionWithDetails, Topic, User as UserType } from "@shared/schema";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { AskQuestionDialog } from "@/components/AskQuestionDialog";
import { QuestionCard } from "@/components/QuestionCard";
import { useAuth } from "@/hooks/useAuth";
import { TipsBox } from "@/components/TipsBox";

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"top" | "new" | "unanswered">("top");
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

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

  const { data: questionsResponse, isLoading } = useQuery<{questions: QuestionWithDetails[], total: number, totalAnswers: number}>({
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTopic, sortBy]);

  const [editingQuestion, setEditingQuestion] = useState<QuestionWithDetails | null>(null);

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => apiRequest('DELETE', `/api/questions/${questionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      toast({ title: "Question deleted" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditQuestion = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (question) setEditingQuestion(question);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      deleteQuestionMutation.mutate(questionId);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
          className="h-11 w-11 p-0 min-h-[44px] min-w-[44px]"
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-12">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        {pages}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-ui-bg">
      <Navigation />
      
      <div className="page-container section-spacing">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-brand to-brand-hover rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <MessageSquare className="w-6 h-6" />
                  <h1 className="text-2xl md:text-3xl font-bold" data-testid="page-title">HiBowan Tribes</h1>
                </div>
                <p className="text-base opacity-90" data-testid="page-subtitle">
                  Ask questions, share knowledge, and connect with fellow travelers exploring Sri Lanka
                </p>
              </div>
              
              {/* Ask Question Button in Header */}
              <div className="hidden md:block">
                <AskQuestionDialog
                  topics={topics}
                  isAuthenticated={isAuthenticated}
                  onSignInRequired={() => setLocation('/auth/signin')}
                >
                  <Button 
                    size="lg" 
                    className="bg-white/20 text-white hover:bg-white/30 border-white/30 font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200" 
                    data-testid="button-ask-question"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Ask Question
                  </Button>
                </AskQuestionDialog>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Ask Question Button */}
        <div className="mb-8 flex justify-center md:hidden">
          <AskQuestionDialog
            topics={topics}
            isAuthenticated={isAuthenticated}
            onSignInRequired={() => setLocation('/auth/signin')}
          >
            <Button size="lg" className="bg-brand text-white hover:bg-brand-hover font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300" data-testid="button-ask-question-mobile">
              <Plus className="w-6 h-6 mr-3" />
              Ask Question
            </Button>
          </AskQuestionDialog>
        </div>

        {/* Redesigned Stats, Search and Filters Section */}
        <div className="mb-8 space-y-6">
          {/* Stats Row */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-8 px-6 py-4 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center gap-2 text-brand">
                <MessageSquare className="h-5 w-5" />
                <span className="font-semibold text-lg">{questionsResponse?.total ?? 0}</span>
                <span className="text-sm text-gray-600">Questions</span>
              </div>
              
              <div className="h-8 w-px bg-gray-200" />
              
              <div className="flex items-center gap-2 text-accent">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-lg">{questionsResponse?.totalAnswers ?? 0}</span>
                <span className="text-sm text-gray-600">Answers</span>
              </div>
              
              <div className="h-8 w-px bg-gray-200" />
              
              <div className="flex items-center gap-2 text-text-primary">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                <span className="font-semibold text-lg">{topics.length}</span>
                <span className="text-sm text-gray-600">Topics</span>
              </div>
            </div>
          </div>

          {/* Search and Filters Row */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            {/* Search Bar */}
            <div className="relative mb-6">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search questions about Sri Lanka travel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent bg-gray-50 placeholder-gray-500"
              />
            </div>
            
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {/* Sort Buttons */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {(["top", "new", "unanswered"] as const).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => setSortBy(sort)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                        sortBy === sort 
                          ? "bg-white text-brand shadow-sm" 
                          : "text-gray-600 hover:text-brand"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {sort === 'top' && <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>}
                        {sort === 'new' && <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>}
                        {sort === 'unanswered' && <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a1.5 1.5 0 112.12 2.12L10 10.06H8.94V6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>}
                        <span className="capitalize">{sort}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Topic:</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value="all">All Topics</option>
                  {topics && topics.length > 0 && topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="body" data-testid="questions-count">
              {isLoading ? "Loading..." : `${totalQuestions} questions found`}
            </p>
            {totalPages > 1 && (
              <p className="caption">
                Page {currentPage} of {totalPages}
              </p>
            )}
          </div>
        </div>

        {/* Questions List */}
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-6 bg-ui-line rounded w-3/4"></div>
                    <div className="h-4 bg-ui-line rounded w-1/2"></div>
                    <div className="flex gap-4">
                      <div className="h-4 bg-ui-line rounded w-16"></div>
                      <div className="h-4 bg-ui-line rounded w-20"></div>
                      <div className="h-4 bg-ui-line rounded w-24"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-16 w-16 text-text-muted mb-6" />
              <h3 className="h3 mb-2">No questions found</h3>
              <p className="caption mb-6 max-w-md">
                {searchQuery || selectedTopic !== "all" 
                  ? "Try adjusting your search or filters to find more questions."
                  : "Be the first to ask a question and start the conversation!"}
              </p>
              <div className="flex gap-3">
                {(searchQuery || selectedTopic !== "all") && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTopic("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
                <AskQuestionDialog
                  topics={topics}
                  isAuthenticated={isAuthenticated}
                  onSignInRequired={() => setLocation('/auth/signin')}
                >
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Ask First Question
                  </Button>
                </AskQuestionDialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4 animate-fade-in">
              {questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  currentUserId={user?.id}
                  onEdit={handleEditQuestion}
                  onDelete={handleDeleteQuestion}
                />
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>

      {/* Tips Section */}
      <div className="mt-16 mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <TipsBox
            title="🌟 Community Q&A Guidelines"
            tips={[
              "Search existing questions <strong>before posting</strong> to avoid duplicates",
              "Write <strong>clear, specific titles</strong> that describe your question well", 
              "Include <strong>relevant details</strong> like dates, locations, and preferences",
              "Use appropriate <strong>topic tags</strong> to help others find your question",
              "Be respectful and helpful when <strong>answering others' questions</strong>",
              "Vote up useful answers and mark the <strong>best answer</strong> to help future travelers"
            ]}
          />
        </div>
      </div>
      
      {/* Edit Question Dialog (controlled, reused across all questions) */}
      {editingQuestion && (
        <AskQuestionDialog
          topics={topics}
          isAuthenticated={isAuthenticated}
          onSignInRequired={() => setLocation('/auth/signin')}
          questionId={editingQuestion.id}
          initialValues={{
            title: editingQuestion.title,
            body: editingQuestion.body,
            topicId: editingQuestion.topicId ?? "",
            tags: editingQuestion.tags ?? [],
            isAnonymous: editingQuestion.isAnonymous ?? false,
          }}
          open={!!editingQuestion}
          onOpenChange={(open) => { if (!open) setEditingQuestion(null); }}
        />
      )}

      <Footer />
    </div>
  );
}