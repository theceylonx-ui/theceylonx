import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { 
  Users, 
  FileText, 
  Flag, 
  MessageSquare, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

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

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const dashboardStats: DashboardStats = stats ?? {
    users: { total: 0, active24h: 0, newToday: 0 },
    trips: { total: 0, active: 0, pending: 0 },
    reports: { total: 0, open: 0, resolved24h: 0 },
    chat: { activeThreads: 0, flaggedMessages: 0 }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {adminUser?.email}. Here's what's happening on Ceylon Expand.
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