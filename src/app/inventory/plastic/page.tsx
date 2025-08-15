'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PlasticTable from '@/components/inventory/plastic-table';

export default function PlasticPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plastic Inventory</h1>
        <p className="text-gray-600">Manage packaging plastic with different widths</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plastic Inventory</CardTitle>
          <CardDescription>
            Manage packaging plastic with different widths (12, 14, 16, 18, 20 inches)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlasticTable />
        </CardContent>
      </Card>
    </div>
  );
}
