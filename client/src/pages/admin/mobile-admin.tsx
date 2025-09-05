import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Users, 
  MapPin, 
  AlertTriangle, 
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  Check,
  X,
  Eye,
  Settings
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function MobileAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch mobile dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/admin/mobile/dashboard'],
    refetchInterval: 30000
  });

  // Fetch recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ['/api/admin/mobile/activity'],
    refetchInterval: 10000
  });

  // Mock data for demo - replace with real data
  const stats = {
    activeUsers: 1247,
    pendingReports: 8,
    activeTrips: 156,
    moderationQueue: 12
  };

  const quickActions = [
    {
      title: 'Moderate Content',
      icon: AlertTriangle,
      color: 'text-orange-500',
      count: 8,
      action: 'moderate'
    },
    {
      title: 'Review Users',
      icon: Users,
      color: 'text-blue-500',
      count: 23,
      action: 'users'
    },
    {
      title: 'Check Trips',
      icon: MapPin,
      color: 'text-green-500',
      count: 156,
      action: 'trips'
    },
    {
      title: 'View Analytics',
      icon: TrendingUp,
      color: 'text-purple-500',
      count: null,
      action: 'analytics'
    }
  ];

  const recentItems = [
    {
      id: '1',
      type: 'report',
      title: 'New spam report',
      description: 'User reported inappropriate content in trip listing',
      time: '2 min ago',
      priority: 'high',
      status: 'pending'
    },
    {
      id: '2',
      type: 'user',
      title: 'New user registration',
      description: 'Sarah Chen joined from Colombo',
      time: '15 min ago',
      priority: 'low',
      status: 'approved'
    },
    {
      id: '3',
      type: 'trip',
      title: 'Trip modification',
      description: 'Kandy to Galle trip updated pricing',
      time: '1 hour ago',
      priority: 'medium',
      status: 'reviewed'
    },
    {
      id: '4',
      type: 'report',
      title: 'AI flag triggered',
      description: 'Automatic moderation flagged comment',
      time: '2 hours ago',
      priority: 'medium',
      status: 'auto-resolved'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'reviewed': return 'bg-blue-500';
      case 'auto-resolved': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-orange-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'report': return AlertTriangle;
      case 'user': return Users;
      case 'trip': return MapPin;
      default: return AlertTriangle;
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Mobile Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Mobile Admin</h1>
            <p className="text-sm text-muted-foreground">
              Quick admin actions on the go
            </p>
          </div>
          <Smartphone className="w-6 h-6 text-blue-500" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Users</p>
                <p className="text-lg font-bold">{stats.activeUsers}</p>
              </div>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Reports</p>
                <p className="text-lg font-bold text-orange-500">{stats.pendingReports}</p>
              </div>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Trips</p>
                <p className="text-lg font-bold">{stats.activeTrips}</p>
              </div>
              <MapPin className="w-4 h-4 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Queue</p>
                <p className="text-lg font-bold">{stats.moderationQueue}</p>
              </div>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                  data-testid={`action-${action.action}`}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className={`w-4 h-4 ${action.color}`} />
                    <span className="text-sm font-medium">{action.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {action.count && (
                      <Badge variant="secondary" className="text-xs">
                        {action.count}
                      </Badge>
                    )}
                    <MoreVertical className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              data-testid="input-search"
            />
          </div>
          
          <div className="flex gap-2">
            {['all', 'reports', 'users', 'trips'].map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className="text-xs"
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentItems
              .filter(item => activeFilter === 'all' || item.type === activeFilter.slice(0, -1))
              .filter(item => 
                searchTerm === '' || 
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((item) => {
                const IconComponent = getTypeIcon(item.type);
                return (
                  <div key={item.id} className="flex items-start gap-3 p-2 rounded-md border">
                    <div className={`p-1 rounded-full bg-muted`}>
                      <IconComponent className="w-3 h-3" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`} />
                          <span className={`text-xs ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                        </div>
                      </div>
                      
                      {item.status === 'pending' && (
                        <div className="flex gap-1 mt-2">
                          <Button size="sm" variant="outline" className="h-6 text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 text-xs">
                            <X className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {/* Mobile Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Mobile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Push Notifications</span>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Auto-refresh</span>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Dark Mode</span>
              <input type="checkbox" className="toggle" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Summary */}
        <div className="text-center text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </AdminLayout>
  );
}