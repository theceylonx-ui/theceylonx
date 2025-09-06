import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, TrendingUp, Clock, MessageSquare } from "lucide-react";
import type { Topic } from "@shared/schema";

interface StickyFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
  sortBy: "top" | "new" | "unanswered";
  setSortBy: (sort: "top" | "new" | "unanswered") => void;
  topics: Topic[];
  isLoading?: boolean;
}

export function StickyFilters({
  searchQuery,
  setSearchQuery,
  selectedTopic,
  setSelectedTopic,
  sortBy,
  setSortBy,
  topics,
  isLoading = false
}: StickyFiltersProps) {
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const getSortIcon = (sort: "top" | "new" | "unanswered") => {
    switch (sort) {
      case "top":
        return <TrendingUp className="h-4 w-4" />;
      case "new":
        return <Clock className="h-4 w-4" />;
      case "unanswered":
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getSortLabel = (sort: "top" | "new" | "unanswered") => {
    switch (sort) {
      case "top":
        return "Top";
      case "new":
        return "New";
      case "unanswered":
        return "Unanswered";
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Main Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search questions about Sri Lanka travel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 h-12 text-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-ceylon-blue focus:ring-ceylon-blue"
            disabled={isLoading}
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          
          {/* Left side - Sort and Topic filters */}
          <div className="flex flex-wrap gap-3 items-center">
            
            {/* Sort Toggle Buttons */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {(["top", "new", "unanswered"] as const).map((sort) => (
                <Button
                  key={sort}
                  variant={sortBy === sort ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSortBy(sort)}
                  className={`px-3 py-1.5 h-auto text-sm ${
                    sortBy === sort 
                      ? "bg-white dark:bg-gray-700 shadow-sm text-ceylon-blue" 
                      : "hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  disabled={isLoading}
                >
                  <span className="flex items-center gap-2">
                    {getSortIcon(sort)}
                    <span className="hidden sm:inline">{getSortLabel(sort)}</span>
                  </span>
                </Button>
              ))}
            </div>

            {/* Topic Filter */}
            <Select value={selectedTopic} onValueChange={setSelectedTopic} disabled={isLoading}>
              <SelectTrigger className="w-40 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectValue placeholder="All Topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {topics && topics.length > 0 && topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right side - Mobile filter toggle */}
          <div className="sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="h-9"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Mobile Expanded Filters */}
        {isFiltersExpanded && (
          <div className="sm:hidden mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Sort by
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["top", "new", "unanswered"] as const).map((sort) => (
                    <Button
                      key={sort}
                      variant={sortBy === sort ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy(sort)}
                      className="justify-start"
                      disabled={isLoading}
                    >
                      {getSortIcon(sort)}
                      <span className="ml-2">{getSortLabel(sort)}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}