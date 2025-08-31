import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useKpiAnalytics } from "@/hooks/useEnhancedRecommendations";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer, 
  Bookmark, 
  Calendar,
  Activity,
  Zap,
  Target,
  Clock,
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState("7d");
  const [eventType, setEventType] = useState("all");
  const [abTestGroup, setAbTestGroup] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reports data
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/admin/reports'],
    queryFn: () => fetch('/api/admin/reports').then(res => res.json()),
  });

  // Update report status mutation
  const updateReportStatusMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      return await apiRequest("PATCH", `/api/admin/reports/${reportId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      toast({
        title: "Success",
        description: "Report status updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update report status.",
        variant: "destructive",
      });
    },
  });

  // Calculate date range
  const getDateRange = () => {
    const end = endOfDay(new Date());
    let start;
    
    switch (timeRange) {
      case "1d":
        start = startOfDay(new Date());
        break;
      case "7d":
        start = startOfDay(subDays(new Date(), 7));
        break;
      case "30d":
        start = startOfDay(subDays(new Date(), 30));
        break;
      default:
        start = startOfDay(subDays(new Date(), 7));
    }
    
    return { start, end };
  };

  const { start, end } = getDateRange();
  
  const { data: analytics, isLoading } = useKpiAnalytics({
    eventType: eventType === "all" ? undefined : eventType,
    abTestGroup: abTestGroup === "all" ? undefined : abTestGroup,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  });

  const eventTypeColors = {
    ctr_top5: "bg-blue-500",
    trip_click: "bg-green-500",
    save_session: "bg-purple-500",
    chat_start: "bg-orange-500",
    booking_start: "bg-pink-500",
    return_7d: "bg-indigo-500",
  };

  const eventTypeIcons = {
    ctr_top5: Eye,
    trip_click: MousePointer,
    save_session: Bookmark,
    chat_start: Activity,
    booking_start: Target,
    return_7d: Clock,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">ML Analytics Dashboard</h1>
          <div className="animate-pulse">Loading analytics...</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalEvents = analytics?.totalEvents || 0;
  const eventsByType = analytics?.eventsByType || {};
  const eventsByABTest = analytics?.eventsByABTest || {};
  const events = analytics?.events || [];

  // Calculate CTR and engagement metrics
  const ctrEvents = Object.entries(eventsByType).find(([type]) => type === 'ctr_top5')?.[1] || 0;
  const clickEvents = Object.entries(eventsByType).find(([type]) => type === 'trip_click')?.[1] || 0;
  const ctrRate = ctrEvents > 0 ? ((clickEvents / ctrEvents) * 100).toFixed(2) : '0.00';

  const personalizedEvents = eventsByABTest.personalized || 0;
  const baselineEvents = eventsByABTest.baseline || 0;
  const abTestSplit = totalEvents > 0 ? 
    `${((personalizedEvents / totalEvents) * 100).toFixed(1)}% / ${((baselineEvents / totalEvents) * 100).toFixed(1)}%` : 
    'N/A';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            ML Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Advanced recommendation system performance metrics
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7d</SelectItem>
              <SelectItem value="30d">Last 30d</SelectItem>
            </SelectContent>
          </Select>

          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="ctr_top5">CTR Top 5</SelectItem>
              <SelectItem value="trip_click">Trip Clicks</SelectItem>
              <SelectItem value="save_session">Save Session</SelectItem>
              <SelectItem value="chat_start">Chat Start</SelectItem>
              <SelectItem value="booking_start">Booking Start</SelectItem>
              <SelectItem value="return_7d">7-day Return</SelectItem>
            </SelectContent>
          </Select>

          <Select value={abTestGroup} onValueChange={setAbTestGroup}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              <SelectItem value="personalized">Personalized</SelectItem>
              <SelectItem value="baseline">Baseline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange === '1d' ? '24 hours' : timeRange === '7d' ? '7 days' : '30 days'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTR Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{ctrRate}%</div>
            <p className="text-xs text-muted-foreground">
              Top-5 recommendations click-through rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A/B Test Split</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{abTestSplit}</div>
            <p className="text-xs text-muted-foreground">
              Personalized vs Baseline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {totalEvents > 0 ? Math.round((clickEvents / totalEvents) * 100) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall user engagement level
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Event Details</TabsTrigger>
          <TabsTrigger value="abtest">A/B Testing</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Types Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Event Types Distribution</CardTitle>
                <CardDescription>
                  Breakdown of different user interaction types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(eventsByType).map(([type, count]) => {
                    const percentage = totalEvents > 0 ? ((count as number / totalEvents) * 100).toFixed(1) : '0.0';
                    const IconComponent = eventTypeIcons[type as keyof typeof eventTypeIcons] || Activity;
                    
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${eventTypeColors[type as keyof typeof eventTypeColors] || 'bg-gray-500'}`}></div>
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{count as number}</div>
                          <div className="text-xs text-muted-foreground">{percentage}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest user interactions with the recommendation system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.slice(0, 8).map((event, index) => {
                    const IconComponent = eventTypeIcons[event.eventType as keyof typeof eventTypeIcons] || Activity;
                    
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm capitalize">{event.eventType.replace('_', ' ')}</span>
                          {event.abTestGroup && (
                            <Badge variant={event.abTestGroup === 'personalized' ? 'default' : 'secondary'} className="text-xs">
                              {event.abTestGroup}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(event.createdAt), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>
                Detailed view of user interaction events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {events.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {event.eventType.replace('_', ' ')}
                      </Badge>
                      {event.tripId && (
                        <span className="text-sm text-muted-foreground">
                          Trip: {event.tripId.slice(0, 8)}...
                        </span>
                      )}
                      {event.abTestGroup && (
                        <Badge variant={event.abTestGroup === 'personalized' ? 'default' : 'secondary'}>
                          {event.abTestGroup}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(event.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abtest" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>A/B Test Performance</CardTitle>
                <CardDescription>
                  Comparing personalized vs baseline recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Personalized AI</span>
                      <span className="text-sm text-muted-foreground">{personalizedEvents} events</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${totalEvents > 0 ? (personalizedEvents / totalEvents) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Baseline Popular</span>
                      <span className="text-sm text-muted-foreground">{baselineEvents} events</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gray-600 h-2 rounded-full" 
                        style={{ 
                          width: `${totalEvents > 0 ? (baselineEvents / totalEvents) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>
                  Key insights from A/B test results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium">Personalized CTR</div>
                      <div className="text-sm text-muted-foreground">Click-through rate</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {personalizedEvents > 0 ? 
                        ((Object.entries(eventsByType).find(([type]) => type === 'trip_click')?.[1] || 0) / personalizedEvents * 100).toFixed(1) : 
                        '0.0'
                      }%
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Baseline CTR</div>
                      <div className="text-sm text-muted-foreground">Click-through rate</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-600">
                      {baselineEvents > 0 ? 
                        ((Object.entries(eventsByType).find(([type]) => type === 'trip_click')?.[1] || 0) / baselineEvents * 100).toFixed(1) : 
                        '0.0'
                      }%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Trip Reports Management
              </CardTitle>
              <CardDescription>
                Review and manage reported trips for platform safety
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reports to review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">Trip Report</h4>
                            <Badge 
                              variant={
                                report.status === 'resolved' ? 'default' :
                                report.status === 'dismissed' ? 'secondary' : 'destructive'
                              }
                            >
                              {report.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <strong>Reason:</strong> {report.reason}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Trip:</strong> {report.tripTitle}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Reported:</strong> {format(new Date(report.createdAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                          {report.description && (
                            <p className="text-sm">
                              <strong>Details:</strong> {report.description}
                            </p>
                          )}
                        </div>
                        
                        {report.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateReportStatusMutation.mutate({ 
                                reportId: report.id, 
                                status: 'dismissed' 
                              })}
                              disabled={updateReportStatusMutation.isPending}
                              data-testid={`button-dismiss-${report.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateReportStatusMutation.mutate({ 
                                reportId: report.id, 
                                status: 'resolved' 
                              })}
                              disabled={updateReportStatusMutation.isPending}
                              data-testid={`button-resolve-${report.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}