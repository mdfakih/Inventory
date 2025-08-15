'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StonesTable from '@/components/inventory/stones-table';

export default function StonesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stones Inventory</h1>
        <p className="text-gray-600">Manage stone inventory with name, number, color, size, and quantity</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stones Inventory</CardTitle>
          <CardDescription>
            Manage stone inventory with name, number, color, size, and quantity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StonesTable />
        </CardContent>
      </Card>
    </div>
  );
}
