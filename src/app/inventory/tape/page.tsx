'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TapeTable from '@/components/inventory/tape-table';

export default function TapePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tape Inventory</h1>
        <p className="text-gray-600">Manage cello tape inventory</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cello Tape Inventory</CardTitle>
          <CardDescription>
            Manage cello tape inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TapeTable />
        </CardContent>
      </Card>
    </div>
  );
}
