import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Download, 
  Filter,
  Clock,
  User,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  BarChart3
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { format } from 'date-fns';

interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({});
  const [page, setPage] = useState(1);

  // Fetch audit logs
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['/api/admin/audit-logs', {
      search: searchTerm,
      action: actionFilter,
      resource: resourceFilter,
      user: userFilter,
      startDate: dateRange.from?.toISOString(),
      endDate: dateRange.to?.toISOString(),
      page,
      limit: 50
    }],
    refetchInterval: 30000
  });

  // Fetch audit statistics
  const { data: auditStats } = useQuery({
    queryKey: ['/api/admin/audit-logs/stats', { days: 30 }],
    refetchInterval: 60000
  });

  // Mock data for demo
  const mockAuditLogs: AuditEntry[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      userId: 'admin-1',
      userEmail: 'admin@ceylonexpand.com',
      action: 'admin.user.status_update',
      resource: 'user',
      resourceId: 'user-123',
      success: true,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      metadata: { oldStatus: 'active', newStatus: 'suspended' }
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      userId: 'mod-1',
      userEmail: 'moderator@ceylonexpand.com',
      action: 'admin.report.resolve',
      resource: 'report',
      resourceId: 'report-456',
      success: true,
      ipAddress: '192.168.1.2',
      metadata: { resolution: 'approved', notes: 'No violation found' }
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      userId: 'admin-1',
      userEmail: 'admin@ceylonexpand.com',
      action: 'admin.trip.remove',
      resource: 'trip',
      resourceId: 'trip-789',
      success: false,
      ipAddress: '192.168.1.1',
      metadata: { error: 'Trip has active participants' }
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      userId: 'system',
      userEmail: 'system@ceylonexpand.com',
      action: 'system.ai_moderation',
      resource: 'trip',
      resourceId: 'trip-101',
      success: true,
      ipAddress: 'internal',
      metadata: { aiDecision: 'flag', riskLevel: 'medium' }
    }
  ];

  const mockStats = {
    totalActions: 2847,
    uniqueUsers: 23,
    successRate: 94.2,
    topActions: [
      { action: 'admin.user.view', count: 567 },
      { action: 'admin.report.resolve', count: 234 },
      { action: 'admin.trip.moderate', count: 189 },
      { action: 'system.ai_moderation', count: 156 }
    ],
    topUsers: [
      { userId: 'admin-1', userEmail: 'admin@ceylonexpand.com', count: 834 },
      { userId: 'mod-1', userEmail: 'moderator@ceylonexpand.com', count: 567 },
      { userId: 'system', userEmail: 'system@ceylonexpand.com', count: 423 }
    ],
    dailyActivity: [
      { date: '2024-01-15', count: 45 },
      { date: '2024-01-16', count: 67 },
      { date: '2024-01-17', count: 89 },
      { date: '2024-01-18', count: 123 },
      { date: '2024-01-19', count: 78 }
    ]
  };

  const filteredLogs = mockAuditLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = !actionFilter || log.action.includes(actionFilter);
    const matchesResource = !resourceFilter || log.resource === resourceFilter;
    const matchesUser = !userFilter || log.userId === userFilter;
    
    return matchesSearch && matchesAction && matchesResource && matchesUser;
  });

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return User;
    if (action.includes('report')) return AlertTriangle;
    if (action.includes('trip')) return Activity;
    if (action.includes('system')) return Shield;
    return Activity;
  };

  const getSuccessIcon = (success: boolean) => {
    return success ? CheckCircle : XCircle;
  };

  const getSuccessColor = (success: boolean) => {
    return success ? 'text-green-500' : 'text-red-500';
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">
              Track all administrative actions and system events
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="logs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="logs">Audit Logs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Search</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                        data-testid="input-audit-search"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Action</label>
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All actions</SelectItem>
                        <SelectItem value="admin.user">User Management</SelectItem>
                        <SelectItem value="admin.report">Report Management</SelectItem>
                        <SelectItem value="admin.trip">Trip Management</SelectItem>
                        <SelectItem value="system">System Actions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Resource</label>
                    <Select value={resourceFilter} onValueChange={setResourceFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All resources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All resources</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="trip">Trip</SelectItem>
                        <SelectItem value="report">Report</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Date Range</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd")} -{" "}
                                {format(dateRange.to, "LLL dd")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            "Pick a date range"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setActionFilter('');
                      setResourceFilter('');
                      setUserFilter('');
                      setDateRange({});
                    }}
                  >
                    Clear Filters
                  </Button>
                  <Badge variant="secondary">
                    {filteredLogs.length} results
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Audit Log Entries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredLogs.map((log) => {
                    const ActionIcon = getActionIcon(log.action);
                    const SuccessIcon = getSuccessIcon(log.success);
                    
                    return (
                      <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <ActionIcon className="w-4 h-4 text-muted-foreground" />
                          <SuccessIcon className={`w-4 h-4 ${getSuccessColor(log.success)}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{log.action}</span>
                                <Badge variant="outline" className="text-xs">
                                  {log.resource}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                by {log.userEmail || log.userId} • {log.ipAddress}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Resource ID: {log.resourceId}
                              </p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm">
                                {format(log.timestamp, 'MMM dd, HH:mm')}
                              </p>
                              <Badge 
                                variant={log.success ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {log.success ? 'Success' : 'Failed'}
                              </Badge>
                            </div>
                          </div>

                          {log.metadata && (
                            <div className="mt-2 p-2 bg-muted rounded text-xs">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>

                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {filteredLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No audit logs found matching your filters
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Actions
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.totalActions}</div>
                  <p className="text-xs text-muted-foreground">
                    Last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Users
                  </CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.uniqueUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Unique admin users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Success Rate
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.successRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Actions completed successfully
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    AI Actions
                  </CardTitle>
                  <Shield className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-xs text-muted-foreground">
                    Automated moderation
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Top Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockStats.topActions.map((action, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{action.action}</span>
                        <Badge variant="secondary">{action.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Most Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockStats.topUsers.map((user, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">{user.userEmail}</span>
                          <p className="text-xs text-muted-foreground">{user.userId}</p>
                        </div>
                        <Badge variant="secondary">{user.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure audit logging preferences and retention policies
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Enable Audit Logging</h4>
                      <p className="text-sm text-muted-foreground">
                        Track all administrative actions and system events
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Log User Actions</h4>
                      <p className="text-sm text-muted-foreground">
                        Record detailed user management actions
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Log System Events</h4>
                      <p className="text-sm text-muted-foreground">
                        Track automated system actions and AI decisions
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Retention Period (days)
                    </label>
                    <Input
                      type="number"
                      defaultValue="90"
                      min="30"
                      max="365"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      How long to keep audit logs before automatic deletion
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}