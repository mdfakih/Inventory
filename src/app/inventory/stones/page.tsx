'use client';

import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import StonesTable from '@/components/inventory/stones-table';

export default function StonesPage() {
  const searchParams = useSearchParams();
  const inventoryType = searchParams.get('type') || 'internal';

  const isOutJob = inventoryType === 'out';
  const title = isOutJob
    ? 'Out Job Stones Inventory'
    : 'Internal Stones Inventory';
  const description = isOutJob
    ? 'Manage stones received from customers for out jobs'
    : 'Manage internal stone inventory with name, number, color, size, and quantity';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <StonesTable inventoryType={inventoryType} />
        </CardContent>
      </Card>
    </div>
  );
}
