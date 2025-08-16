'use client';

import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import PaperTable from '@/components/inventory/paper-table';

export default function PaperPage() {
  const searchParams = useSearchParams();
  const inventoryType = searchParams.get('type') || 'internal';

  const isOutJob = inventoryType === 'out';
  const title = isOutJob
    ? 'Out Job Paper Inventory'
    : 'Internal Paper Inventory';
  const description = isOutJob
    ? 'Manage paper received from customers for out jobs'
    : 'Manage paper rolls with different widths and weights';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {isOutJob
              ? 'Manage paper received from customers for out jobs'
              : 'Manage paper rolls with different widths (9, 13, 16, 19, 20, 24 inches) and weights per piece'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaperTable inventoryType={inventoryType} />
        </CardContent>
      </Card>
    </div>
  );
}
