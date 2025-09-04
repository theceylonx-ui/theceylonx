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
import communityBgImage from "@assets/2_1756418517711.png";

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
    // TODO: Implement edit functionality
    console.log("Edit question:", questionId);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      // TODO: Implement delete functionality
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
          className="h-8 w-8 p-0"
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        {startPage > 1 && (
          <>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(1)}>1</Button>
            {startPage > 2 && <span className="text-gray-400">...</span>}
          </>
        )}
        {pages}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
            <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages)}>{totalPages}</Button>
          </>
        )}
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      {/* Modern Header Section */}
      <div className="bg-gradient-to-br from-ceylon-green via-ceylon-blue to-ceylon-orange text-white">
        <div className="relative overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `url(${communityBgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.3
            }}
          />
          
          {/* Content */}
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center space-y-6">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                  Ceylon Expand Community
                </h1>
                <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
                  Ask questions, share knowledge, and connect with fellow travelers exploring Sri Lanka.
                </p>
              </div>
              
              {/* Community Stats */}
              <div className="flex justify-center">
                <CommunityStats />
              </div>
              
              {/* Primary CTA */}
              <div className="flex justify-center">
                <AskQuestionDialog 
                  topics={topics} 
                  isAuthenticated={!!user}
                  onSignInRequired={() => window.location.href = '/auth/signin'}
                >
                  <Button 
                    size="lg"
                    className="bg-white text-ceylon-blue hover:bg-gray-100 font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    data-testid="button-ask-question"
                  >
                    <Plus className="w-6 h-6 mr-3" />
                    Ask a Question
                  </Button>
                </AskQuestionDialog>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sticky Filters */}
      <StickyFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedTopic={selectedTopic}
        setSelectedTopic={setSelectedTopic}
        sortBy={sortBy}
        setSortBy={setSortBy}
        topics={topics}
        isLoading={isLoading}
      />
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Questions Feed */}
          <div className="lg:col-span-3 space-y-6">
            {/* Questions Feed */}
            {isLoading ? (
              // Loading Skeleton
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-2">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                          </div>
                          <div className="flex space-x-3">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : questions.length > 0 ? (
              // Questions List
              <div className="space-y-6">
                {questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    currentUserId={user?.id}
                    onEdit={handleEditQuestion}
                    onDelete={handleDeleteQuestion}
                    showPreview={true}
                  />
                ))}
              </div>
            ) : (
              // Empty State
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <MessageSquare className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {searchQuery || selectedTopic !== "all" 
                      ? "No questions found" 
                      : "No questions yet"
                    }
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                    {searchQuery 
                      ? "Try adjusting your search terms or browse different topics" 
                      : selectedTopic !== "all"
                      ? "Be the first to ask a question about this topic"
                      : "Be the first to start a conversation in our community"
                    }
                  </p>
                  <AskQuestionDialog 
                    topics={topics} 
                    isAuthenticated={!!user}
                    onSignInRequired={() => window.location.href = '/auth/signin'}
                  >
                    <Button className="bg-ceylon-green hover:bg-ceylon-green/90 px-6 py-3">
                      <Plus className="w-5 h-5 mr-2" />
                      {searchQuery || selectedTopic !== "all" 
                        ? "Ask a Question" 
                        : "Ask the First Question"
                      }
                    </Button>
                  </AskQuestionDialog>
                </div>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                {renderPagination()}
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-ceylon-blue">30</div>
                    <div className="text-sm text-gray-500">Questions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-ceylon-green">24</div>
                    <div className="text-sm text-gray-500">Answers</div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-ceylon-orange">12</div>
                    <div className="text-sm text-gray-500">Topics</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Popular Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topics.slice(0, 6).map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedTopic === topic.id
                          ? "bg-ceylon-blue text-white"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {topic.name}
                    </button>
                  ))}
                  {topics.length > 6 && (
                    <button className="w-full text-left px-3 py-2 text-sm text-ceylon-blue hover:text-ceylon-blue/80">
                      View all topics →
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Asking Great Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-ceylon-blue rounded-full mt-1.5 flex-shrink-0" />
                    <span>Be specific and descriptive in your title</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-ceylon-green rounded-full mt-1.5 flex-shrink-0" />
                    <span>Include relevant details and context</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-ceylon-orange rounded-full mt-1.5 flex-shrink-0" />
                    <span>Use appropriate tags and topics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span>Search existing questions first</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}