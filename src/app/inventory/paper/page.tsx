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
import PaperTable from '@/components/inventory/paper-table';
import { Spinner } from '@/components/ui/spinner';

function PaperPageContent() {
  const searchParams = useSearchParams();
  const inventoryType = (searchParams.get('type') || 'internal') as
    | 'internal'
    | 'out';

  const isOutJob = inventoryType === 'out';
  const title = isOutJob
    ? 'Out Job Paper Inventory'
    : 'Internal Paper Inventory';
  const description = isOutJob
    ? 'Manage paper received from customers for out jobs'
    : 'Manage paper rolls with different widths and weights';

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
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

export default function PaperPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      }
    >
      <PaperPageContent />
    </Suspense>
  );
}
