'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import StonesTable from '@/components/inventory/stones-table';
import { Spinner } from '@/components/ui/spinner';

function StonesPageContent() {
  const searchParams = useSearchParams();
  const inventoryType = (searchParams.get('type') || 'internal') as
    | 'internal'
    | 'out';

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

export default function StonesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-8"><Spinner size="lg" /></div>}>
      <StonesPageContent />
    </Suspense>
  );
}
