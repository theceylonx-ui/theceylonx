import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Zap,
  Target,
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ContentAnalysis {
  toxicity: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  threats: boolean;
  harassment: boolean;
  spam: boolean;
  inappropriate: boolean;
  confidence: number;
  keywords: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface AIDecision {
  action: 'approve' | 'flag' | 'remove' | 'escalate';
  confidence: number;
  reason: string;
  autoResolve: boolean;
}

interface ModerationResult {
  analysis: ContentAnalysis;
  decision: AIDecision;
  reportId?: string;
  actionTaken: string;
}

interface AISettings {
  enabled: boolean;
  toxicityThreshold: number;
  confidenceThreshold: number;
  autoActions: boolean;
  escalationEnabled: boolean;
  batchProcessing: boolean;
}

export default function AIModerationPage() {
  const [testContent, setTestContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ModerationResult | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch AI moderation stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/ai-moderation/stats'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch AI settings
  const { data: settings } = useQuery({
    queryKey: ['/api/admin/ai-moderation/settings']
  });

  // Test content analysis
  const testAnalysis = async () => {
    if (!testContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter content to analyze",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await apiRequest('/api/admin/ai-moderation/analyze', {
        method: 'POST',
        body: JSON.stringify({
          content: testContent,
          context: 'test'
        })
      });
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete",
        description: `Risk Level: ${result.analysis.riskLevel}, Action: ${result.decision.action}`
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze content",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Batch processing mutation
  const batchProcessMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/ai-moderation/batch-process', {
      method: 'POST'
    }),
    onSuccess: (result) => {
      toast({
        title: "Batch Processing Complete",
        description: `Processed ${result.processed} items, flagged ${result.flagged}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-moderation/stats'] });
    },
    onError: () => {
      toast({
        title: "Batch Processing Failed",
        description: "Failed to process content in batch",
        variant: "destructive"
      });
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Partial<AISettings>) => 
      apiRequest('/api/admin/ai-moderation/settings', {
        method: 'PUT',
        body: JSON.stringify(newSettings)
      }),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "AI moderation settings have been updated"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-moderation/settings'] });
    }
  });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'remove': return 'destructive';
      case 'escalate': return 'destructive';
      case 'flag': return 'secondary';
      case 'approve': return 'default';
      default: return 'default';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Content Moderation</h1>
            <p className="text-muted-foreground">
              Advanced AI-powered content analysis and automated moderation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => batchProcessMutation.mutate()}
              disabled={batchProcessMutation.isPending}
              variant="outline"
            >
              {batchProcessMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Batch Process
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analyzer">Content Analyzer</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Content Analyzed
                  </CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? '---' : stats?.totalAnalyzed || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +{stats?.analyzedToday || 0} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Auto-Flagged
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? '---' : stats?.autoFlagged || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.flaggedRate || 0}% of content
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Auto-Resolved
                  </CardTitle>
                  <Shield className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? '---' : stats?.autoResolved || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.automationRate || 0}% automation
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Accuracy Score
                  </CardTitle>
                  <Target className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? '---' : `${stats?.accuracy || 0}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on human review
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Risk Level Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Risk Level Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['critical', 'high', 'medium', 'low'].map((level) => (
                    <div key={level} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getRiskColor(level)}`} />
                        <span className="capitalize">{level}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={stats?.riskDistribution?.[level] || 0} 
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">
                          {stats?.riskDistribution?.[level] || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analyzer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Analysis Tool</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Test the AI moderation system with custom content
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter content to analyze..."
                  value={testContent}
                  onChange={(e) => setTestContent(e.target.value)}
                  rows={4}
                  data-testid="textarea-test-content"
                />
                <Button 
                  onClick={testAnalysis}
                  disabled={isAnalyzing}
                  data-testid="button-analyze"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  Analyze Content
                </Button>

                {analysisResult && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold">Analysis Results</h3>
                    
                    {/* Risk Assessment */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Risk Assessment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span>Risk Level:</span>
                              <Badge className={getRiskColor(analysisResult.analysis.riskLevel)}>
                                {analysisResult.analysis.riskLevel}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Toxicity:</span>
                              <span>{Math.round(analysisResult.analysis.toxicity * 100)}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Confidence:</span>
                              <span>{Math.round(analysisResult.analysis.confidence * 100)}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">AI Decision</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span>Action:</span>
                              <Badge variant={getActionColor(analysisResult.decision.action) as any}>
                                {analysisResult.decision.action}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Auto-Resolve:</span>
                              <Badge variant={analysisResult.decision.autoResolve ? "default" : "secondary"}>
                                {analysisResult.decision.autoResolve ? "Yes" : "No"}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {analysisResult.decision.reason}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Detailed Analysis */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Detailed Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                              analysisResult.analysis.threats ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                            }`}>
                              {analysisResult.analysis.threats ? '!' : '✓'}
                            </div>
                            <span className="text-sm">Threats</span>
                          </div>
                          <div className="text-center">
                            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                              analysisResult.analysis.harassment ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                            }`}>
                              {analysisResult.analysis.harassment ? '!' : '✓'}
                            </div>
                            <span className="text-sm">Harassment</span>
                          </div>
                          <div className="text-center">
                            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                              analysisResult.analysis.spam ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                            }`}>
                              {analysisResult.analysis.spam ? '!' : '✓'}
                            </div>
                            <span className="text-sm">Spam</span>
                          </div>
                          <div className="text-center">
                            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                              analysisResult.analysis.inappropriate ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                            }`}>
                              {analysisResult.analysis.inappropriate ? '!' : '✓'}
                            </div>
                            <span className="text-sm">Inappropriate</span>
                          </div>
                        </div>

                        {analysisResult.analysis.keywords.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Key Terms:</h4>
                            <div className="flex flex-wrap gap-1">
                              {analysisResult.analysis.keywords.map((keyword, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  AI Moderation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Enable AI Moderation</h4>
                    <p className="text-sm text-muted-foreground">
                      Turn on automated content analysis and flagging
                    </p>
                  </div>
                  <Switch
                    checked={settings?.enabled || false}
                    onCheckedChange={(enabled) => 
                      updateSettingsMutation.mutate({ enabled })
                    }
                    data-testid="switch-ai-enabled"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto Actions</h4>
                    <p className="text-sm text-muted-foreground">
                      Allow AI to automatically take actions on flagged content
                    </p>
                  </div>
                  <Switch
                    checked={settings?.autoActions || false}
                    onCheckedChange={(autoActions) => 
                      updateSettingsMutation.mutate({ autoActions })
                    }
                    disabled={!settings?.enabled}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Toxicity Threshold: {settings?.toxicityThreshold || 0.7}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={settings?.toxicityThreshold || 0.7}
                    onChange={(e) => 
                      updateSettingsMutation.mutate({ 
                        toxicityThreshold: parseFloat(e.target.value) 
                      })
                    }
                    className="w-full"
                    disabled={!settings?.enabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Content above this threshold will be flagged for review
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Confidence Threshold: {settings?.confidenceThreshold || 0.8}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={settings?.confidenceThreshold || 0.8}
                    onChange={(e) => 
                      updateSettingsMutation.mutate({ 
                        confidenceThreshold: parseFloat(e.target.value) 
                      })
                    }
                    className="w-full"
                    disabled={!settings?.enabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum confidence required for automated actions
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Moderation History</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Recent AI-flagged content and actions taken
                </p>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    AI moderation history will be displayed here once content has been processed.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}