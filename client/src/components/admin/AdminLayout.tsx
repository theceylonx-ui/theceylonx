import { ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { PermissionGuard } from "./PermissionGuard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Flag,
  MessageSquare,
  Tags,
  Bell,
  FileBarChart,
  Settings,
  Shield,
  LogOut,
  User,
  Crown
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  permission?: string;
  badge?: string | number;
  isActive?: boolean;
}

function NavItem({ href, icon: Icon, label, permission, badge, isActive }: NavItemProps) {
  const content = (
    <Button
      variant={isActive ? "default" : "ghost"}
      className={`w-full justify-start ${isActive ? 'bg-ceylon-green text-white shadow-md' : 'text-gray-700 hover:text-ceylon-green hover:bg-ceylon-green/10'} transition-all duration-200`}
      asChild
    >
      <Link href={href} data-testid={`nav-${href.replace(/[^a-zA-Z0-9]/g, '-')}`}>
        <Icon className="mr-3 h-4 w-4" />
        {label}
        {badge && (
          <Badge variant="secondary" className="ml-auto">
            {badge}
          </Badge>
        )}
      </Link>
    </Button>
  );

  if (permission) {
    return (
      <PermissionGuard permission={permission}>
        {content}
      </PermissionGuard>
    );
  }

  return content;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { adminUser, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ceylon-green mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading admin interface...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              You don't have permission to access the admin panel.
            </p>
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'moderator': return <User className="h-4 w-4 text-green-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'admin': return 'bg-blue-500 text-white';
      case 'moderator': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg h-screen sticky top-0 overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {getRoleIcon(adminUser.role)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  Admin Panel
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-xs ${getRoleBadgeColor(adminUser.role)}`}>
                    {adminUser.role}
                  </Badge>
                  {!adminUser.isEmailVerified && (
                    <Badge variant="destructive" className="text-xs">
                      Unverified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600 truncate">
              {adminUser.email}
            </div>
          </div>

          <nav className="p-4 space-y-2">
            {/* Overview */}
            <NavItem
              href="/admin"
              icon={LayoutDashboard}
              label="Overview"
              isActive={location === '/admin'}
            />

            <Separator className="my-4" />

            {/* User Management */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                User Management
              </div>
              <NavItem
                href="/admin/users"
                icon={Users}
                label="Users"
                permission="users.view"
                isActive={location.startsWith('/admin/users')}
              />
            </div>

            {/* Content Moderation */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                Content Moderation
              </div>
              <NavItem
                href="/admin/moderation"
                icon={Flag}
                label="Moderation Queue"
                permission="reports.view"
                isActive={location.startsWith('/admin/moderation')}
              />
              <NavItem
                href="/admin/trips"
                icon={FileText}
                label="Trips"
                permission="trips.view"
                isActive={location.startsWith('/admin/trips')}
              />
              <NavItem
                href="/admin/reports"
                icon={Shield}
                label="Legacy Reports"
                permission="reports.view"
                isActive={location.startsWith('/admin/reports')}
              />
              <NavItem
                href="/admin/chat"
                icon={MessageSquare}
                label="Chat Moderation"
                permission="chat.view"
                isActive={location.startsWith('/admin/chat')}
              />
            </div>

            {/* Platform Content */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                Platform Content
              </div>
              <NavItem
                href="/admin/taxonomy"
                icon={Tags}
                label="Taxonomy"
                permission="taxonomy.view"
                isActive={location.startsWith('/admin/taxonomy')}
              />
              <NavItem
                href="/admin/notifications"
                icon={Bell}
                label="Notifications"
                permission="settings.view"
                isActive={location.startsWith('/admin/notifications')}
              />
            </div>

            {/* System Administration */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                System
              </div>
              <NavItem
                href="/admin/logs"
                icon={FileBarChart}
                label="Audit Logs"
                permission="logs.view"
                isActive={location.startsWith('/admin/logs')}
              />
              <PermissionGuard permission="roles.view">
                <NavItem
                  href="/admin/roles"
                  icon={Shield}
                  label="Roles & Access"
                  permission="roles.view"
                  isActive={location.startsWith('/admin/roles')}
                />
              </PermissionGuard>
              <NavItem
                href="/admin/settings"
                icon={Settings}
                label="Settings"
                permission="settings.view"
                isActive={location.startsWith('/admin/settings')}
              />
            </div>

            <Separator className="my-4" />

            {/* Exit Admin */}
            <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-red-600" asChild>
              <Link href="/" data-testid="nav-exit-admin">
                <LogOut className="mr-3 h-4 w-4" />
                Exit Admin
              </Link>
            </Button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}