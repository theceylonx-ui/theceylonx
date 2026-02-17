import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Calendar, Users, ChevronLeft, ChevronRight, FileText } from "lucide-react";

interface AdminTrip {
  id: string;
  title: string;
  fromLocation: string;
  toLocation: string;
  date: string;
  status: string;
  seatsAvailable: number;
  organizerId: string;
  createdAt: string;
}

export default function AdminTripsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery<{
    trips: AdminTrip[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ["/api/admin/trips", { status: statusFilter !== "all" ? statusFilter : "", page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await fetch(`/api/admin/trips?${params}`);
      if (!res.ok) throw new Error("Failed to fetch trips");
      return res.json();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-700">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
      case "archived":
        return <Badge className="bg-yellow-100 text-yellow-700">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Management</h1>
          <p className="text-gray-600 mt-1">View and manage all platform trips</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
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
                        <TableHead>Trip</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.trips && data.trips.length > 0 ? (
                        data.trips.map((trip) => (
                          <TableRow key={trip.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span className="font-medium truncate max-w-[200px]">{trip.title}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="h-3 w-3" />
                                {trip.fromLocation} → {trip.toLocation}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Calendar className="h-3 w-3" />
                                {trip.date ? new Date(trip.date).toLocaleDateString() : "N/A"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Users className="h-3 w-3 text-gray-400" />
                                {trip.seatsAvailable}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(trip.status)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            No trips found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {data && data.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-600">
                      Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, data.total)} of {data.total} trips
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
