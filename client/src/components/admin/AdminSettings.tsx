import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Image, Settings, Trash2, Upload } from "lucide-react";

interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingSetting, setEditingSetting] = useState<SiteSetting | null>(null);
  const [newSettingForm, setNewSettingForm] = useState({
    key: '',
    value: '',
    description: '',
    category: 'general'
  });

  // Fetch all site settings
  const { data: settings = [], isLoading } = useQuery<SiteSetting[]>({
    queryKey: ['/api/admin/settings'],
  });

  // Create/Update setting mutation
  const createSettingMutation = useMutation({
    mutationFn: async (setting: { key: string; value: string; description: string; category: string }) => {
      return await apiRequest("POST", "/api/admin/settings", setting);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      setNewSettingForm({ key: '', value: '', description: '', category: 'general' });
      toast({
        title: "Success",
        description: "Setting created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create setting.",
        variant: "destructive",
      });
    },
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, ...data }: { key: string; value: string; description: string; category: string }) => {
      return await apiRequest("PUT", `/api/admin/settings/${key}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      setEditingSetting(null);
      toast({
        title: "Success",
        description: "Setting updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to update setting.",
        variant: "destructive",
      });
    },
  });

  // Delete setting mutation
  const deleteSettingMutation = useMutation({
    mutationFn: async (key: string) => {
      return await apiRequest("DELETE", `/api/admin/settings/${key}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Success",
        description: "Setting deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete setting.",
        variant: "destructive",
      });
    },
  });

  // Handle background image upload
  const handleBackgroundImageUpload = async () => {
    const response = await apiRequest("POST", "/api/admin/settings/background-upload");
    return await response.json() as {
      method: "PUT";
      url: string;
    };
  };

  const handleBackgroundImageComplete = async (uploadUrl: string) => {
    try {
      // Update the landing_background_image setting
      await updateSettingMutation.mutateAsync({
        key: 'landing_background_image',
        value: uploadUrl.split('?')[0], // Remove query parameters
        description: 'Background image URL for the landing page hero section',
        category: 'appearance'
      });
    } catch (error) {
      console.error('Failed to update background image setting:', error);
    }
  };

  const handleCreateSetting = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSettingForm.key && newSettingForm.value) {
      createSettingMutation.mutate(newSettingForm);
    }
  };

  const handleUpdateSetting = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSetting) {
      updateSettingMutation.mutate({
        key: editingSetting.key,
        value: editingSetting.value || '',
        description: editingSetting.description || '',
        category: editingSetting.category || 'general'
      });
    }
  };

  // Find background image setting
  const backgroundImageSetting = settings.find(s => s.key === 'landing_background_image');

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Site Settings</h1>
      </div>

      {/* Background Image Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Image className="h-5 w-5" />
            <span>Landing Page Background</span>
          </CardTitle>
          <CardDescription>
            Upload and manage the background image for the landing page hero section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {backgroundImageSetting?.value && (
            <div className="space-y-2">
              <Label>Current Background Image</Label>
              <div className="relative max-w-md">
                <img
                  src={backgroundImageSetting.value}
                  alt="Current background"
                  className="w-full h-32 object-cover rounded border"
                />
              </div>
              <p className="text-sm text-gray-600">
                URL: {backgroundImageSetting.value}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Upload New Background Image</Label>
            <ObjectUploader
              maxFileSize={10 * 1024 * 1024} // 10MB
              accept="image/*"
              onGetUploadParameters={handleBackgroundImageUpload}
              onComplete={handleBackgroundImageComplete}
              buttonClassName="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Background Image
            </ObjectUploader>
            <p className="text-xs text-gray-500">
              Recommended: 1920x1080px or higher. JPG, PNG, or WebP format. Max 10MB.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Create New Setting */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Setting</CardTitle>
          <CardDescription>
            Add a new site configuration setting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateSetting} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="key">Key</Label>
                <Input
                  id="key"
                  value={newSettingForm.key}
                  onChange={(e) => setNewSettingForm(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="setting_key"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newSettingForm.category}
                  onValueChange={(value) => setNewSettingForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="appearance">Appearance</SelectItem>
                    <SelectItem value="features">Features</SelectItem>
                    <SelectItem value="integrations">Integrations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                value={newSettingForm.value}
                onChange={(e) => setNewSettingForm(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Setting value"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newSettingForm.description}
                onChange={(e) => setNewSettingForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <Button 
              type="submit" 
              disabled={createSettingMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createSettingMutation.isPending ? "Creating..." : "Create Setting"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Settings</CardTitle>
          <CardDescription>
            Manage your site configuration settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No settings configured yet.</p>
          ) : (
            <div className="space-y-4">
              {settings.map((setting) => (
                <div key={setting.id} className="border rounded p-4 space-y-2">
                  {editingSetting?.id === setting.id ? (
                    <form onSubmit={handleUpdateSetting} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Key</Label>
                          <Input value={setting.key} disabled />
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Select
                            value={editingSetting.category || 'general'}
                            onValueChange={(value) => setEditingSetting(prev => prev ? { ...prev, category: value } : null)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="appearance">Appearance</SelectItem>
                              <SelectItem value="features">Features</SelectItem>
                              <SelectItem value="integrations">Integrations</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Value</Label>
                        <Input
                          value={editingSetting.value || ''}
                          onChange={(e) => setEditingSetting(prev => prev ? { ...prev, value: e.target.value } : null)}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={editingSetting.description || ''}
                          onChange={(e) => setEditingSetting(prev => prev ? { ...prev, description: e.target.value } : null)}
                          rows={2}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          type="submit" 
                          disabled={updateSettingMutation.isPending}
                          size="sm"
                        >
                          {updateSettingMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingSetting(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                              {setting.key}
                            </code>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {setting.category || 'general'}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{setting.value}</p>
                          {setting.description && (
                            <p className="text-xs text-gray-600">{setting.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSetting(setting)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSettingMutation.mutate(setting.key)}
                            disabled={deleteSettingMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}