'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PaperTable from '@/components/inventory/paper-table';

export default function PaperPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paper Inventory</h1>
        <p className="text-gray-600">Manage paper rolls with different widths and weights</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paper Inventory</CardTitle>
          <CardDescription>
            Manage paper rolls with different widths (9, 13, 16, 19, 20, 24 inches) and weights per piece
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaperTable />
        </CardContent>
      </Card>
    </div>
  );
}
