import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tags, MapPin, Compass, Mountain } from "lucide-react";

const CATEGORIES = [
  { name: "Adventure", icon: Mountain, count: 0 },
  { name: "Cultural", icon: Compass, count: 0 },
  { name: "Beach", icon: Compass, count: 0 },
  { name: "Wildlife", icon: Compass, count: 0 },
  { name: "Food & Drink", icon: Compass, count: 0 },
  { name: "Hiking", icon: Mountain, count: 0 },
  { name: "Photography", icon: Compass, count: 0 },
  { name: "Spiritual", icon: Compass, count: 0 },
];

const REGIONS = [
  "Western Province", "Central Province", "Southern Province",
  "Northern Province", "Eastern Province", "North Western Province",
  "North Central Province", "Uva Province", "Sabaragamuwa Province",
];

export default function AdminTaxonomyPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Taxonomy</h1>
          <p className="text-gray-600 mt-1">Manage trip categories, regions, and tags</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-ceylon-green" />
                Trip Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {CATEGORIES.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <cat.icon className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">{cat.name}</span>
                    </div>
                    <Badge variant="secondary">{cat.count} trips</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-ceylon-green" />
                Regions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {REGIONS.map((region) => (
                  <div key={region} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">{region}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
