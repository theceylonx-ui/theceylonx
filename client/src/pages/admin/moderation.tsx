import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { DestructiveActionButton } from "@/components/admin/DestructiveActionButton";
import { getDisplayName } from "@/lib/profileUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  AlertTriangle, 
  Flag, 
  Shield, 
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  XCircle,
  User,
  MessageSquare,
  MapPin,
  Filter,
  Search,
  MoreHorizontal,
  Ban,
  UserX,
  Trash2,
  Edit,
  AlertCircle,
  TrendingUp,
  Activity
} from "lucide-react";

interface Report {
  id: string;
  context: 'trip' | 'user' | 'chat_message';
  tripId?: string;
  userId?: string;
  threadId?: string;
  messageId?: string;
  reporterId: string;
  reason: string;
  description?: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  autoFlagged: boolean;
  flagScore: number;
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  reporter?: {
    id: string;
    email: string;
    displayName?: string | null;
    username?: string | null;
  };
  assignee?: {
    id: string;
    email: string;
    displayName?: string | null;
    username?: string | null;
  };
}

interface ContentFlag {
  id: string;
  contentType: string;
  contentId: string;
  flagType: string;
  severity: number;
  autoDetected: boolean;
  detectionMethod?: string;
  confidenceScore?: number;
  status: 'pending' | 'confirmed' | 'false_positive' | 'resolved';
  createdAt: string;
  reviewedAt?: string;
}

interface ModerationAction {
  id: string;
  actionType: string;
  targetType: string;
  targetId: string;
  reason?: string;
  durationHours?: number;
  createdAt: string;
  moderator: {
    id: string;
    email: string;
    displayName?: string | null;
    username?: string | null;
  };
}

