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
  Shield, 
  Crown, 
  User, 
  Users, 
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  AlertTriangle,
  Eye,
  EyeOff
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  hierarchy: number;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  user: {
    id: string;
    email: string;
    displayName?: string | null;
    username?: string | null;
  };
  role: Role;
  assignedBy: string;
  assignedAt: string;
  reason?: string;
  isActive: boolean;
}

// Permission categories for better organization
const PERMISSION_CATEGORIES = {
  'User Management': ['users.view', 'users.edit', 'users.ban', 'users.delete'],
  'Content Management': ['trips.view', 'trips.edit', 'trips.delete'],
  'Moderation': ['reports.view', 'reports.edit', 'reports.delete', 'chat.view', 'chat.moderate', 'chat.purge'],
  'System Administration': ['roles.view', 'roles.create', 'roles.edit', 'roles.delete'],
  'Platform Content': ['taxonomy.view', 'taxonomy.edit', 'taxonomy.delete', 'media.view', 'media.upload', 'media.delete'],
  'System Management': ['logs.view', 'logs.delete', 'settings.view', 'settings.edit', 'settings.secrets']
};

function RoleCard({ role, onEdit, onToggle, onDelete }: {
  role: Role;
  onEdit: (role: Role) => void;
  onToggle: (roleId: string, isActive: boolean) => void;
  onDelete: (roleId: string) => void;
}) {
  const { isSuperAdmin } = useAdminAuth();

  const getRoleIcon = (name: string, hierarchy: number) => {
    if (hierarchy >= 100) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (hierarchy >= 20) return <Shield className="h-4 w-4 text-blue-500" />;
    if (hierarchy >= 10) return <UserCheck className="h-4 w-4 text-green-500" />;
    return <User className="h-4 w-4 text-gray-500" />;
  };

  const getHierarchyColor = (hierarchy: number) => {
    if (hierarchy >= 100) return 'bg-gradient-to-r from-yellow-400 to-orange-500';
    if (hierarchy >= 20) return 'bg-blue-500';
    if (hierarchy >= 10) return 'bg-green-500';
    return 'bg-gray-500';
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${!role.isActive ? 'opacity-60' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          {getRoleIcon(role.name, role.hierarchy)}
          <div>
            <CardTitle className="text-lg">{role.displayName}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-white text-xs ${getHierarchyColor(role.hierarchy)}`}>
                {role.name}
              </Badge>
              {role.isSystem && (
                <Badge variant="outline" className="text-xs">
                  System
                </Badge>
              )}
              {!role.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => onToggle(role.id, !role.isActive)}
            data-testid={`button-toggle-role-${role.name}`}
          >
            {role.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          
          <PermissionGuard permission="roles.edit">
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => onEdit(role)}
              data-testid={`button-edit-role-${role.name}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </PermissionGuard>
          
          {!role.isSystem && (
            <PermissionGuard permission="roles.delete">
              <DestructiveActionButton
                action="delete role"
                permission="roles.delete"
                onConfirm={() => onDelete(role.id)}
                title="Delete Role"
                description={`Are you sure you want to delete the "${role.displayName}" role? This action cannot be undone and will affect ${role.userCount || 0} users.`}
                buttonText="Delete"
                size="sm"
                requiresStepUp={isSuperAdmin}
              >
                <Trash2 className="h-4 w-4" />
              </DestructiveActionButton>
            </PermissionGuard>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {role.description || 'No description available'}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Permissions:</span>
            <span className="text-muted-foreground">{role.permissions.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Users:</span>
            <span className="text-muted-foreground">{role.userCount || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Hierarchy:</span>
            <span className="text-muted-foreground">{role.hierarchy}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateRoleDialog({ open, onOpenChange, onCreateRole }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRole: (roleData: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    hierarchy: 0,
    permissions: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRole(formData);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      hierarchy: 0,
      permissions: []
    });
    onOpenChange(false);
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Define a new role with specific permissions and hierarchy level.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., content_moderator"
                required
              />
            </div>
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="e.g., Content Moderator"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this role's purpose"
            />
          </div>
          
          <div>
            <Label htmlFor="hierarchy">Hierarchy Level</Label>
            <Input
              id="hierarchy"
              type="number"
              value={formData.hierarchy}
              onChange={(e) => setFormData(prev => ({ ...prev, hierarchy: parseInt(e.target.value) || 0 }))}
              placeholder="0-99 (higher = more authority)"
              min="0"
              max="99"
            />
          </div>
          
          <div>
            <Label>Permissions</Label>
            <div className="space-y-4 mt-2 max-h-60 overflow-y-auto border rounded-md p-3">
              {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                <div key={category}>
                  <h4 className="font-medium text-sm mb-2">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {permissions.map(permission => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={formData.permissions.includes(permission)}
                          onCheckedChange={() => togglePermission(permission)}
                        />
                        <Label htmlFor={permission} className="text-xs">
                          {permission}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name || !formData.displayName}>
              Create Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminRolesPage() {
  const [selectedTab, setSelectedTab] = useState('roles');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission } = useAdminAuth();

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['/api/admin/roles'],
    enabled: hasPermission('roles.view'),
  });

  // Fetch role assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<RoleAssignment[]>({
    queryKey: ['/api/admin/role-assignments'],
    enabled: hasPermission('roles.view'),
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      return await apiRequest('POST', '/api/admin/roles', roleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
      toast({
        title: 'Success',
        description: 'Role created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create role',
        variant: 'destructive',
      });
    },
  });

  // Toggle role status mutation
  const toggleRoleMutation = useMutation({
    mutationFn: async ({ roleId, isActive }: { roleId: string; isActive: boolean }) => {
      return await apiRequest('PATCH', `/api/admin/roles/${roleId}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
      toast({
        title: 'Success',
        description: 'Role status updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role',
        variant: 'destructive',
      });
    },
  });

  const handleCreateRole = (roleData: any) => {
    createRoleMutation.mutate(roleData);
  };

  const handleToggleRole = (roleId: string, isActive: boolean) => {
    toggleRoleMutation.mutate({ roleId, isActive });
  };

  const handleEditRole = (role: Role) => {
    // TODO: Implement edit role dialog
    toast({
      title: 'Edit Role',
      description: 'Edit role functionality coming soon',
    });
  };

  const handleDeleteRole = (roleId: string) => {
    // TODO: Implement delete role
    toast({
      title: 'Delete Role',
      description: 'Delete role functionality coming soon',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-gray-600 mt-2">
              Manage user roles and permission assignments
            </p>
          </div>
          
          <PermissionGuard permission="roles.create">
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-role">
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </PermissionGuard>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="roles">Roles Overview</TabsTrigger>
            <TabsTrigger value="assignments">Role Assignments</TabsTrigger>
            <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-4">
            <PermissionGuard permission="roles.view" showError>
              {rolesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ceylon-green mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading roles...</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {roles.map((role: Role) => (
                    <RoleCard
                      key={role.id}
                      role={role}
                      onEdit={handleEditRole}
                      onToggle={handleToggleRole}
                      onDelete={handleDeleteRole}
                    />
                  ))}
                </div>
              )}
            </PermissionGuard>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <PermissionGuard permission="roles.view" showError>
              <Card>
                <CardHeader>
                  <CardTitle>Role Assignments</CardTitle>
                  <CardDescription>
                    View and manage user role assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {assignmentsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ceylon-green mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading assignments...</p>
                    </div>
                  ) : assignments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No role assignments found
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Assigned By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map((assignment: RoleAssignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {getDisplayName(assignment.user)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {assignment.user.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-blue-500 text-white">
                                {assignment.role.displayName}
                              </Badge>
                            </TableCell>
                            <TableCell>{assignment.assignedBy}</TableCell>
                            <TableCell>
                              {new Date(assignment.assignedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={assignment.isActive ? "default" : "secondary"}>
                                {assignment.isActive ? "Active" : "Revoked"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <PermissionGuard permission="roles.edit">
                                <Button variant="ghost" size="sm">
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </PermissionGuard>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </PermissionGuard>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <PermissionGuard permission="roles.view" showError>
              <Card>
                <CardHeader>
                  <CardTitle>Permission Matrix</CardTitle>
                  <CardDescription>
                    Overview of permissions across all roles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    Permission matrix visualization coming soon
                  </div>
                </CardContent>
              </Card>
            </PermissionGuard>
          </TabsContent>
        </Tabs>

        {/* Create Role Dialog */}
        <CreateRoleDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreateRole={handleCreateRole}
        />
      </div>
    </AdminLayout>
  );
}