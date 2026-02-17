import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Globe, Shield, Database, Server, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  const [clearResult, setClearResult] = useState<Record<string, number> | null>(null);

  const handleClearSampleData = async () => {
    if (!confirm("This will permanently delete ALL trips, questions, answers, chat messages, and notifications. Are you sure?")) {
      return;
    }
    if (!confirm("This action cannot be undone. Type OK to confirm you want to clear all sample data.")) {
      return;
    }
    setIsClearing(true);
    setClearResult(null);
    try {
      const response = await apiRequest("POST", "/api/admin/cleanup-sample-data");
      const data = await response.json();
      setClearResult(data.results);
      toast({
        title: "Sample Data Cleared",
        description: "All sample/test data has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear data",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Platform configuration and settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-ceylon-green" />
                General Settings
              </CardTitle>
              <CardDescription>Platform-wide configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Platform Name</span>
                <span className="text-sm text-gray-600">Ceylon Expand</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Domain</span>
                <span className="text-sm text-gray-600">www.theceylonx.com</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Environment</span>
                <Badge variant="secondary">Production</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-ceylon-green" />
                Security
              </CardTitle>
              <CardDescription>Security and access settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Rate Limiting</span>
                <Badge className="bg-green-100 text-green-700">Enabled</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">CORS Protection</span>
                <Badge className="bg-green-100 text-green-700">Enabled</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Input Validation</span>
                <Badge className="bg-green-100 text-green-700">Enabled</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-ceylon-green" />
                Database
              </CardTitle>
              <CardDescription>Database configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Provider</span>
                <span className="text-sm text-gray-600">Neon PostgreSQL</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">ORM</span>
                <span className="text-sm text-gray-600">Drizzle</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <Badge className="bg-green-100 text-green-700">Connected</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-ceylon-green" />
                Services
              </CardTitle>
              <CardDescription>Active platform services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">WebSocket</span>
                <Badge className="bg-green-100 text-green-700">Running</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Trip Archiver</span>
                <Badge className="bg-green-100 text-green-700">Running</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">AI Moderation</span>
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Trash2 className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Clear sample and test data from the database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 font-medium mb-2">Warning: This action is irreversible</p>
                <p className="text-sm text-red-600">This will delete all trips, quick trips, questions, answers, chat messages, chat threads, notifications, and interest requests from the database. User accounts will NOT be affected.</p>
              </div>
              <Button
                variant="destructive"
                onClick={handleClearSampleData}
                disabled={isClearing}
                className="w-full sm:w-auto"
              >
                {isClearing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Clearing Data...</>
                ) : (
                  <><Trash2 className="w-4 h-4 mr-2" /> Clear All Sample Data</>
                )}
              </Button>
              {clearResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
                  <p className="text-sm font-medium text-green-700 mb-2">Data cleared successfully:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(clearResult).map(([table, count]) => (
                      <div key={table} className="text-xs text-green-600">
                        <span className="font-medium">{table}:</span> {count} removed
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
