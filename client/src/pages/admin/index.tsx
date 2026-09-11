import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  FileText,
  Flag,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Loader2,
  MapPin
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface DashboardStats {
  users: {
    total: number;
    active24h: number;
    newToday: number;
  };
  trips: {
    total: number;
    active: number;
    pending: number;
  };
  reports: {
    total: number;
    open: number;
    resolved24h: number;
  };
  chat: {
    activeThreads: number;
    flaggedMessages: number;
  };
  activityChart: { date: string; signups: number; trips: number }[];
  routeClusters: { name: string; count: number }[];
  recentSignups: { id: string; name: string; email: string; createdAt: string }[];
  recentTrips: { id: string; title: string; fromLocation: string; toLocation: string; type: string; createdAt: string }[];
}

function formatChartDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  permission 
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; label: string; positive: boolean };
  permission?: string;
}) {
  const content = (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {trend && (
          <div className={`text-xs mt-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.positive ? '+' : ''}{trend.value} {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (permission) {
    return (
      <PermissionGuard permission={permission} fallback={
        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restricted</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">No permission</p>
          </CardContent>
        </Card>
      }>
        {content}
      </PermissionGuard>
    );
  }

  return content;
}

export default function AdminOverviewPage() {
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const dashboardStats: DashboardStats = stats ?? {
    users: { total: 0, active24h: 0, newToday: 0 },
    trips: { total: 0, active: 0, pending: 0 },
    reports: { total: 0, open: 0, resolved24h: 0 },
    chat: { activeThreads: 0, flaggedMessages: 0 },
    activityChart: [],
    routeClusters: [],
    recentSignups: [],
    recentTrips: [],
  };

  const maxClusterCount = Math.max(1, ...dashboardStats.routeClusters.map((c) => c.count));

  const seedSampleData = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/seed-data", undefined, {
        timeout: 60000,
      });
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Sample trips are ready",
        description: result?.data?.trips || "10 sample trips are now available.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not seed sample trips",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSeedSampleData = () => {
    const confirmed = window.confirm(
      "Add any missing sample trips and sample questions? Existing trips and questions will not be deleted."
    );
    if (confirmed) {
      seedSampleData.mutate();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {adminUser?.email}. Here's what's happening on HiBowan.
          </p>
        </div>

        {/* Admin Status Alert */}
        {adminUser && !adminUser.isEmailVerified && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-800">Email Verification Required</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-700">
                Your email address is not verified. Some admin functions may be restricted until you verify your email.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={dashboardStats.users.total.toLocaleString()}
            subtitle={`${dashboardStats.users.newToday} new today`}
            icon={Users}
            trend={{
              value: dashboardStats.users.active24h,
              label: "active 24h",
              positive: true
            }}
            permission="users.view"
          />

          <StatCard
            title="Active Trips"
            value={dashboardStats.trips.active.toLocaleString()}
            subtitle={`${dashboardStats.trips.pending} pending review`}
            icon={FileText}
            trend={{
              value: dashboardStats.trips.total - dashboardStats.trips.active,
              label: "total trips",
              positive: true
            }}
            permission="trips.view"
          />

          <StatCard
            title="Open Reports"
            value={dashboardStats.reports.open.toLocaleString()}
            subtitle={`${dashboardStats.reports.resolved24h} resolved today`}
            icon={Flag}
            trend={{
              value: dashboardStats.reports.open,
              label: "need attention",
              positive: dashboardStats.reports.open === 0
            }}
            permission="reports.view"
          />

          <StatCard
            title="Chat Moderation"
            value={dashboardStats.chat.flaggedMessages.toLocaleString()}
            subtitle={`${dashboardStats.chat.activeThreads} active threads`}
            icon={MessageSquare}
            permission="chat.view"
          />
        </div>

        {/* 30-Day Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Signups & Trips — Last 30 Days
            </CardTitle>
            <CardDescription>
              Daily new signups and trips posted. Excludes sample/test data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardStats.activityChart} margin={{ top: 5, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={formatChartDate} interval={4} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip labelFormatter={formatChartDate} />
                  <Legend />
                  <Line type="monotone" dataKey="signups" name="Signups" stroke="#DB354E" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="trips" name="Trips Posted" stroke="#3F8AB4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Launch Route Clusters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Launch Route Clusters
            </CardTitle>
            <CardDescription>
              Trips touching each of the three routes HiBowan launched with, of {dashboardStats.trips.total} total trips.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats.routeClusters.map((cluster) => (
                <div key={cluster.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900">{cluster.name}</span>
                    <span className="text-gray-500">{cluster.count.toLocaleString()} trip{cluster.count === 1 ? '' : 's'}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${(cluster.count / maxClusterCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Signups / Recent Trips */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Signups
              </CardTitle>
              <CardDescription>Last 20 real signups, newest first</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {dashboardStats.recentSignups.length === 0 ? (
                  <div className="text-sm text-gray-500">No signups yet.</div>
                ) : (
                  dashboardStats.recentSignups.map((u) => (
                    <div key={u.id} className="flex items-center justify-between gap-3 text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{u.name}</div>
                        <div className="text-gray-500 truncate">{u.email}</div>
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Trips Posted
              </CardTitle>
              <CardDescription>Last 20 real trips, newest first</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {dashboardStats.recentTrips.length === 0 ? (
                  <div className="text-sm text-gray-500">No trips posted yet.</div>
                ) : (
                  dashboardStats.recentTrips.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-3 text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{t.title}</div>
                        <div className="text-gray-500 truncate">{t.fromLocation} → {t.toLocation}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge variant="outline" className="text-xs">{t.type}</Badge>
                        <div className="text-xs text-gray-400 mt-1">{new Date(t.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Admin Activity
              </CardTitle>
              <CardDescription>
                Latest actions performed by admin team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ceylon-green mx-auto"></div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No recent activity to display.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Priority Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Priority Actions
              </CardTitle>
              <CardDescription>
                Items that need immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <PermissionGuard permission="reports.view">
                  {dashboardStats.reports.open > 0 && (
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">
                          {dashboardStats.reports.open} pending reports
                        </span>
                      </div>
                      <Badge variant="destructive">{dashboardStats.reports.open}</Badge>
                    </div>
                  )}
                </PermissionGuard>

                <PermissionGuard permission="trips.view">
                  {dashboardStats.trips.pending > 0 && (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          {dashboardStats.trips.pending} trips pending review
                        </span>
                      </div>
                      <Badge variant="outline">{dashboardStats.trips.pending}</Badge>
                    </div>
                  )}
                </PermissionGuard>

                {dashboardStats.reports.open === 0 && dashboardStats.trips.pending === 0 && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      All caught up! No urgent actions needed.
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-brand/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-brand" />
              Sample Content
            </CardTitle>
            <CardDescription>
              Add any missing sample trips and community questions to this environment.
              Existing content is kept unchanged.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSeedSampleData}
              disabled={seedSampleData.isPending}
              className="bg-brand text-white hover:bg-brand/90"
            >
              {seedSampleData.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding sample content...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Seed 10 Sample Trips
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Role Information */}
        <Card>
          <CardHeader>
            <CardTitle>Your Admin Role</CardTitle>
            <CardDescription>
              Current permissions and access level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={`${
                  adminUser?.role === 'superadmin' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                  adminUser?.role === 'admin' ? 'bg-blue-500' :
                  adminUser?.role === 'moderator' ? 'bg-green-500' : 'bg-gray-500'
                } text-white`}>
                  {adminUser?.role}
                </Badge>
                <span className="text-sm text-gray-600">
                  {adminUser?.permissions.length} permissions granted
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="mb-2"><strong>Email:</strong> {adminUser?.email}</p>
                <p><strong>Last Authentication:</strong> {
                  adminUser?.lastAuthTime 
                    ? new Date(adminUser.lastAuthTime).toLocaleString()
                    : 'Just now'
                }</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}