import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Eye, User, UserX, Tag, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Topic } from "@shared/schema";

const questionSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(200, "Title must be less than 200 characters"),
  body: z.string().min(20, "Description must be at least 20 characters").max(5000, "Description must be less than 5000 characters"),
  topicId: z.string().optional(),
  tags: z.array(z.string()).max(5, "Maximum 5 tags allowed").optional(),
  isAnonymous: z.boolean().default(false),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface AskQuestionDialogProps {
  topics: Topic[];
  isAuthenticated: boolean;
  onSignInRequired: () => void;
  children: React.ReactNode;
}

export function AskQuestionDialog({ topics, isAuthenticated, onSignInRequired, children }: AskQuestionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("compose");
  const [tagInput, setTagInput] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const createQuestionMutation = useMutation({
    mutationFn: (data: QuestionFormData) => apiRequest('POST', '/api/questions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      setIsOpen(false);
      form.reset();
      setCurrentTab("compose");
      toast({ 
        title: "Question posted successfully!",
        description: "Your question is now live in the community."
      });
    },
    onError: (error: any) => {
      console.error("Question creation error:", error);
      if (error.message.includes('401')) {
        toast({
          title: "Authentication required",
          description: "Please sign in to ask questions",
          variant: "destructive",
        });
        setIsOpen(false);
        onSignInRequired();
        return;
      }
      toast({ 
        title: "Failed to post question", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: QuestionFormData) => {
    if (!isAuthenticated) {
      setIsOpen(false);
      onSignInRequired();
      return;
    }
    createQuestionMutation.mutate(data);
  };

  const handleTagAdd = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !form.getValues("tags")?.includes(trimmedTag)) {
      const currentTags = form.getValues("tags") || [];
      if (currentTags.length < 5) {
        form.setValue("tags", [...currentTags, trimmedTag]);
        setTagInput("");
      }
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const watchedValues = form.watch();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-ceylon-blue" />
            Ask a Question
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsContent value="compose" className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Question Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Question Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="What would you like to know about Sri Lanka?" 
                          {...field}
                          className="h-12 text-lg"
                          data-testid="input-question-title"
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/200 characters • Be specific and descriptive
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Question Body */}
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide details about your question. Include context, what you've tried, and what specific information you're looking for..."
                          {...field}
                          rows={8}
                          className="text-base resize-y"
                          data-testid="input-question-body"
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/5000 characters • Basic Markdown supported
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Topic Selection */}
                <FormField
                  control={form.control}
                  name="topicId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Topic</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-question-topic">
                            <SelectValue placeholder="Select a topic (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {topics && topics.length > 0 && topics.map((topic) => (
                            <SelectItem key={topic.id} value={topic.id}>
                              {topic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose a relevant topic to help others find your question
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags */}
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Tags</FormLabel>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a tag..."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleTagAdd();
                              }
                            }}
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleTagAdd}
                            disabled={(field.value?.length || 0) >= 5}
                          >
                            <Tag className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Display Tags */}
                        {field.value && field.value.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {field.value.map((tag, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="px-3 py-1 cursor-pointer hover:bg-red-100 hover:text-red-700"
                                onClick={() => handleTagRemove(tag)}
                              >
                                {tag} ×
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <FormDescription>
                        {(field.value?.length || 0)}/5 tags • Click tags to remove them
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Anonymous Posting */}
                <FormField
                  control={form.control}
                  name="isAnonymous"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-anonymous"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2">
                          <UserX className="h-4 w-4" />
                          Post anonymously
                        </FormLabel>
                        <FormDescription>
                          Your name will be hidden and shown as "Anonymous"
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Submit Buttons */}
                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentTab("preview")}
                    disabled={!watchedValues.title || !watchedValues.body}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  
                  <Button 
                    type="submit" 
                    disabled={createQuestionMutation.isPending}
                    className="bg-ceylon-green hover:bg-ceylon-green/90"
                  >
                    {createQuestionMutation.isPending ? "Posting..." : "Post Question"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Preview: How your question will look</span>
                  <Badge variant={watchedValues.isAnonymous ? "outline" : "secondary"}>
                    {watchedValues.isAnonymous ? "Anonymous" : "Your Name"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {watchedValues.title || "Your question title will appear here"}
                  </h3>
                  <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                    {watchedValues.body ? (
                      <div className="whitespace-pre-wrap">{watchedValues.body}</div>
                    ) : (
                      <p className="text-gray-400 italic">Your question description will appear here</p>
                    )}
                  </div>
                </div>

                {/* Tags and Topic Preview */}
                <div className="flex items-center gap-2 flex-wrap">
                  {watchedValues.topicId && (
                    <Badge variant="secondary">
                      {topics.find(t => t.id === watchedValues.topicId)?.name}
                    </Badge>
                  )}
                  {watchedValues.tags?.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentTab("compose")}
              >
                ← Back to Edit
              </Button>
              
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={createQuestionMutation.isPending || !watchedValues.title || !watchedValues.body}
                className="bg-ceylon-green hover:bg-ceylon-green/90"
              >
                {createQuestionMutation.isPending ? "Posting..." : "Post Question"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}