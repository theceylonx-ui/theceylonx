import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, AlertTriangle, CheckCircle, X, Trash2, UserX, Edit } from "lucide-react";
import { AdminChatModal } from "./AdminChatModal";

interface Report {
  id: string;
  tripId: string;
  userId: string;
  reporterId: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
}

export function AdminReportsTable() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reports
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["/api/admin/reports"],
  });

  // Update report status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ reportId, status, action }: { reportId: string; status: string; action?: string }) => {
      return await apiRequest(`/api/admin/reports/${reportId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, action }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({
        title: "Success",
        description: `Report ${data.status} successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive",
      });
    },
  });

  const handleMessageOrganizer = async (report: Report) => {
    // First, get trip details to find organizer name
    try {
      const trip = await apiRequest(`/api/trips/${report.tripId}`);
      setSelectedReport({
        ...report,
        tripTitle: trip.title,
        organizerName: `${trip.organizer?.firstName || ''} ${trip.organizer?.lastName || ''}`.trim() || 'Unknown',
      });
      setChatModalOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load trip details",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Pending</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-500">Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="secondary">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReasonBadge = (reason: string) => {
    const colors = {
      'spam': 'bg-red-500',
      'inappropriate_content': 'bg-orange-500',
      'fake_listing': 'bg-purple-500',
      'harassment': 'bg-red-600',
      'safety_concern': 'bg-yellow-500',
      'suspicious_behavior': 'bg-blue-500',
      'other': 'bg-gray-500',
    };
    
    const color = colors[reason as keyof typeof colors] || 'bg-gray-500';
    const label = reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return <Badge className={`${color} text-white`}>{label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Trip Reports</h2>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {reports.length} Total Reports
        </Badge>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report Details</TableHead>
              <TableHead>Trip</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report: Report) => (
              <TableRow key={report.id} data-testid={`report-row-${report.id}`}>
                <TableCell>
                  <div className="space-y-2">
                    {getReasonBadge(report.reason)}
                    {report.description && (
                      <p className="text-sm text-muted-foreground max-w-xs truncate">
                        "{report.description}"
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="font-medium">Trip ID: {report.tripId}</p>
                    <p className="text-muted-foreground">Organizer ID: {report.userId}</p>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(report.status)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDate(report.createdAt)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {/* Message Organizer Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMessageOrganizer(report)}
                      className="flex items-center gap-1"
                      data-testid={`button-message-organizer-${report.id}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Button>

                    {/* Quick Actions */}
                    {report.status === 'pending' && (
                      <div className="flex gap-1">
                        <Select
                          onValueChange={(action) => {
                            if (action === 'resolve') {
                              updateStatusMutation.mutate({ reportId: report.id, status: 'resolved' });
                            } else if (action === 'dismiss') {
                              updateStatusMutation.mutate({ reportId: report.id, status: 'dismissed' });
                            } else {
                              updateStatusMutation.mutate({ reportId: report.id, status: 'resolved', action });
                            }
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Action" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="resolve">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Resolve
                              </div>
                            </SelectItem>
                            <SelectItem value="dismiss">
                              <div className="flex items-center gap-2">
                                <X className="w-4 h-4" />
                                Dismiss
                              </div>
                            </SelectItem>
                            <SelectItem value="delete_trip">
                              <div className="flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                Delete Trip
                              </div>
                            </SelectItem>
                            <SelectItem value="suspend_user">
                              <div className="flex items-center gap-2">
                                <UserX className="w-4 h-4" />
                                Suspend User
                              </div>
                            </SelectItem>
                            <SelectItem value="edit_trip">
                              <div className="flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Edit Trip
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {reports.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Reports Found</h3>
            <p className="text-muted-foreground">All reports have been processed or no reports have been submitted yet.</p>
          </div>
        )}
      </div>

      {/* Admin Chat Modal */}
      {selectedReport && (
        <AdminChatModal
          isOpen={chatModalOpen}
          onClose={() => {
            setChatModalOpen(false);
            setSelectedReport(null);
          }}
          reportId={selectedReport.id}
          reportDetails={{
            tripTitle: selectedReport.tripTitle || 'Unknown Trip',
            organizerName: selectedReport.organizerName || 'Unknown Organizer',
            reason: selectedReport.reason,
            description: selectedReport.description,
          }}
        />
      )}
    </div>
  );
}