import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, Mail, Calendar, Shield, ChevronLeft, ChevronRight } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery<{
    users: AdminUser[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ["/api/admin/users", { search, role: roleFilter !== "all" ? roleFilter : "", page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "superadmin":
        return <Badge className="bg-yellow-500 text-white">Superadmin</Badge>;
      case "admin":
        return <Badge className="bg-blue-500 text-white">Admin</Badge>;
      case "moderator":
        return <Badge className="bg-green-500 text-white">Moderator</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  const getDisplayName = (user: AdminUser) => {
    return user.displayName || user.username || user.email || user.id;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">View and manage platform users</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or username..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ceylon-green"></div>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.users && data.users.length > 0 ? (
                        data.users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{getDisplayName(user)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-gray-600">
                                <Mail className="h-3 w-3" />
                                {user.email || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-gray-500 text-sm">
                                <Calendar className="h-3 w-3" />
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {data && data.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-600">
                      Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, data.total)} of {data.total} users
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm py-1 px-2">Page {page} of {data.totalPages}</span>
                      <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
