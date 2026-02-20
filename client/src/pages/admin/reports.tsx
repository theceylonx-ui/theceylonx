import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Flag, Clock, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface Report {
  id: string;
  context: string;
  reason: string;
  description?: string;
  status: string;
  reporterId: string;
  tripId?: string;
  userId?: string;
  createdAt: string;
  priority?: string;
}

export default function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery<{ reports: Report[]; total: number; pages: number }>({
    queryKey: ["/api/admin/reports", { status: statusFilter !== "all" ? statusFilter : "", page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await fetch(`/api/admin/reports?${params}`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Open</Badge>;
      case "investigating":
        return <Badge className="bg-blue-100 text-blue-700"><AlertTriangle className="h-3 w-3 mr-1" />Investigating</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      case "dismissed":
        return <Badge className="bg-gray-100 text-gray-700">Dismissed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const reportList = data?.reports || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Legacy Reports</h1>
          <p className="text-gray-600 mt-1">View and manage user-submitted reports</p>
        </div>

        <Card>
          <CardHeader>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ceylon-green"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportList.length > 0 ? (
                      reportList.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Flag className="h-4 w-4 text-red-400" />
                              <Badge variant="outline">{report.context}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{report.reason}</span>
                            {report.description && (
                              <p className="text-xs text-gray-500 mt-1 truncate max-w-[300px]">{report.description}</p>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(report.status)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          No reports found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
