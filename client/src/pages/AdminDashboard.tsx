import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  BarChart3, 
  FileImage, 
  Shield, 
  ScrollText, 
  Home,
  Search,
  Plus,
  Upload,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  permissions: any;
}

interface DashboardSummary {
  totalUsers: number;
  totalTrips: number;
  flaggedReports: number;
  recentActions: any[];
}

interface UserWithRole {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  role?: {
    id: string;
    name: string;
    permissions: any;
  };
}

interface Role {
  id: string;
  name: string;
  permissions: any;
  createdAt: string;
}

interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  fileUrl: string;
  type: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  meta: any;
  createdAt: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchUsers, setSearchUsers] = useState('');
  const [newRoleDialog, setNewRoleDialog] = useState(false);

  // Check if user has admin access
  const { data: adminUser, isLoading: adminLoading } = useQuery<AdminUser>({
    queryKey: ['/api/admin/me'],
    retry: false,
  });

  // Dashboard data
  const { data: dashboardData } = useQuery<DashboardSummary>({
    queryKey: ['/api/admin/dashboard'],
    enabled: !!adminUser,
  });

  // Users data
  const { data: usersData } = useQuery<{users: UserWithRole[], total: number, pages: number}>({
    queryKey: ['/api/admin/users', searchUsers],
    enabled: !!adminUser && activeTab === 'users',
  });

  // Roles data
  const { data: roles } = useQuery<Role[]>({
    queryKey: ['/api/admin/roles'],
    enabled: !!adminUser && (activeTab === 'roles' || activeTab === 'users'),
  });

  // Media assets
  const { data: mediaData } = useQuery<{assets: MediaAsset[], total: number, pages: number}>({
    queryKey: ['/api/admin/media'],
    enabled: !!adminUser && activeTab === 'content',
  });

  // Audit logs
  const { data: logsData } = useQuery<{logs: AuditLog[], total: number, pages: number}>({
    queryKey: ['/api/admin/logs'],
    enabled: !!adminUser && activeTab === 'logs',
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      await apiRequest(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        body: { roleId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: 'User role updated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update user role', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: { name: string; permissions: any }) => {
      return await apiRequest('/api/admin/roles', {
        method: 'POST',
        body: roleData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
      setNewRoleDialog(false);
      toast({ title: 'Role created successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to create role', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/media'] });
      toast({ title: 'File uploaded successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Upload failed', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'users', label: 'Users', icon: Users, permission: 'canManageUsers' },
    { id: 'content', label: 'Content', icon: FileImage, permission: 'canManageContent' },
    { id: 'roles', label: 'Roles', icon: Shield, permission: 'canManageRoles' },
    { id: 'logs', label: 'Logs', icon: ScrollText, permission: 'canViewLogs' },
  ];

  const hasPermission = (permission: string) => {
    return adminUser.permissions?.[permission] === true;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');
    
    uploadFileMutation.mutate(formData);
  };

  const handleCreateRole = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const roleData = {
      name: formData.get('name') as string,
      permissions: {
        canManageUsers: formData.get('canManageUsers') === 'on',
        canManageContent: formData.get('canManageContent') === 'on',
        canViewLogs: formData.get('canViewLogs') === 'on',
        canManageRoles: formData.get('canManageRoles') === 'on',
      },
    };
    
    createRoleMutation.mutate(roleData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">Ceylon Expand</h1>
          <p className="text-sm text-gray-500">Admin Dashboard</p>
        </div>
        
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            if (item.permission && !hasPermission(item.permission)) {
              return null;
            }
            
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 w-64 p-4 border-t bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {adminUser.email[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {adminUser.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">{adminUser.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.totalUsers || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Trips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.totalTrips || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Flagged Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{dashboardData?.flaggedReports || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData?.recentActions?.slice(0, 10).map((action) => (
                    <div key={action.id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="text-sm font-medium">{action.action}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(action.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">{action.targetType}</Badge>
                    </div>
                  )) || <p className="text-gray-500">No recent actions</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && hasPermission('canManageUsers') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Users</h2>
              <div className="flex gap-4">
                <Input
                  placeholder="Search users..."
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={user.role?.name === 'superadmin' ? 'destructive' : 'secondary'}>
                          {user.role?.name || 'No role'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role?.id || ''}
                          onValueChange={(roleId) => {
                            updateUserRoleMutation.mutate({ userId: user.id, roleId });
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles?.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {activeTab === 'content' && hasPermission('canManageContent') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
              <div className="flex gap-4">
                <Button onClick={() => document.getElementById('file-upload')?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Media Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mediaData?.assets?.map((asset) => (
                    <div key={asset.id} className="border rounded-lg p-4">
                      <img
                        src={asset.fileUrl}
                        alt={asset.originalName}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                      <p className="text-sm font-medium truncate">{asset.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(asset.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )) || <p className="text-gray-500">No media assets found</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'roles' && hasPermission('canManageRoles') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions</h2>
              <Dialog open={newRoleDialog} onOpenChange={setNewRoleDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Role
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Role</DialogTitle>
                    <DialogDescription>
                      Define a new role with specific permissions.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateRole} className="space-y-4">
                    <Input name="name" placeholder="Role name" required />
                    <div className="space-y-2">
                      <p className="font-medium">Permissions:</p>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" name="canManageUsers" />
                        <span>Manage Users</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" name="canManageContent" />
                        <span>Manage Content</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" name="canViewLogs" />
                        <span>View Logs</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" name="canManageRoles" />
                        <span>Manage Roles</span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Create Role</Button>
                      <Button type="button" variant="outline" onClick={() => setNewRoleDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles?.map((role) => (
                <Card key={role.id}>
                  <CardHeader>
                    <CardTitle className="capitalize">{role.name}</CardTitle>
                    <CardDescription>
                      Created {new Date(role.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium text-sm">Permissions:</p>
                      {Object.entries(role.permissions).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm">{key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                          <Badge variant={value ? 'default' : 'secondary'}>
                            {value ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )) || <p className="text-gray-500">No roles found</p>}
            </div>
          </div>
        )}

        {activeTab === 'logs' && hasPermission('canViewLogs') && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Target Type</TableHead>
                    <TableHead>Target ID</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsData?.logs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.targetType}</TableCell>
                      <TableCell className="font-mono text-xs">{log.targetId}</TableCell>
                      <TableCell>
                        <pre className="text-xs text-gray-500">
                          {JSON.stringify(log.meta, null, 2)}
                        </pre>
                      </TableCell>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}