function ReportCard({ report, onAssign, onResolve, onEscalate }: {
  report: Report;
  onAssign: (reportId: string, moderatorId: string) => void;
  onResolve: (reportId: string, resolution: string, notes: string) => void;
  onEscalate: (reportId: string) => void;
}) {
  const { hasPermission } = useAdminAuth();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-50';
      case 'investigating': return 'text-yellow-600 bg-yellow-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      case 'dismissed': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getContextIcon = (context: string) => {
    switch (context) {
      case 'trip': return <MapPin className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      case 'chat_message': return <MessageSquare className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getContextIcon(report.context)}
            <div>
              <CardTitle className="text-lg">
                {report.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-white text-xs ${getPriorityColor(report.priority)}`}>
                  {report.priority}
                </Badge>
                <Badge className={`text-xs ${getStatusColor(report.status)}`}>
                  {report.status}
                </Badge>
                {report.autoFlagged && (
                  <Badge variant="outline" className="text-xs">
                    Auto-flagged
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {report.flagScore > 0 && (
              <div className="text-sm text-gray-600">
                Score: {report.flagScore}
              </div>
            )}
            <Button variant="ghost" size="sm" data-testid={`button-actions-${report.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {report.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {report.description}
            </p>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Reporter:</span>
              <div className="text-gray-600">
                {getDisplayName(report.reporter) || 'Unknown'}
              </div>
            </div>
            <div>
              <span className="font-medium">Created:</span>
              <div className="text-gray-600">
                {new Date(report.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <span className="font-medium">Context:</span>
              <div className="text-gray-600 capitalize">
                {report.context.replace('_', ' ')}
              </div>
            </div>
            <div>
              <span className="font-medium">Assigned:</span>
              <div className="text-gray-600">
                {report.assignee ? getDisplayName(report.assignee) : 'Unassigned'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t">
            <PermissionGuard permission="reports.edit">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onAssign(report.id, 'current_user')}
                disabled={report.status === 'resolved'}
                data-testid={`button-assign-${report.id}`}
              >
                <User className="h-4 w-4 mr-1" />
                Assign to Me
              </Button>
            </PermissionGuard>
            
            <PermissionGuard permission="reports.edit">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onEscalate(report.id)}
                disabled={report.priority === 'critical'}
                data-testid={`button-escalate-${report.id}`}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Escalate
              </Button>
            </PermissionGuard>

            {report.status === 'investigating' && (
              <PermissionGuard permission="reports.edit">
                <Button 
                  size="sm"
                  onClick={() => onResolve(report.id, 'resolved', '')}
                  data-testid={`button-resolve-${report.id}`}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Resolve
                </Button>
              </PermissionGuard>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ModerationQueue() {
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reports with filtering
  const { data: reportsData, isLoading } = useQuery<{ reports: Report[]; total: number; pages: number }>({
    queryKey: ['/api/admin/reports', { priority: selectedPriority, status: selectedStatus, search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedPriority) params.append('priority', selectedPriority);
      if (selectedStatus) params.append('status', selectedStatus);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/admin/reports?${params}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    },
  });

  const reports = reportsData?.reports || [];

  // Assign report mutation
  const assignMutation = useMutation({
    mutationFn: async ({ reportId, moderatorId }: { reportId: string; moderatorId: string }) => {
      return await apiRequest('PATCH', `/api/admin/reports/${reportId}/assign`, { moderatorId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      toast({ title: 'Success', description: 'Report assigned successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Resolve report mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ reportId, resolution, notes }: { reportId: string; resolution: string; notes: string }) => {
      return await apiRequest('PATCH', `/api/admin/reports/${reportId}/resolve`, { resolution, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      toast({ title: 'Success', description: 'Report resolved successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Escalate report mutation
  const escalateMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return await apiRequest('PATCH', `/api/admin/reports/${reportId}/escalate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      toast({ title: 'Success', description: 'Report escalated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleAssign = (reportId: string, moderatorId: string) => {
    assignMutation.mutate({ reportId, moderatorId });
  };

  const handleResolve = (reportId: string, resolution: string, notes: string) => {
    resolveMutation.mutate({ reportId, resolution, notes });
  };

  const handleEscalate = (reportId: string) => {
    escalateMutation.mutate(reportId);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ceylon-green mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
          <p className="text-gray-600">No reports match your current filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report: Report) => (
            <ReportCard
              key={report.id}
              report={report}
              onAssign={handleAssign}
              onResolve={handleResolve}
              onEscalate={handleEscalate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminModerationPage() {
  const [selectedTab, setSelectedTab] = useState('queue');
  const { hasPermission } = useAdminAuth();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Moderation</h1>
            <p className="text-gray-600 mt-2">
              Manage reports, flags, and moderation actions
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              <Activity className="h-4 w-4 mr-1" />
              Live Queue
            </Badge>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="queue">Moderation Queue</TabsTrigger>
            <TabsTrigger value="flags">Content Flags</TabsTrigger>
            <TabsTrigger value="actions">Moderation Actions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="queue">
            <PermissionGuard permission="reports.view" showError>
              <ModerationQueue />
            </PermissionGuard>
          </TabsContent>

          <TabsContent value="flags">
            <PermissionGuard permission="reports.view" showError>
              <Card>
                <CardHeader>
                  <CardTitle>Content Flags</CardTitle>
                  <CardDescription>
                    Automatic and manual content flags requiring review
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    Content flags dashboard coming soon
                  </div>
                </CardContent>
              </Card>
            </PermissionGuard>
          </TabsContent>

          <TabsContent value="actions">
            <PermissionGuard permission="reports.view" showError>
              <Card>
                <CardHeader>
                  <CardTitle>Moderation Actions</CardTitle>
                  <CardDescription>
                    History of all moderation actions taken
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    Moderation actions log coming soon
                  </div>
                </CardContent>
              </Card>
            </PermissionGuard>
          </TabsContent>

          <TabsContent value="analytics">
            <PermissionGuard permission="reports.view" showError>
              <Card>
                <CardHeader>
                  <CardTitle>Moderation Analytics</CardTitle>
                  <CardDescription>
                    Statistics and trends for moderation activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    Moderation analytics coming soon
                  </div>
                </CardContent>
              </Card>
            </PermissionGuard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}