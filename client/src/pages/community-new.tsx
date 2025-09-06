import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import type { QuestionWithDetails, Topic, User as UserType } from "@shared/schema";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { CommunityStats } from "@/components/CommunityStats";
import { StickyFilters } from "@/components/StickyFilters";
import { AskQuestionDialog } from "@/components/AskQuestionDialog";
import { QuestionCard } from "@/components/QuestionCard";
import { useAuth } from "@/hooks/useAuth";

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"top" | "new" | "unanswered">("top");
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTopic, sortBy]);

  const handleEditQuestion = (questionId: string) => {
    console.log("Edit question:", questionId);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      console.log("Delete question:", questionId);
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
          className="h-9 w-9 p-0"
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
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <MessageSquare className="w-6 h-6" />
                  <h1 className="text-2xl md:text-3xl font-bold" data-testid="page-title">CeylonX Tribes</h1>
                </div>
                <p className="text-base opacity-90" data-testid="page-subtitle">
                  Ask questions, share knowledge, and connect with fellow travelers exploring Sri Lanka
                </p>
              </div>
              
              {/* Ask Question Button in Header */}
              <div className="hidden md:block">
                <AskQuestionDialog>
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
          <AskQuestionDialog>
            <Button size="lg" className="bg-brand text-white hover:bg-brand-hover font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300" data-testid="button-ask-question-mobile">
              <Plus className="w-6 h-6 mr-3" />
              Ask Question
            </Button>
          </AskQuestionDialog>
        </div>

        {/* Stats Section */}
        <div className="mb-8">
          <CommunityStats />
        </div>

        {/* Filters */}
        <div className="mb-8">
          <StickyFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTopic={selectedTopic}
            onTopicChange={setSelectedTopic}
            sortBy={sortBy}
            onSortChange={setSortBy}
            topics={topics}
            topicsLoading={topicsLoading}
          />
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
                <AskQuestionDialog>
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
                  onEdit={handleEditQuestion}
                  onDelete={handleDeleteQuestion}
                />
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
}